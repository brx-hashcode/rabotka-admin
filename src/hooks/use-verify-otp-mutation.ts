import { useMutation } from "@tanstack/react-query";
import { verifyOTP, type VerifyOTPResponse } from "#/lib/api/auth-controller";
import { toast } from "sonner";
import { friendlyError } from "#/lib/api/friendly-error";

type VerifyOtpVariables = {
  email: string;
  otp: string;
};

export function useVerifyOtpMutation() {
  return useMutation({
    mutationKey: ["admin", "verify-otp"],
    mutationFn: async ({
      email,
      otp,
    }: VerifyOtpVariables): Promise<VerifyOTPResponse> => {
      return await verifyOTP(email, otp);
    },
    onSuccess: () => {
      toast.success("You're signed in");
    },
    onError: (error) => {
      toast.error("That code didn't work", {
        description: friendlyError(error, "Check the code and try again."),
      });
    },
  });
}
