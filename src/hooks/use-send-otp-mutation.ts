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
      toast.success("OTP code sent", {
        description: "Check your email for the code.",
      });
    },
    onError: (error) => {
      toast.error("Failed to send code", {
        description: error.message,
      });
    },
  });
}
