import { useEffect, useState } from "react";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "#/components/ui/card";
import { Button } from "#/components/ui/button";
import rabotkaLogo from "#/assets/rabotka-logo.png";
import {
  PHONE_TOKEN_KEY,
  confirmQrSessionFromPhone,
} from "#/lib/api/auth-controller";

export const Route = createFileRoute("/auth/qr-confirm")({
  validateSearch: (search: Record<string, unknown>) => ({
    session: typeof search.session === "string" ? search.session : "",
  }),
  component: QrConfirmPage,
});

type Phase = "checking" | "not-paired" | "ready" | "loading" | "done" | "error";

function QrConfirmPage() {
  const { session } = useSearch({ from: "/auth/qr-confirm" });
  const [phase, setPhase] = useState<Phase>("checking");
  const [phoneToken, setPhoneToken] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem(PHONE_TOKEN_KEY) ?? "";
    if (!token) {
      setPhase("not-paired");
    } else {
      setPhoneToken(token);
      setPhase("ready");
    }
  }, []);

  async function handleConfirm() {
    if (!session) {
      setErrorMsg("Invalid QR code — missing session.");
      setPhase("error");
      return;
    }
    // Re-read token at confirm time in case it was updated by a re-pair
    const token = localStorage.getItem(PHONE_TOKEN_KEY) ?? "";
    if (!token) {
      setPhase("not-paired");
      return;
    }
    setPhase("loading");
    try {
      await confirmQrSessionFromPhone(session, token);
      setPhase("done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to confirm.";
      const needsRepair =
        msg.toLowerCase().includes("expired") ||
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("not found") ||
        msg.toLowerCase().includes("reset");
      setErrorMsg(
        needsRepair
          ? "Phone pairing has expired or been reset. Re-pair your phone in your admin profile."
          : msg,
      );
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
            <CardTitle className="text-xl">
              {phase === "not-paired" ? "Phone not configured" : "Confirm login"}
            </CardTitle>
            <CardDescription>
              {phase === "not-paired"
                ? "This phone has not been paired for QR login."
                : "Someone is signing in via QR code on a desktop browser."}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {phase === "checking" && (
              <p className="text-muted-foreground text-sm text-center">Checking…</p>
            )}

            {phase === "not-paired" && (
              <p className="text-muted-foreground text-sm text-center">
                Go to your admin profile on desktop, open the{" "}
                <strong>Phone pairing</strong> section, and pair this device first.
              </p>
            )}

            {phase === "ready" && (
              <Button className="w-full" onClick={() => void handleConfirm()}>
                Confirm login
              </Button>
            )}

            {phase === "loading" && (
              <Button className="w-full" disabled>
                Confirming…
              </Button>
            )}

            {phase === "done" && (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <p className="text-sm font-medium">Login approved.</p>
                <p className="text-muted-foreground text-xs">
                  You can close this page.
                </p>
              </div>
            )}

            {phase === "error" && (
              <div className="flex flex-col gap-3 text-center">
                <p className="text-destructive text-sm">{errorMsg}</p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setPhase("ready")}
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
