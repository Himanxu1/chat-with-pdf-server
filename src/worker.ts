// This file is deprecated - use src/workers/pdf.worker.ts instead
// Keeping for backward compatibility but the worker is now started in src/index.ts

import { pdfWorker } from "./workers/pdf.worker.js";

console.log("PDF Worker started");

// Keep the worker running
process.on("SIGINT", async () => {
  console.log("Shutting down worker...");
  await pdfWorker.close();
  process.exit(0);
});
