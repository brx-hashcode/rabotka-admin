import { useEffect, useState } from "react";
import {
  createFileRoute,
  redirect,
  useNavigate,
  isRedirect,
} from "@tanstack/react-router";
import { fetchAndSetCsrfToken } from "#/lib/api/csrf-token";

import rabotkaLogo from "#/assets/rabotka-logo.png";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import { Step1EmailForm } from "#/features/auth/components/step1-email-form";
import { Step2OtpForm } from "#/features/auth/components/step2-otp-form";
import { useSendOtpMutation } from "#/hooks/use-send-otp-mutation";
import { useVerifyOtpMutation } from "#/hooks/use-verify-otp-mutation";
import { getMe } from "#/lib/api/auth-controller";

export const Route = createFileRoute("/auth/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    from: typeof search.from === "string" ? search.from : undefined,
  }),
  beforeLoad: async () => {
    try {
      await getMe();
      throw redirect({ to: "/" });
    } catch (error) {
      if (isRedirect(error)) throw error;
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { from } = Route.useSearch();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");

  useEffect(() => {
    void fetchAndSetCsrfToken();
  }, []);

  const sendOtp = useSendOtpMutation();
  const verifyOtp = useVerifyOtpMutation();

  async function handleSendOtp(data: { email: string }) {
    await sendOtp.mutateAsync(data.email);
    setEmail(data.email);
    setStep(2);
  }

  async function handleVerifyOtp(data: { otp: string }) {
    await verifyOtp.mutateAsync({ email, otp: data.otp });
    await navigate({ to: from ?? "/" });
  }

  async function handleResend() {
    await sendOtp.mutateAsync(email);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center space-y-1">
            <div className="flex justify-center mb-2">
              <img src={rabotkaLogo} alt="Rabotka" className="h-14 w-auto" />
            </div>
            <CardTitle className="text-xl">
              {step === 1 ? "Admin sign in" : "Verification"}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? "Enter your email to receive an OTP code"
                : "Enter the 6-digit code sent to your email"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === 1 ? (
              <Step1EmailForm
                onSubmit={handleSendOtp}
                isLoading={sendOtp.isPending}
                serverError={
                  sendOtp.isError ? (sendOtp.error?.message ?? null) : null
                }
              />
            ) : (
              <Step2OtpForm
                email={email}
                onSubmit={handleVerifyOtp}
                onResend={handleResend}
                onBack={() => setStep(1)}
                isVerifying={verifyOtp.isPending}
                isResending={sendOtp.isPending}
                serverError={
                  verifyOtp.isError ? (verifyOtp.error?.message ?? null) : null
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
