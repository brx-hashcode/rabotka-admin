import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketStore } from "#/stores/use-socket-store";
import {
  IconUser,
  IconShield,
  IconMoon,
  IconSun,
  IconBell,
  IconDeviceMobile,
} from "@tabler/icons-react";
import QrCodeStyling from "qr-code-styling";
import { getRoundedLogoDataUrl } from "#/lib/qr-utils";

import { toast } from "sonner";
import { useAdminProfile } from "#/hooks/use-admin-profile";
import { useTheme } from "#/components/theme-provider";
import { Avatar, AvatarFallback } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Switch } from "#/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import {
  generatePhonePairingOtp,
  unpairPhone,
  totpSetup,
  totpEnable,
  totpDisable,
} from "#/lib/api/auth-controller";

const FieldLabel = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return (
    <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
      {children}
    </label>
  );
};

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
};

type PairingPhase =
  | "idle"
  | "confirm-repair"
  | "name-input"
  | "show-code"
  | "generating"
  | "error";

function PhonePairingCard({
  phonePairedAt,
  phoneName,
  totpEnabled,
}: Readonly<{
  phonePairedAt: string | null;
  phoneName: string | null;
  totpEnabled: boolean;
}>) {
  const [phase, setPhase] = useState<PairingPhase>("idle");
  const [inputName, setInputName] = useState("");
  const [otp, setOtp] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPairedAt = useRef<string | null>(phonePairedAt);
  const qrContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (phonePairedAt !== prevPairedAt.current) {
      const prev = prevPairedAt.current;
      prevPairedAt.current = phonePairedAt;
      // Only reset the card when pairing completes (null → date).
      // When re-pair clears the DB (date → null), the OTP/QR screen
      // must stay visible so the phone can still scan and verify.
      if (phonePairedAt !== null && prev === null) {
        clearTimer();
        setPhase("idle");
        setOtp("");
        setQrUrl("");
        setErrorMsg("");
      }
    }
  }, [phonePairedAt]);

  function clearTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function startCountdown(seconds: number) {
    clearTimer();
    setSecondsLeft(seconds);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearTimer();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  useEffect(() => () => clearTimer(), []);

  useEffect(() => {
    if (!qrUrl || !qrContainerRef.current) return;
    const container = qrContainerRef.current;
    getRoundedLogoDataUrl("/rabotka-logo.png", 48, 12).then((logoDataUrl) => {
      const qr = new QrCodeStyling({
        width: 120,
        height: 120,
        margin: 0,
        data: qrUrl,
        image: logoDataUrl,
        dotsOptions: { type: "rounded", color: "#252525" },
        cornersSquareOptions: { type: "extra-rounded", color: "#000000" },
        cornersDotOptions: { type: "rounded", color: "#252525" },
        backgroundOptions: { color: "#f5f5f5" },
        imageOptions: { margin: 3 },
        qrOptions: { errorCorrectionLevel: "H" },
      });
      container.innerHTML = "";
      qr.append(container);
    });
  }, [qrUrl]);

  async function handleUnpair() {
    setPhase("generating");
    try {
      await unpairPhone();
      handleReset();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to disconnect phone.",
      );
      setPhase("error");
    }
  }

  async function handleGenerate() {
    const name = inputName.trim();
    if (!name) return;

    setPhase("generating");
    try {
      const result = await generatePhonePairingOtp(name);
      const base = globalThis.location.origin;

      setOtp(result.otp);
      setQrUrl(`${base}/auth/phone-pair?u=${result.userId}`);
      startCountdown(result.expiresIn);
      setPhase("show-code");
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to generate code.",
      );
      setPhase("error");
    }
  }

  function handleReset() {
    clearTimer();
    setPhase("idle");
    setInputName("");
    setOtp("");
    setQrUrl("");
    setErrorMsg("");
  }

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const expired = secondsLeft === 0 && phase === "show-code";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
          <IconDeviceMobile className="size-4" />
          Phone pairing
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {phase === "idle" && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`size-8 rounded-full flex items-center justify-center shrink-0 ${phonePairedAt ? "bg-primary/10" : "bg-muted"}`}
              >
                <IconDeviceMobile
                  className={`size-4 ${phonePairedAt ? "text-primary" : "text-muted-foreground"}`}
                />
              </div>
              <div className="min-w-0">
                {phonePairedAt ? (
                  <>
                    <p className="text-sm font-medium truncate">
                      {phoneName ?? "Phone"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Paired on {new Date(phonePairedAt).toLocaleDateString()}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium">No phone paired</p>
                    <p className="text-muted-foreground text-xs">
                      {totpEnabled
                        ? "Pair your phone to enable QR code login."
                        : "Enable two-factor authentication to pair a phone."}
                    </p>
                  </>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant={phonePairedAt ? "outline" : "default"}
              onClick={() =>
                setPhase(phonePairedAt ? "confirm-repair" : "name-input")
              }
              className="shrink-0"
              disabled={!totpEnabled}
              title={!totpEnabled ? "Enable two-factor authentication first" : undefined}
            >
              {phonePairedAt ? "Re-pair" : "Pair a phone"}
            </Button>
          </div>
        )}

        {phase === "confirm-repair" && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              This will immediately disconnect{" "}
              <strong>{phoneName ?? "the current phone"}</strong>. The old
              device will no longer be able to log in via QR code.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleReset}>
                Cancel
              </Button>
              <Button size="sm" variant="destructive" onClick={handleUnpair}>
                Disconnect phone
              </Button>
            </div>
          </div>
        )}

        {phase === "name-input" && (
          <div className="flex flex-col gap-3">
            <div className="space-y-1.5">
              <FieldLabel>Phone name</FieldLabel>
              <Input
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="e.g. My iPhone"
                onKeyDown={(e) => e.key === "Enter" && void handleGenerate()}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleReset}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => void handleGenerate()}
                disabled={!inputName.trim()}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {phase === "generating" && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="size-4 animate-spin rounded-full border-2 border-muted border-t-foreground" />
            Generating code…
          </div>
        )}

        {phase === "show-code" && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="shrink-0 overflow-hidden rounded-xl border-2 p-0 border-foreground bg-white self-start shadow-sm">
                <div ref={qrContainerRef} />
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    Enter this code on your phone
                  </p>
                  <p className="font-mono text-3xl font-bold tracking-[0.3em] tabular-nums">
                    {otp}
                  </p>
                </div>
                <div
                  className={`text-xs font-medium ${expired ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {expired ? (
                    "Code expired"
                  ) : (
                    <>
                      Expires in{" "}
                      <span className="font-mono text-foreground">
                        {minutes}:{seconds}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  Scan the QR or open this URL on your phone, then enter the
                  code above.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {expired && (
                <Button
                  size="sm"
                  onClick={() => {
                    setPhase("name-input");
                  }}
                >
                  Regenerate
                </Button>
              )}
            </div>
          </div>
        )}

        {phase === "error" && (
          <div className="flex flex-col gap-3">
            <p className="text-destructive text-sm">{errorMsg}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="self-start"
            >
              Try again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type TotpPhase = "idle" | "setup" | "confirm" | "disable" | "loading";

function TotpCard({ totpEnabled, onChanged }: Readonly<{ totpEnabled: boolean; onChanged: () => void }>) {
  const [phase, setPhase] = useState<TotpPhase>("idle");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  async function handleStartSetup() {
    setPhase("loading");
    setError("");
    try {
      const result = await totpSetup();
      setQrDataUrl(result.qrDataUrl);
      setSecret(result.secret);
      setPhase("setup");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start setup.");
      setPhase("idle");
    }
  }

  async function handleEnable() {
    setError("");
    try {
      await totpEnable(code);
      toast.success("Authenticator enabled");
      setCode("");
      setPhase("idle");
      onChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid code.");
    }
  }

  async function handleDisable() {
    setError("");
    try {
      await totpDisable(code);
      toast.success("Authenticator disabled");
      setCode("");
      setPhase("idle");
      onChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid code.");
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
          <IconShield className="size-4" />
          Two-factor authentication
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {phase === "idle" && (
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              {totpEnabled ? (
                <>
                  <p className="text-sm font-medium">Authenticator enabled</p>
                  <p className="text-xs text-muted-foreground">Your account is protected with 2FA.</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">Authenticator not enabled</p>
                  <p className="text-xs text-muted-foreground">Add an extra layer of security to your account.</p>
                </>
              )}
            </div>
            <Button
              size="sm"
              variant={totpEnabled ? "outline" : "default"}
              onClick={() => totpEnabled ? setPhase("disable") : void handleStartSetup()}
              className="shrink-0"
            >
              {totpEnabled ? "Disable" : "Enable"}
            </Button>
          </div>
        )}

        {phase === "loading" && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <div className="size-4 animate-spin rounded-full border-2 border-muted border-t-foreground" />
            Setting up…
          </div>
        )}

        {phase === "setup" && qrDataUrl && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code below to confirm.
            </p>
            <div className="flex justify-center">
              <img src={qrDataUrl} alt="TOTP QR code" className="h-44 w-44 rounded-lg border border-border" />
            </div>
            <p className="text-center text-xs text-muted-foreground break-all">
              Manual key: <span className="font-mono font-medium">{secret}</span>
            </p>
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="text-center text-xl tracking-widest font-mono"
              autoFocus
            />
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setPhase("idle"); setCode(""); setError(""); }}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={code.length !== 6}
                onClick={() => void handleEnable()}
              >
                Confirm
              </Button>
            </div>
          </div>
        )}

        {phase === "disable" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Enter the current code from your authenticator app to disable 2FA.
            </p>
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="text-center text-xl tracking-widest font-mono"
              autoFocus
            />
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setPhase("idle"); setCode(""); setError(""); }}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={code.length !== 6}
                onClick={() => void handleDisable()}
              >
                Disable 2FA
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminProfilePage() {
  const { admin, isLoading, updateAdmin, isUpdating } = useAdminProfile();
  const { resolvedTheme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [initialFirstName, setInitialFirstName] = useState("");
  const [initialLastName, setInitialLastName] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const stored = localStorage.getItem("browserNotificationsEnabled");
    if (stored !== null) return stored === "true";
    return (
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    );
  });

  useEffect(() => {
    if (admin) {
      setFirstName(admin.firstName ?? "");
      setLastName(admin.lastName ?? "");
      setInitialFirstName(admin.firstName ?? "");
      setInitialLastName(admin.lastName ?? "");
    }
  }, [admin]);

  const socket = useSocketStore((s) => s.socket);
  useEffect(() => {
    if (!socket) return;
    async function onPhonePaired() {
      await queryClient.invalidateQueries({ queryKey: ["admin", "me"] });
    }
    socket.on("phone:paired", onPhonePaired);
    return () => {
      socket.off("phone:paired", onPhonePaired);
    };
  }, [socket, queryClient]);

  useEffect(() => {
    function syncPermission() {
      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "denied"
      ) {
        setNotificationsEnabled(false);
        localStorage.setItem("browserNotificationsEnabled", "false");
      }
    }
    document.addEventListener("visibilitychange", syncPermission);
    return () =>
      document.removeEventListener("visibilitychange", syncPermission);
  }, []);

  async function enableNotifications() {
    if (typeof Notification === "undefined") {
      toast.error("Browser notifications are not supported.");
      return;
    }
    if (Notification.permission === "denied") {
      toast.error(
        "Notifications are blocked by your browser. Click the lock icon in the address bar and allow notifications, then try again.",
        { duration: 6000 },
      );
      return;
    }
    const permission =
      Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();
    const granted = permission === "granted";
    setNotificationsEnabled(granted);
    localStorage.setItem("browserNotificationsEnabled", String(granted));
    if (!granted) {
      toast.error("Notification permission was not granted.");
    }
  }

  function disableNotifications() {
    localStorage.setItem("browserNotificationsEnabled", "false");
    setNotificationsEnabled(false);
  }

  const isDirty =
    firstName !== initialFirstName || lastName !== initialLastName;
  const isDarkMode = resolvedTheme === "dark";

  const handleSave = async () => {
    await updateAdmin({ firstName, lastName });
    setInitialFirstName(firstName);
    setInitialLastName(lastName);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (!admin) return null;

  const initials = getInitials(admin.firstName || "A", admin.lastName || "");
  const fullName = [admin.firstName, admin.lastName].filter(Boolean).join(" ");

  return (
    <div className="grid grid-cols-1 gap-6 pt-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-8 text-center">
            <Avatar className="border-border size-24 border-4 shadow-md">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                {initials || <IconUser className="size-8" />}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-lg font-semibold">{fullName}</p>
              <p className="text-muted-foreground text-sm">{admin.email}</p>
              <Badge variant="secondary" className="mt-1 gap-1">
                <IconShield className="size-3" />
                {admin.role}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase">
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <FieldLabel>First Name</FieldLabel>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Last Name</FieldLabel>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Email</FieldLabel>
                <Input value={admin.email} disabled />
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Role</FieldLabel>
                <Input value={admin.role} disabled />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={!isDirty || isUpdating}>
                {isUpdating ? "Saving…" : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <PhonePairingCard
          phonePairedAt={admin.phonePairedAt ?? null}
          phoneName={admin.phoneName ?? null}
          totpEnabled={admin.totpEnabled ?? false}
        />

        <TotpCard
          totpEnabled={admin.totpEnabled ?? false}
          onChanged={() => void queryClient.invalidateQueries({ queryKey: ["admin", "me"] })}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase">
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isDarkMode ? (
                  <IconMoon className="text-muted-foreground size-4" />
                ) : (
                  <IconSun className="text-muted-foreground size-4" />
                )}
                <div>
                  <p className="text-sm font-medium">Appearance</p>
                  <p className="text-muted-foreground text-xs">
                    {isDarkMode ? "Dark mode" : "Light mode"}
                  </p>
                </div>
              </div>
              <Switch
                checked={isDarkMode}
                onCheckedChange={(checked) =>
                  setTheme(checked ? "dark" : "light")
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconBell className="text-muted-foreground size-4" />
                <div>
                  <p className="text-sm font-medium">Email Notifications</p>
                  <p className="text-muted-foreground text-xs">
                    Receive updates and alerts by email
                  </p>
                </div>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={(checked) =>
                  checked ? enableNotifications() : disableNotifications()
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
