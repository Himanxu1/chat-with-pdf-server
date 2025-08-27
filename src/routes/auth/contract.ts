import z from "zod";

export const loginSchema = z.object({
  email: z.string().email("email is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const registerSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});
