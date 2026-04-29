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
import { initQrSession, consumeQrSession } from "#/lib/api/auth-controller";
import { getRoundedLogoDataUrl } from "#/lib/qr-utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Phase = "loading" | "ready" | "scanned" | "done" | "expired" | "error";

export function QrLoginDialog({ open, onOpenChange }: Readonly<Props>) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("loading");
  const [qrUrl, setQrUrl] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
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

  function handleQrConfirmedSuccess() {
    setPhase("done");
    setTimeout(redirectToHome, 800);
  }

  function handleQrConfirmedError() {
    setPhase("error");
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
          .then(handleQrConfirmedSuccess)
          .catch(handleQrConfirmedError);
      });

      socketRef.current = socket;
    } catch {
      setPhase("error");
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
    }
    return () => {
      clearTimer();
      disconnectSocket();
    };
  }, [open]);

  useEffect(() => {
    if (!qrUrl || !qrContainerRef.current) return;

    const container = qrContainerRef.current;

    getRoundedLogoDataUrl("/rabotka-logo.png", 64, 16).then((logoDataUrl) => {
      const qr = new QrCodeStyling({
        width: 200,
        height: 200,
        margin: 0,
        data: qrUrl,
        image: logoDataUrl,
        dotsOptions: { type: "rounded", color: "#252525" },
        cornersSquareOptions: { type: "extra-rounded", color: "#000000" },
        cornersDotOptions: { type: "rounded", color: "#252525" },
        backgroundOptions: { color: "#f5f5f5" },
        imageOptions: { margin: 4 },
        qrOptions: { errorCorrectionLevel: "H" },
      });

      container.innerHTML = "";
      qr.append(container);
      qrInstanceRef.current = qr;
    });
  }, [qrUrl]);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <Dialog
      open={open}
      onOpenChange={
        phase === "scanned" || phase === "done" ? undefined : onOpenChange
      }
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Sign in with QR code</DialogTitle>
          <DialogDescription>
            Scan this code with your phone to authenticate.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {phase === "loading" && (
            <div className="h-48 w-48 animate-pulse rounded-lg bg-muted" />
          )}

          {(phase === "ready" || phase === "expired") && qrUrl && (
            <>
              <div className="relative overflow-hidden p-3 rounded-xl border-2 border-foreground bg-white transition-all duration-300">
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
                    <strong>Settings → Approve QR login</strong>, then scan.
                  </p>
                </>
              )}

              {phase === "expired" && (
                <p className="text-sm text-muted-foreground">
                  QR code expired.
                </p>
              )}
            </>
          )}

          {(phase === "scanned" || phase === "done") && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-foreground" />
              <p className="text-sm font-medium">
                {phase === "scanned"
                  ? "Verified — signing you in…"
                  : "Redirecting…"}
              </p>
            </div>
          )}

          {phase === "error" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <p className="text-sm text-destructive">
                Failed to generate QR code.
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

