import z from "zod";

export const websiteUploadSchema = z.object({
  url: z.string().url("Valid URL is required"),
  sessionId: z.string().min(1, "Session ID is required"),
});

export const websiteChatSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  message: z.string().min(1, "Message is required"),
});
