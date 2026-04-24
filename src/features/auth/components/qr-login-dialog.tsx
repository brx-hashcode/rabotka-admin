import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
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

  function clearTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
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
          .then(() => {
            setPhase("done");
            setTimeout(() => {
              onOpenChange(false);
              void navigate({ to: "/" });
            }, 800);
          })
          .catch(() => setPhase("error"));
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

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <Dialog
      open={open}
      onOpenChange={phase === "scanned" || phase === "done" ? undefined : onOpenChange}
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

          {phase === "ready" && qrUrl && (
            <>
              <div className="rounded-xl border border-border bg-white p-3 shadow-sm">
                <QRCodeSVG value={qrUrl} size={180} />
              </div>
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

          {(phase === "scanned" || phase === "done") && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-foreground" />
              <p className="text-sm font-medium">
                {phase === "scanned" ? "Verified — signing you in…" : "Redirecting…"}
              </p>
            </div>
          )}

          {phase === "expired" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <p className="text-sm text-muted-foreground">QR code expired.</p>
              <Button size="sm" onClick={() => void startSession()}>
                Generate new code
              </Button>
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
