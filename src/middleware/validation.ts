// src/middleware/validation.ts
import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

export const uploadPdfSchema = z.object({
  file: z.any().refine((file) => file && file.mimetype === "application/pdf", {
    message: "Only PDF files are allowed",
  }),
});

export const chatSchema = z.object({
  question: z.string().min(1, "Question is required"),
});

export const websiteUploadSchema = z.object({
  url: z.string().url("Valid URL is required"),
  sessionId: z.string().min(1, "Session ID is required"),
});

export const websiteChatSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  message: z.string().min(1, "Message is required"),
});

export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors,
        });
        return;
      }
      next(error);
    }
  };
};
