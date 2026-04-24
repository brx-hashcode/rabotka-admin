import { useState } from "react";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import rabotkaLogo from "#/assets/rabotka-logo.png";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "#/components/ui/card";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { verifyPhonePairingOtp } from "#/lib/api/auth-controller";

export const Route = createFileRoute("/auth/phone-pair")({
  validateSearch: (search: Record<string, unknown>) => ({
    u: typeof search.u === "string" ? search.u : "",
  }),
  component: PhonePairPage,
});

function PhonePairPage() {
  const { u: userId } = useSearch({ from: "/auth/phone-pair" });
  const [otp, setOtp] = useState("");
  const [phase, setPhase] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleVerify() {
    if (!userId) {
      setErrorMsg("Invalid pairing link. Please generate a new code from your desktop.");
      setPhase("error");
      return;
    }
    if (otp.length !== 6) return;
    setPhase("loading");
    try {
      await verifyPhonePairingOtp(userId, otp);
      setPhase("done");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Verification failed.");
      setPhase("error");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center space-y-1">
            <div className="flex justify-center mb-2">
              <img src={rabotkaLogo} alt="Rabotka" className="h-14 w-auto" />
            </div>
            <CardTitle className="text-xl">Pair this phone</CardTitle>
            <CardDescription>
              Enter the 6-digit code shown on your desktop profile page.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {(phase === "idle" || phase === "loading") && (
              <>
                <Input
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replaceAll(/\D/g, "").slice(0, 6))
                  }
                  placeholder="6-digit code"
                  inputMode="numeric"
                  maxLength={6}
                  className="text-center text-xl font-mono tracking-widest"
                  disabled={phase === "loading"}
                  onKeyDown={(e) => e.key === "Enter" && void handleVerify()}
                  autoFocus
                />
                <Button
                  onClick={() => void handleVerify()}
                  disabled={otp.length !== 6 || phase === "loading"}
                  className="w-full"
                >
                  {phase === "loading" ? "Verifying…" : "Pair this phone"}
                </Button>
              </>
            )}

            {phase === "done" && (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <p className="text-sm font-medium">Phone paired successfully.</p>
                <p className="text-muted-foreground text-xs">
                  You can now use QR code login on this device.
                </p>
              </div>
            )}

            {phase === "error" && (
              <div className="flex flex-col gap-3">
                <p className="text-destructive text-sm text-center">{errorMsg}</p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setPhase("idle");
                    setOtp("");
                    setErrorMsg("");
                  }}
                >
                  Try again
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
