import { z } from "zod";

export const emailSchema = z.string().email("Enter a valid email address");

export const otpSchema = z
  .string()
  .min(6, "The code has 6 digits")
  .max(6, "The code has 6 digits");
