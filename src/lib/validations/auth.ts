import { z } from "zod";

export const emailSchema = z.string().email("Email invalide");

export const otpSchema = z
  .string()
  .min(6, "Le code OTP doit contenir 6 chiffres")
  .max(6, "Le code OTP doit contenir 6 chiffres");
