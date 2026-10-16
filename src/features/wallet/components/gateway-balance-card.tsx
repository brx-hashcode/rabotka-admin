import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconEye, IconEyeOff, IconRefresh } from "@tabler/icons-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import {
  getGatewayBalanceCountries,
  getGatewayBalances,
} from "#/lib/api/wallet-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { cn } from "#/lib/utils";

const DEFAULT_COUNTRY = "COG";
const HIDDEN_KEY = "rabotka.wallet.gateway-balance-hidden";

/** Hidden unless this admin chose to show it. */
function readHidden(): boolean {
  try {
    return localStorage.getItem(HIDDEN_KEY) !== "0";
  } catch {
    return true;
  }
}

function writeHidden(hidden: boolean) {
  try {
    localStorage.setItem(HIDDEN_KEY, hidden ? "1" : "0");
  } catch {
    // Remembering the choice is a convenience; the toggle still works.
  }
}

function formatAmount(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/**
 * The live balance on the gateway account (pawaPay), per country. Not the
 * same figure as the ledger next to it: it is what the gateway actually
 * holds, after its own fees and any payout made outside Rabotka.
 */
export function GatewayBalanceCard({
  open,
  gatewayLabel,
}: Readonly<{ open: boolean; gatewayLabel: string }>) {
  const [picked, setPicked] = useState<string | null>(null);
  const [hidden, setHidden] = useState(readHidden);

  const countriesQuery = useQuery({
    queryKey: ["admin", "wallet", "gateway", "balance-countries"],
    queryFn: getGatewayBalanceCountries,
    enabled: open,
    retry: false,
    staleTime: 60 * 60 * 1000,
  });
  const countries = countriesQuery.data?.countries ?? [];
  const country = picked ?? countriesQuery.data?.default ?? DEFAULT_COUNTRY;
  const countryName =
    countries.find((c) => c.code === country)?.name ?? country;

  const balancesQuery = useQuery({
    queryKey: ["admin", "wallet", "gateway", "balances", country],
    queryFn: () => getGatewayBalances(country),
    enabled: open,
    retry: false,
  });

  const balances = balancesQuery.data?.balances ?? [];
  // One currency per country on pawaPay; per-network wallets add up.
  const currency = balances[0]?.currency ?? "";
  const live = balances
    .filter((b) => b.currency === currency)
    .reduce((sum, b) => sum + Number(b.balance), 0);

  const loading = balancesQuery.isLoading;
  // 409: the active gateway reports no balance (e.g. MTN MoMo).
  const unsupported = /409|n'expose pas de solde/i.test(
    String((balancesQuery.error as Error | null)?.message ?? ""),
  );
  const updatedAt = balancesQuery.dataUpdatedAt
    ? new Date(balancesQuery.dataUpdatedAt).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const toggleHidden = () => {
    setHidden((h) => {
      writeHidden(!h);
      return !h;
    });
  };

  return (
    // shrink-0: in the sheet's scrolling column an overflow-hidden item is
    // allowed to shrink to nothing, which hid the balance under the header.
    <div
      className="relative flex h-full shrink-0 flex-col justify-between gap-2 overflow-hidden rounded-xl px-4 py-3 text-white"
      style={{
        // Near-black, warming into green from the bottom-right corner.
        background:
          "radial-gradient(120% 160% at 100% 100%, #2f5a3f 0%, #213528 38%, #1c1c1e 72%)",
      }}
    >
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-0.5">
          <p className="truncate text-xs font-medium text-white/60">
            {gatewayLabel} balance
          </p>
          <button
            type="button"
            onClick={toggleHidden}
            className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white"
            aria-label={hidden ? "Show balance" : "Hide balance"}
          >
            {hidden ? (
              <IconEyeOff className="size-3.5" />
            ) : (
              <IconEye className="size-3.5" />
            )}
          </button>
        </div>
        <Select value={country} onValueChange={setPicked}>
          <SelectTrigger
            size="sm"
            className="h-6 shrink-0 gap-1 rounded-full border-0 bg-white/10 px-2.5 text-xs text-white shadow-none hover:bg-white/15 data-[size=sm]:h-6 dark:bg-white/10 dark:hover:bg-white/15 [&_svg]:text-white/70"
            aria-label="Country"
          >
            <SelectValue>{countryName}</SelectValue>
          </SelectTrigger>
          {/* Dressed like the card: the same near-black, no border. */}
          <SelectContent
            position="popper"
            align="end"
            sideOffset={6}
            className="max-h-72 w-60 rounded-xl border-0 bg-[#1c1c1e] text-white shadow-2xl"
          >
            <SelectGroup>
              <SelectLabel className="px-2.5 pt-1.5 pb-1 text-[10px] font-medium uppercase tracking-wider text-white/40">
                Countries on the account
              </SelectLabel>
              {(countries.length > 0
                ? countries
                : [{ code: DEFAULT_COUNTRY, name: "Congo" }]
              ).map((c) => (
                <SelectItem
                  key={c.code}
                  value={c.code}
                  className="rounded-lg py-1.5 pl-2.5 text-xs text-white/75 focus:bg-white/10 focus:text-white data-[state=checked]:text-white [&_svg:not([class*='text-'])]:text-[#7ee8a2]"
                >
                  <span className="w-8 shrink-0 font-mono text-[10px] text-white/40">
                    {c.code}
                  </span>
                  <span className="truncate">{c.name}</span>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="relative flex items-end justify-between gap-2">
        {loading ? (
          <div className="h-7 w-32 animate-pulse rounded bg-white/15" />
        ) : balancesQuery.isError ? (
          <p
            className={cn(
              "text-xs",
              unsupported ? "text-white/60" : "text-red-300",
            )}
          >
            {unsupported
              ? "The active gateway doesn't report a balance."
              : friendlyError(
                  balancesQuery.error,
                  "The gateway didn't answer. Try again.",
                )}
          </p>
        ) : balances.length === 0 ? (
          <p className="text-xs text-white/60">No wallet in {countryName}.</p>
        ) : (
          <p
            className="text-2xl font-bold leading-none tracking-tight tabular-nums"
            style={{ textShadow: "0 0 18px rgba(126,232,162,0.25)" }}
          >
            <span className="mr-1 text-sm font-semibold text-white/50">
              {currency}
            </span>
            {hidden ? "••••••" : formatAmount(live)}
          </p>
        )}

        <div className="flex shrink-0 items-center gap-1 text-[11px] text-white/55">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#7ee8a2] opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-[#7ee8a2]" />
          </span>
          <span>Live{updatedAt ? ` · ${updatedAt}` : ""}</span>
          <button
            type="button"
            onClick={() => void balancesQuery.refetch()}
            disabled={balancesQuery.isFetching}
            className="rounded p-0.5 hover:bg-white/10 hover:text-white disabled:opacity-60"
            aria-label="Refresh"
          >
            <IconRefresh
              className={cn(
                "size-3.5",
                balancesQuery.isFetching && "animate-spin",
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
