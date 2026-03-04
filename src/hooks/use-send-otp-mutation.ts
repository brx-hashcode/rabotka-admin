import { useMutation } from "@tanstack/react-query";
import { sendOTP, type SendOTPResponse } from "#/lib/api/auth-controller";
import { toast } from "sonner";

export function useSendOtpMutation() {
  return useMutation({
    mutationKey: ["admin", "send-otp"],
    mutationFn: async (email: string): Promise<SendOTPResponse> => {
      return await sendOTP(email);
    },
    onSuccess: () => {
      toast.success("Code OTP envoyé", {
        description: "Vérifiez votre email pour le code.",
      });
    },
    onError: (error) => {
      toast.error("Échec de l'envoi", {
        description: error.message,
      });
    },
  });
}
