// src/jobs/pdf.types.ts
export interface PdfJobData {
  filename: string;
  destination: string;
  path: string;
}

export interface PdfJobResult {
  chunks: number;
  collection: string;
}
