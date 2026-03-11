import { useMutation } from "@tanstack/react-query";
import { verifyOTP, type VerifyOTPResponse } from "#/lib/api/auth-controller";
import { toast } from "sonner";

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
      toast.success("Authentification réussie");
    },
    onError: (error) => {
      toast.error("Code invalide", {
        description: error.message,
      });
    },
  });
}
