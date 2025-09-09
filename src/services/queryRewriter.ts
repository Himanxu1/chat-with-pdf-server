import { llm } from '../config/llm.js'
import logger from '../utils/logger.js'

export interface QueryRewritingResult {
  originalQuery: string
  rewrittenQuery: string
  keywords: string[]
  intent: string
  confidence: number
}

export class QueryRewriterService {
  private static instance: QueryRewriterService

  static getInstance() {
    if (!QueryRewriterService.instance) {
      QueryRewriterService.instance = new QueryRewriterService()
    }
    return QueryRewriterService.instance
  }

  /**
   * Rewrites user queries to improve retrieval and response quality
   */
  async rewriteQuery(originalQuery: string, context?: string): Promise<QueryRewritingResult> {
    try {
      if (!llm) {
        logger.warn('LLM not available, returning original query')
        return {
          originalQuery,
          rewrittenQuery: originalQuery,
          keywords: this.extractKeywords(originalQuery),
          intent: 'unknown',
          confidence: 0.5
        }
      }

      const rewritingPrompt = `
You are an expert query rewriter for a RAG (Retrieval-Augmented Generation) system that processes PDF documents.

Your task is to rewrite user queries to improve document retrieval and answer quality. Consider the following:

1. **Clarity**: Make the query more specific and clear
2. **Keywords**: Extract and emphasize important keywords
3. **Context**: If provided, use context to better understand the query
4. **Intent**: Identify the user's intent (factual, analytical, comparative, etc.)
5. **Synonyms**: Include relevant synonyms and alternative phrasings

Original Query: "${originalQuery}"
${context ? `Context: "${context}"` : ''}

Please provide a JSON response with the following structure:
{
  "rewrittenQuery": "The improved query",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "intent": "factual|analytical|comparative|procedural|definitional",
  "confidence": 0.85,
  "reasoning": "Brief explanation of changes made"
}

Focus on making the query more searchable while preserving the original intent.
`

      const response = await llm.invoke([
        ["system", "You are a helpful assistant that rewrites queries for better document retrieval."],
        ["human", rewritingPrompt]
      ])

      let answerText = ""
      if (typeof response === "string") {
        answerText = response
      } else if (typeof response?.content === "string") {
        answerText = response.content
      } else if (Array.isArray(response?.content)) {
        answerText = response.content
          .map((c: any) => typeof c === "string" ? c : c?.text || c?.content || "")
          .filter(Boolean)
          .join("\n")
      }

      // Try to parse JSON response
      try {
        const parsed = JSON.parse(answerText)
        return {
          originalQuery,
          rewrittenQuery: parsed.rewrittenQuery || originalQuery,
          keywords: parsed.keywords || this.extractKeywords(originalQuery),
          intent: parsed.intent || 'unknown',
          confidence: parsed.confidence || 0.7
        }
      } catch {
        logger.warn('Failed to parse query rewriting response, using fallback')
        return {
          originalQuery,
          rewrittenQuery: originalQuery,
          keywords: this.extractKeywords(originalQuery),
          intent: 'unknown',
          confidence: 0.5
        }
      }

    } catch (error) {
      logger.error('Error in query rewriting:', error)
      return {
        originalQuery,
        rewrittenQuery: originalQuery,
        keywords: this.extractKeywords(originalQuery),
        intent: 'unknown',
        confidence: 0.3
      }
    }
  }

  /**
   * Extract keywords from query using simple heuristics
   */
  private extractKeywords(query: string): string[] {
    // Remove common stop words and extract meaningful words
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'what', 'when', 'where', 'why', 'how',
      'who', 'which', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    ])

    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10) // Limit to 10 keywords
  }

  /**
   * Generate multiple query variations for better retrieval
   */
  async generateQueryVariations(query: string): Promise<string[]> {
    try {
      if (!llm) {
        return [query]
      }

      const variationPrompt = `
Generate 3 different ways to ask the same question for better document retrieval:

Original Query: "${query}"

Provide variations that:
1. Use different wording but same meaning
2. Include synonyms and related terms
3. Vary the sentence structure
4. Focus on different aspects of the question

Return as a JSON array: ["variation1", "variation2", "variation3"]
`

      const response = await llm.invoke([
        ["system", "You are a helpful assistant that generates query variations."],
        ["human", variationPrompt]
      ])

      let answerText = ""
      if (typeof response === "string") {
        answerText = response
      } else if (typeof response?.content === "string") {
        answerText = response.content
      }

      try {
        const variations = JSON.parse(answerText)
        return Array.isArray(variations) ? variations.slice(0, 3) : [query]
      } catch {
        return [query]
      }
    } catch (error) {
      logger.error('Error generating query variations:', error)
      return [query]
    }
  }

  /**
   * Analyze query complexity and suggest retrieval strategy
   */
  analyzeQueryComplexity(query: string): {
    complexity: 'simple' | 'moderate' | 'complex'
    requiresMultiplePasses: boolean
    suggestedChunkSize: number
  } {
    const wordCount = query.split(/\s+/).length
    const hasMultipleQuestions = (query.match(/\?/g) || []).length > 1
    const hasComplexTerms = /(analyze|compare|contrast|evaluate|explain|describe|summarize)/i.test(query)

    let complexity: 'simple' | 'moderate' | 'complex' = 'simple'
    let requiresMultiplePasses = false
    let suggestedChunkSize = 1000

    if (wordCount > 20 || hasMultipleQuestions || hasComplexTerms) {
      complexity = 'complex'
      requiresMultiplePasses = true
      suggestedChunkSize = 500
    } else if (wordCount > 10 || hasComplexTerms) {
      complexity = 'moderate'
      requiresMultiplePasses = false
      suggestedChunkSize = 750
    }

    return {
      complexity,
      requiresMultiplePasses,
      suggestedChunkSize
    }
  }
}

export const queryRewriterService = QueryRewriterService.getInstance()
