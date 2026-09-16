import { useMutation } from "@tanstack/react-query";
import { sendOTP, type SendOTPResponse } from "#/lib/api/auth-controller";
import { toast } from "sonner";
import { friendlyError } from "#/lib/api/friendly-error";

export function useSendOtpMutation() {
  return useMutation({
    mutationKey: ["admin", "send-otp"],
    mutationFn: async (email: string): Promise<SendOTPResponse> => {
      return await sendOTP(email);
    },
    onSuccess: () => {
      toast.success("Sign-in code sent", {
        description: "Check your email for the code.",
      });
    },
    onError: (error) => {
      toast.error("Couldn't send the code", {
        description: friendlyError(error, "Try again in a moment."),
      });
    },
  });
}
