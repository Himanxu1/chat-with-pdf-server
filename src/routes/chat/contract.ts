import z from "zod";

export const uploadPdfSchema = z.object({
  pdf: z.any().refine((pdf) => pdf && pdf.mimetype === "application/pdf", {
    message: "Only PDF files are allowed",
  }),
});

export const chatSchema = z.object({
  question: z.string().min(1, "Question is required"),
});
