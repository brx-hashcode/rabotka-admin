import { useEffect, useRef, useState } from "react";
import QrCodeStyling from "qr-code-styling";
import { useNavigate } from "@tanstack/react-router";
import { io, type Socket } from "socket.io-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "#/components/ui/dialog";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
  initQrSession,
  consumeQrSession,
  totpLogin,
} from "#/lib/api/auth-controller";
import { getRoundedLogoDataUrl } from "#/lib/qr-utils";
import { friendlyError } from "#/lib/api/friendly-error";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Phase =
  | "loading"
  | "ready"
  | "scanned"
  | "totp"
  | "done"
  | "expired"
  | "error";

export function QrLoginDialog({ open, onOpenChange }: Readonly<Props>) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("loading");
  const [qrUrl, setQrUrl] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totpCode, setTotpCode] = useState("");
  const [totpError, setTotpError] = useState("");
  const [totpPending, setTotpPending] = useState(false);
  const pendingTokenRef = useRef<string>("");
  const socketRef = useRef<Socket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string>("");
  const consumeNonceRef = useRef<string>("");
  const qrContainerRef = useRef<HTMLDivElement | null>(null);
  const qrInstanceRef = useRef<QrCodeStyling | null>(null);

  function clearTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function redirectToHome() {
    onOpenChange(false);
    navigate({ to: "/" });
  }

  function disconnectSocket() {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }

  async function startSession() {
    setPhase("loading");
    clearTimer();
    disconnectSocket();
    setTotpCode("");
    setTotpError("");

    try {
      const session = await initQrSession();
      sessionIdRef.current = session.sessionId;
      consumeNonceRef.current = session.consumeNonce;
      setQrUrl(session.qrUrl);
      setSecondsLeft(session.expiresIn);
      setPhase("ready");

      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearTimer();
            setPhase("expired");
            disconnectSocket();
            return 0;
          }
          return s - 1;
        });
      }, 1000);

      const socket = io("/qr", {
        transports: ["websocket"],
        autoConnect: true,
      });

      socket.on("connect", () => {
        socket.emit("join-qr", { sessionId: session.sessionId });
      });

      socket.on("qr:confirmed", () => {
        clearTimer();
        disconnectSocket();
        setPhase("scanned");
        consumeQrSession(session.sessionId, consumeNonceRef.current)
          .then((result) => {
            if (result.totpRequired && result.pendingToken) {
              pendingTokenRef.current = result.pendingToken;
              setPhase("totp");
            } else {
              setPhase("done");
              setTimeout(redirectToHome, 800);
            }
          })
          .catch(() => setPhase("error"));
      });

      socketRef.current = socket;
    } catch {
      setPhase("error");
    }
  }

  async function handleTotpSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setTotpError("");
    setTotpPending(true);
    try {
      await totpLogin(pendingTokenRef.current, totpCode);
      setPhase("done");
      setTimeout(redirectToHome, 800);
    } catch (err: unknown) {
      setTotpError(friendlyError(err, "That code isn't right. Check it and try again."));
    } finally {
      setTotpPending(false);
    }
  }

  useEffect(() => {
    if (open) {
      void startSession();
    } else {
      clearTimer();
      disconnectSocket();
      setPhase("loading");
      setQrUrl("");
      setTotpCode("");
      setTotpError("");
    }
    return () => {
      clearTimer();
      disconnectSocket();
    };
  }, [open]);

  useEffect(() => {
    if (!qrUrl || !qrContainerRef.current) return;
    const container = qrContainerRef.current;
    getRoundedLogoDataUrl("/rabotka-logo.png", 64, 12).then((logoDataUrl) => {
      const qr = new QrCodeStyling({
        width: 200,
        height: 200,
        margin: 0,
        data: qrUrl,
        image: logoDataUrl,
        dotsOptions: { type: "rounded", color: "#252525" },
        cornersSquareOptions: { type: "extra-rounded", color: "#37a148" },
        cornersDotOptions: { type: "rounded", color: "#252525" },
        backgroundOptions: { color: "#f5f5f5" },
        imageOptions: { margin: 2 },
        qrOptions: { errorCorrectionLevel: "H" },
      });
      container.innerHTML = "";
      qr.append(container);
      qrInstanceRef.current = qr;
    });
  }, [qrUrl]);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  const isLocked = phase === "scanned" || phase === "totp" || phase === "done";

  return (
    <Dialog open={open} onOpenChange={isLocked ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {phase === "totp"
              ? "Two-step sign-in"
              : "Sign in with QR code"}
          </DialogTitle>
          <DialogDescription>
            {phase === "totp"
              ? "Enter the 6-digit code from your code app (such as Google Authenticator)."
              : "Scan this code with your phone to sign in."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {phase === "loading" && (
            <div className="h-48 w-48 animate-pulse rounded-lg bg-muted" />
          )}

          {(phase === "ready" || phase === "expired") && qrUrl && (
            <>
              <div className="relative overflow-hidden rounded-xl border-2 border-foreground bg-white transition-all duration-300">
                <div
                  ref={qrContainerRef}
                  className={phase === "expired" ? "opacity-25 grayscale" : ""}
                />
                {phase === "expired" && (
                  <button
                    type="button"
                    onClick={() => void startSession()}
                    className="absolute inset-0 flex items-center justify-center"
                    aria-label="Generate new QR code"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-6 w-6"
                      >
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                    </span>
                  </button>
                )}
              </div>

              {phase === "ready" && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Expires in{" "}
                    <span className="font-mono font-medium text-foreground">
                      {minutes}:{seconds}
                    </span>
                  </p>
                  <p className="text-center text-xs text-muted-foreground px-4">
                    Open the admin app on your phone, go to{" "}
                    <strong>Settings → Approve QR sign-in</strong>, then scan.
                  </p>
                </>
              )}

              {phase === "expired" && (
                <p className="text-sm text-muted-foreground">
                  This QR code has expired.
                </p>
              )}
            </>
          )}

          {phase === "scanned" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-foreground" />
              <p className="text-sm font-medium">QR confirmed — checking…</p>
            </div>
          )}

          {phase === "totp" && (
            <form
              onSubmit={(e) => void handleTotpSubmit(e)}
              className="flex flex-col gap-4 w-full"
            >
              <Input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                value={totpCode}
                onChange={(e) =>
                  setTotpCode(e.target.value.replaceAll(/\D/g, ""))
                }
                className="text-center text-xl tracking-widest font-mono"
                autoFocus
              />
              {totpError && (
                <p className="text-sm text-destructive text-center">
                  {totpError}
                </p>
              )}
              <Button
                type="submit"
                disabled={totpCode.length !== 6 || totpPending}
              >
                {totpPending ? "Verifying…" : "Verify"}
              </Button>
            </form>
          )}

          {phase === "done" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-foreground" />
              <p className="text-sm font-medium">Redirecting…</p>
            </div>
          )}

          {phase === "error" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <p className="text-sm text-destructive">
                Couldn't create the QR code.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void startSession()}
              >
                Try again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
