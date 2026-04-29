import { useEffect, useState } from "react";
import {
  createFileRoute,
  redirect,
  useNavigate,
  isRedirect,
  useSearch,
} from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { fetchAndSetCsrfToken } from "#/lib/api/csrf-token";

import rabotkaLogo from "#/assets/rabotka-logo.png";
import { ChatDoodleBg } from "#/pages/profile-detail/components/chat-doodle-bg";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Step1EmailForm } from "#/features/auth/components/step1-email-form";
import { Step2OtpForm } from "#/features/auth/components/step2-otp-form";
import { QrLoginDialog } from "#/features/auth/components/qr-login-dialog";
import { useSendOtpMutation } from "#/hooks/use-send-otp-mutation";
import { useVerifyOtpMutation } from "#/hooks/use-verify-otp-mutation";
import { getMe, totpLogin } from "#/lib/api/auth-controller";
import { toast } from "sonner";

function getSafeRedirectTarget(raw: string): string | null {
  if (!raw) return null;

  try {
    const url = new URL(raw, globalThis.location.origin);
    if (url.origin !== globalThis.location.origin) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/auth/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "",
  }),
  beforeLoad: async ({ location }) => {
    try {
      await getMe();

      const redirectParam = new URL(
        location.href,
        globalThis.location.origin,
      ).searchParams.get("redirect");
      const safeTarget = getSafeRedirectTarget(redirectParam ?? "");

      if (safeTarget) {
        globalThis.location.replace(safeTarget);
        return;
      }

      throw redirect({ to: "/" });
    } catch (error) {
      if (isRedirect(error)) throw error;
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect: redirectTarget } = useSearch({ from: "/auth/login" });
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [pendingToken, setPendingToken] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    void fetchAndSetCsrfToken();
  }, []);

  const sendOtp = useSendOtpMutation();
  const verifyOtp = useVerifyOtpMutation();

  const verifyTotp = useMutation({
    mutationFn: () => totpLogin(pendingToken, totpCode),
    onSuccess: () => {
      toast.success("Authentication successful");
      const safeTarget = getSafeRedirectTarget(redirectTarget);
      if (safeTarget) {
        globalThis.location.assign(safeTarget);
      } else {
        void navigate({ to: "/" });
      }
    },
    onError: (error: Error) => {
      toast.error("Invalid code", { description: error.message });
    },
  });

  async function handleSendOtp(data: { email: string }) {
    await sendOtp.mutateAsync(data.email);
    setEmail(data.email);
    setStep(2);
  }

  async function handleVerifyOtp(data: { otp: string }) {
    const result = await verifyOtp.mutateAsync({ email, otp: data.otp });

    if (result.totpRequired && result.pendingToken) {
      setPendingToken(result.pendingToken);
      setStep(3);
      return;
    }

    const safeTarget = getSafeRedirectTarget(redirectTarget);
    if (safeTarget) {
      globalThis.location.assign(safeTarget);
      return;
    }
    void navigate({ to: "/" });
  }

  async function handleResend() {
    await sendOtp.mutateAsync(email);
  }

  const stepTitle = step === 1 ? "Admin sign in" : step === 2 ? "Verification" : "Two-factor auth";
  const stepDesc =
    step === 1
      ? "Enter your email to receive an OTP code"
      : step === 2
        ? "Enter the 6-digit code sent to your email"
        : "Enter the 6-digit code from your authenticator app";

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4">
      <ChatDoodleBg />
      <div className="relative z-10 w-full max-w-sm">
        <Card>
          <CardHeader className="text-center space-y-1">
            <div className="flex justify-center mb-2">
              <img src={rabotkaLogo} alt="Rabotka" className="h-14 w-auto" />
            </div>
            <CardTitle className="text-xl">{stepTitle}</CardTitle>
            <CardDescription>{stepDesc}</CardDescription>
          </CardHeader>

          <CardContent>
            {step === 1 && (
              <Step1EmailForm
                onSubmit={handleSendOtp}
                isLoading={sendOtp.isPending}
                serverError={
                  sendOtp.isError ? (sendOtp.error?.message ?? null) : null
                }
              />
            )}

            {step === 2 && (
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

            {step === 3 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  verifyTotp.mutate();
                }}
                className="flex flex-col gap-4"
              >
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="000000"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-xl tracking-widest font-mono"
                  autoFocus
                />
                {verifyTotp.isError && (
                  <p className="text-sm text-destructive text-center">
                    {verifyTotp.error.message}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={totpCode.length !== 6 || verifyTotp.isPending}
                >
                  {verifyTotp.isPending ? "Verifying…" : "Verify"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => { setStep(1); setPendingToken(""); setTotpCode(""); }}
                >
                  Back to sign in
                </Button>
              </form>
            )}

            {step === 1 && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-2 text-muted-foreground">
                      or
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setQrOpen(true)}
                >
                  Sign in with QR code
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <QrLoginDialog open={qrOpen} onOpenChange={setQrOpen} />
    </div>
  );
}
