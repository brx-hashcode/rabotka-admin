import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconLoader2,
  IconSend,
} from "@tabler/icons-react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import {
  getGatewayBalances,
  getPaymentGateways,
  refreshPayout,
  sendPayout,
  type AdminPayoutItem,
} from "#/lib/api/wallet-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { cn } from "#/lib/utils";

/** Payouts go to Congolese numbers for now, like the balance card. */
const PAYOUT_COUNTRY = "COG";
const DIAL_CODE = "+242";

const fcfa = (n: number) => `${Math.round(n).toLocaleString()} FCFA`;

type Step = "form" | "confirm" | "sent";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Rabotka's ledger balance, which the payout must not exceed. */
  ledgerBalance: number;
};

/**
 * Sends money from the gateway account (pawaPay) to a mobile-money number.
 *
 * Three steps, because this moves real money: the details; a confirmation
 * that spells out who gets what and asks for the amount a second time; then
 * the result, followed until the gateway confirms or refuses it.
 */
export function SendPayoutDialog({
  open,
  onOpenChange,
  ledgerBalance,
}: Readonly<Props>) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>("form");
  // One per opening: a retry inside the same dialog can never send twice.
  const [requestId, setRequestId] = useState(() => crypto.randomUUID());
  const [amount, setAmount] = useState("");
  const [operator, setOperator] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [payout, setPayout] = useState<AdminPayoutItem | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep("form");
    setRequestId(crypto.randomUUID());
    setAmount("");
    setPhone("");
    setNote("");
    setConfirmation("");
    setError(null);
    setPayout(null);
  }, [open]);

  const gatewaysQuery = useQuery({
    queryKey: ["payment-gateways"],
    queryFn: getPaymentGateways,
    enabled: open,
    staleTime: Infinity,
  });
  const liveQuery = useQuery({
    queryKey: ["admin", "wallet", "gateway", "balances", PAYOUT_COUNTRY],
    queryFn: () => getGatewayBalances(PAYOUT_COUNTRY),
    enabled: open,
    retry: false,
  });

  const active = gatewaysQuery.data?.gateways.find(
    (g) => g.key === gatewaysQuery.data?.active,
  );
  const operators = useMemo(
    () =>
      (active?.operators ?? []).filter(
        (o) =>
          o.country === PAYOUT_COUNTRY ||
          o.code.endsWith(`_${PAYOUT_COUNTRY}`),
      ),
    [active],
  );
  useEffect(() => {
    if (!operator && operators[0]) setOperator(operators[0].code);
  }, [operator, operators]);

  const live = (liveQuery.data?.balances ?? [])
    .filter((b) => b.currency === "XAF")
    .reduce((sum, b) => sum + Number(b.balance), 0);
  const available = Math.min(ledgerBalance, live);
  const value = Number(amount);
  const operatorLabel =
    operators.find((o) => o.code === operator)?.label ?? operator;
  const digits = phone.replace(/\D/g, "");
  const fullPhone = `${DIAL_CODE}${digits}`;

  function toConfirm() {
    if (!Number.isInteger(value) || value <= 0) {
      return setError("Enter a whole amount in FCFA.");
    }
    if (value > ledgerBalance) {
      return setError(`More than the ledger holds (${fcfa(ledgerBalance)}).`);
    }
    if (liveQuery.isSuccess && value > live) {
      return setError(
        `More than ${active?.label ?? "the gateway"} holds (${live.toLocaleString()} XAF).`,
      );
    }
    if (!operator) return setError("Choose the network.");
    if (digits.length < 8 || digits.length > 10) {
      return setError("Enter the recipient's number, without +242.");
    }
    setError(null);
    setConfirmation("");
    setStep("confirm");
  }

  async function send() {
    setSending(true);
    setError(null);
    try {
      const result = await sendPayout({
        clientRequestId: requestId,
        amount: value,
        confirmAmount: Number(confirmation),
        phone: fullPhone,
        operator,
        note: note.trim() || undefined,
      });
      setPayout(result);
      setStep("sent");
      await queryClient.invalidateQueries({
        queryKey: ["admin", "wallet"],
      });
    } catch (err) {
      setError(friendlyError(err, "The payout didn't go through. Try again."));
    } finally {
      setSending(false);
    }
  }

  // Follow a sent payout until the gateway settles it (about a minute).
  useEffect(() => {
    if (step !== "sent" || !payout || payout.status !== "PENDING") return;
    let tries = 0;
    const timer = setInterval(async () => {
      tries += 1;
      try {
        const next = await refreshPayout(payout.id);
        setPayout(next);
        if (next.status !== "PENDING") {
          await queryClient.invalidateQueries({ queryKey: ["admin", "wallet"] });
        }
      } catch {
        /* keep the last known state */
      }
      if (tries >= 20) clearInterval(timer);
    }, 3000);
    return () => clearInterval(timer);
  }, [step, payout, queryClient]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle>Send a payout</DialogTitle>
              <DialogDescription>
                Sends money from the {active?.label ?? "gateway"} account to a
                mobile-money number.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-3 text-xs">
              <div>
                <p className="text-muted-foreground">Ledger</p>
                <p className="font-semibold">{fcfa(ledgerBalance)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">
                  {active?.label ?? "Gateway"} (live)
                </p>
                <p className="font-semibold">
                  {liveQuery.isLoading
                    ? "…"
                    : liveQuery.isError
                      ? "unavailable"
                      : `${live.toLocaleString()} XAF`}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 py-1">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="po-amount">Amount (FCFA) *</Label>
                <Input
                  id="po-amount"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="e.g. 50000"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError(null);
                  }}
                />
                {liveQuery.isSuccess && (
                  <p className="text-xs text-muted-foreground">
                    Up to {fcfa(available)}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="po-operator">Network *</Label>
                <Select
                  value={operator}
                  onValueChange={(v) => {
                    setOperator(v);
                    setError(null);
                  }}
                >
                  <SelectTrigger id="po-operator" className="w-full">
                    <SelectValue placeholder="Choose the network" />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((o) => (
                      <SelectItem key={o.code} value={o.code}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="po-phone">Recipient number *</Label>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                    {DIAL_CODE}
                  </span>
                  <Input
                    id="po-phone"
                    inputMode="tel"
                    placeholder="06 123 45 67"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setError(null);
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="po-note">Note</Label>
                <Input
                  id="po-note"
                  placeholder="e.g. Treasury withdrawal, October"
                  maxLength={200}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={toConfirm} disabled={!amount || !phone}>
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "confirm" && (
          <>
            <DialogHeader>
              <DialogTitle>Confirm the payout</DialogTitle>
              <DialogDescription>
                Money sent to a mobile-money number cannot be taken back.
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-3 rounded-lg bg-amber-500/10 p-3 text-sm">
              <IconAlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <p>
                You are about to send{" "}
                <span className="font-semibold">{fcfa(value)}</span> to{" "}
                <span className="font-mono font-semibold">{fullPhone}</span> on{" "}
                <span className="font-semibold">{operatorLabel}</span>.
                {note.trim() && (
                  <span className="block pt-1 text-muted-foreground">
                    Note: {note.trim()}
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="po-confirm">
                Type <span className="font-mono">{value}</span> to confirm
              </Label>
              <Input
                id="po-confirm"
                inputMode="numeric"
                autoFocus
                value={confirmation}
                onChange={(e) => {
                  setConfirmation(e.target.value.trim());
                  setError(null);
                }}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStep("form")}
                disabled={sending}
              >
                Back
              </Button>
              <Button
                onClick={send}
                disabled={sending || Number(confirmation) !== value}
                className="gap-1.5"
              >
                {sending ? (
                  <IconLoader2 className="size-4 animate-spin" />
                ) : (
                  <IconSend className="size-4" />
                )}
                {sending ? "Sending…" : `Send ${fcfa(value)}`}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "sent" && payout && (
          <>
            <DialogHeader>
              <DialogTitle>
                {payout.status === "COMPLETED"
                  ? "Payout completed"
                  : payout.status === "FAILED"
                    ? "Payout failed"
                    : "Payout sent"}
              </DialogTitle>
              <DialogDescription>
                {fcfa(payout.amount)} to{" "}
                <span className="font-mono">{payout.phone}</span>
              </DialogDescription>
            </DialogHeader>

            <div
              className={cn(
                "flex items-center gap-3 rounded-lg p-3 text-sm",
                payout.status === "COMPLETED" && "bg-emerald-500/10",
                payout.status === "FAILED" && "bg-destructive/10",
                payout.status === "PENDING" && "bg-muted",
              )}
            >
              {payout.status === "COMPLETED" ? (
                <IconCircleCheck className="size-5 shrink-0 text-emerald-500" />
              ) : payout.status === "FAILED" ? (
                <IconCircleX className="size-5 shrink-0 text-destructive" />
              ) : (
                <IconLoader2 className="size-5 shrink-0 animate-spin text-muted-foreground" />
              )}
              <p>
                {payout.status === "COMPLETED"
                  ? "The operator confirmed it. The ledger has been debited."
                  : payout.status === "FAILED"
                    ? `Refused: ${payout.failureReason ?? "unknown reason"}. Nothing was debited.`
                    : "Waiting for the operator's confirmation. You can close this; the payouts list keeps following it."}
              </p>
            </div>

            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
