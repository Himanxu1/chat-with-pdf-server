import { QdrantVectorStore } from '@langchain/qdrant'
import { embeddings } from '../config/embeddings.js'
import { queryRewriterService } from './queryRewriter.js'
import type { QueryRewritingResult } from './queryRewriter.js'
import logger from '../utils/logger.js'

export interface RetrievalResult {
  content: string
  metadata: any
  score: number
  source: string
}

export interface EnhancedRetrievalOptions {
  pdfId: string
  originalQuery: string
  maxResults?: number
  minScore?: number
  useQueryRewriting?: boolean
  useHybridSearch?: boolean
}

export class EnhancedRetrieverService {
  private static instance: EnhancedRetrieverService

  static getInstance() {
    if (!EnhancedRetrieverService.instance) {
      EnhancedRetrieverService.instance = new EnhancedRetrieverService()
    }
    return EnhancedRetrieverService.instance
  }

  /**
   * Enhanced retrieval with query rewriting and multiple strategies
   */
  async retrieveDocuments(options: EnhancedRetrievalOptions): Promise<{
    results: RetrievalResult[]
    queryAnalysis: QueryRewritingResult
    retrievalStrategy: string
  }> {
    const {
      pdfId,
      originalQuery,
      maxResults = 5,
      minScore = 0.7,
      useQueryRewriting = true,
      useHybridSearch = true
    } = options

    try {
      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        embeddings!,
        {
          url: "http://localhost:6333",
          collectionName: "langchainjs-testing",
        }
      )

      let queryAnalysis: QueryRewritingResult
      let retrievalStrategy = 'standard'

      // Step 1: Analyze and rewrite query if enabled
      if (useQueryRewriting) {
        queryAnalysis = await queryRewriterService.rewriteQuery(originalQuery)
        logger.info(`Query rewritten: "${originalQuery}" -> "${queryAnalysis.rewrittenQuery}"`)
      } else {
        queryAnalysis = {
          originalQuery,
          rewrittenQuery: originalQuery,
          keywords: [],
          intent: 'unknown',
          confidence: 1.0
        }
      }

      // Step 2: Determine retrieval strategy based on query complexity
      const complexity = queryRewriterService.analyzeQueryComplexity(queryAnalysis.rewrittenQuery)
      
      let allResults: RetrievalResult[] = []

      if (useHybridSearch && complexity.complexity === 'complex') {
        // Hybrid search: Combine semantic and keyword-based retrieval
        retrievalStrategy = 'hybrid'
        allResults = await this.performHybridSearch(
          vectorStore,
          queryAnalysis,
          pdfId,
          maxResults * 2
        )
      } else {
        // Standard semantic search
        retrievalStrategy = 'semantic'
        const semanticResults = await this.performSemanticSearch(
          vectorStore,
          queryAnalysis.rewrittenQuery,
          pdfId,
          maxResults * 2
        )
        allResults = semanticResults
      }

      // Step 3: Re-rank and filter results
      const filteredResults = allResults
        .filter(result => result.score >= minScore)
        .slice(0, maxResults)

      // Step 4: Add context and metadata
      const enrichedResults = filteredResults.map(result => ({
        ...result,
        relevanceReason: this.generateRelevanceReason(result, queryAnalysis),
        chunkIndex: result.metadata?.chunkIndex || 0
      }))

      logger.info(`Retrieved ${enrichedResults.length} documents for query: "${originalQuery}"`)

      return {
        results: enrichedResults,
        queryAnalysis,
        retrievalStrategy
      }

    } catch (error) {
      logger.error('Error in enhanced retrieval:', error)
      throw error
    }
  }

  /**
   * Perform semantic search using vector similarity
   */
  private async performSemanticSearch(
    vectorStore: QdrantVectorStore,
    query: string,
    pdfId: string,
    maxResults: number
  ): Promise<RetrievalResult[]> {
    const retriever = await vectorStore.asRetriever({
      k: maxResults,
      filter: {
        must: [
          {
            key: "metadata.pdfId",
            match: {
              value: pdfId,
            },
          },
        ],
      },
    })

    const results = await retriever.invoke(query)
    
    return results.map((doc: any, index: number) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
      score: 1.0 - (index * 0.1), // Simple scoring based on rank
      source: `chunk_${doc.metadata?.chunkIndex || index}`
    }))
  }

  /**
   * Perform hybrid search combining semantic and keyword matching
   */
  private async performHybridSearch(
    vectorStore: QdrantVectorStore,
    queryAnalysis: QueryRewritingResult,
    pdfId: string,
    maxResults: number
  ): Promise<RetrievalResult[]> {
    // Get semantic results
    const semanticResults = await this.performSemanticSearch(
      vectorStore,
      queryAnalysis.rewrittenQuery,
      pdfId,
      maxResults
    )

    // Get keyword-based results if we have keywords
    let keywordResults: RetrievalResult[] = []
    if (queryAnalysis.keywords.length > 0) {
      keywordResults = await this.performKeywordSearch(
        vectorStore,
        queryAnalysis.keywords,
        pdfId,
        maxResults
      )
    }

    // Combine and deduplicate results
    const combinedResults = this.combineAndRankResults(semanticResults, keywordResults)
    
    return combinedResults.slice(0, maxResults)
  }

  /**
   * Perform keyword-based search
   */
  private async performKeywordSearch(
    vectorStore: QdrantVectorStore,
    keywords: string[],
    pdfId: string,
    maxResults: number
  ): Promise<RetrievalResult[]> {
    // For now, we'll use semantic search with individual keywords
    // In a more sophisticated implementation, you might use BM25 or other keyword-based methods
    const keywordQuery = keywords.join(' ')
    
    const retriever = await vectorStore.asRetriever({
      k: maxResults,
      filter: {
        must: [
          {
            key: "metadata.pdfId",
            match: {
              value: pdfId,
            },
          },
        ],
      },
    })

    const results = await retriever.invoke(keywordQuery)
    
    return results.map((doc: any, index: number) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
      score: 0.8 - (index * 0.05), // Lower base score for keyword results
      source: `keyword_chunk_${doc.metadata?.chunkIndex || index}`
    }))
  }

  /**
   * Combine semantic and keyword results with intelligent ranking
   */
  private combineAndRankResults(
    semanticResults: RetrievalResult[],
    keywordResults: RetrievalResult[]
  ): RetrievalResult[] {
    const resultMap = new Map<string, RetrievalResult>()

    // Add semantic results with higher weight
    semanticResults.forEach(result => {
      const key = result.metadata?.chunkIndex?.toString() || result.content.slice(0, 50)
      resultMap.set(key, {
        ...result,
        score: result.score * 1.2 // Boost semantic results
      })
    })

    // Add keyword results, combining scores if duplicate
    keywordResults.forEach(result => {
      const key = result.metadata?.chunkIndex?.toString() || result.content.slice(0, 50)
      const existing = resultMap.get(key)
      
      if (existing) {
        // Combine scores for duplicate results
        existing.score = Math.max(existing.score, result.score * 0.8)
      } else {
        resultMap.set(key, result)
      }
    })

    // Sort by score and return
    return Array.from(resultMap.values())
      .sort((a, b) => b.score - a.score)
  }

  /**
   * Generate a reason for why a result is relevant
   */
  private generateRelevanceReason(result: RetrievalResult, queryAnalysis: QueryRewritingResult): string {
    const keywords = queryAnalysis.keywords
    const foundKeywords = keywords.filter(keyword => 
      result.content.toLowerCase().includes(keyword.toLowerCase())
    )

    if (foundKeywords.length > 0) {
      return `Contains relevant keywords: ${foundKeywords.join(', ')}`
    }

    if (result.score > 0.9) {
      return 'High semantic similarity to query'
    }

    return 'Relevant content match'
  }
}

export const enhancedRetrieverService = EnhancedRetrieverService.getInstance()
