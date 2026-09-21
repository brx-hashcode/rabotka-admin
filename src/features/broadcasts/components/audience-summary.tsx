import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Loader2 } from "lucide-react";

import { Button } from "#/components/ui/button";
import { Skeleton } from "#/components/ui/skeleton";
import {
  previewBroadcastAudience,
  type AudienceFilters,
  type AudiencePreview,
  type BroadcastChannel,
} from "#/lib/api/broadcasts-controller";

/** Matches MAX_RECIPIENTS on the server, which refuses anything above it. */
const MAX_RECIPIENTS = 5000;

const DEBOUNCE_MS = 400;

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);

  return debounced;
}

const fmt = (n: number) => n.toLocaleString("fr-FR");

type Props = {
  audience: AudienceFilters;
  channels: BroadcastChannel[];
  /** Clears every filter. Absent means the panel is read-only. */
  onClear?: () => void;
};

/**
 * The filters currently narrowing the audience, in words.
 *
 * Exists for the zero case. "Nobody matches these filters yet" is true but
 * useless when the reason is a trade that almost no profile has set — the
 * admin needs to see WHICH filter emptied it, without scrolling back through
 * the builder to hunt for the one they touched.
 */
function activeFilters(audience: AudienceFilters): string[] {
  const labels: string[] = [];
  const count = (arr: unknown[] | undefined) => arr?.length ?? 0;

  if (count(audience.profile_types))
    labels.push(audience.profile_types!.join(" + ").toLowerCase());
  if (count(audience.statuses))
    labels.push(`status: ${audience.statuses!.length} selected`);
  if (count(audience.verification_statuses))
    labels.push(
      `identity check: ${audience.verification_statuses!.join(", ").toLowerCase()}`,
    );
  if (count(audience.country_codes))
    labels.push(`country: ${audience.country_codes!.join(", ")}`);
  if (count(audience.cities)) labels.push(`city: ${audience.cities!.join(", ")}`);
  if (count(audience.category_ids))
    labels.push(`trade: ${audience.category_ids!.length} selected`);
  if (audience.active_within_days)
    labels.push(`signed in within ${audience.active_within_days} days`);
  if (audience.created_from) labels.push("signed up after a date");
  if (audience.whatsapp_connected) labels.push("WhatsApp connected");
  if (audience.has_email) labels.push("has an email");

  return labels;
}

/**
 * How many people this reaches, and what it costs, before anything is sent.
 *
 * The number an admin actually decides on. It refreshes as the filters change
 * — debounced, because it runs five counts server-side — and it separates the
 * WhatsApp recipients who are inside the free 24h window from the ones who need
 * a paid template, because that difference is the whole cost of the send.
 */
export function AudienceSummary({ audience, channels, onClear }: Props) {
  const debounced = useDebounced(audience, DEBOUNCE_MS);
  const settling = debounced !== audience;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "broadcasts", "preview", debounced],
    queryFn: () => previewBroadcastAudience(debounced),
  });

  if (isLoading) {
    return (
      <div className="bg-card shadow-soft space-y-3 rounded-lg p-4">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-card shadow-soft rounded-lg p-4">
        <p className="text-muted-foreground text-sm">
          The audience could not be counted. Change a filter to try again.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card shadow-soft space-y-4 rounded-lg p-4">
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold tabular-nums">
            {fmt(data.total)}
          </span>
          <span className="text-muted-foreground text-sm">
            {data.total === 1 ? "recipient" : "recipients"}
          </span>
          {settling ? (
            <Loader2 className="text-muted-foreground size-3.5 animate-spin" />
          ) : null}
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          Active accounts that have not opted out.
        </p>
      </div>

      <ChannelBreakdown data={data} channels={channels} />

      <CostLine data={data} channels={channels} />

      {data.total > MAX_RECIPIENTS ? (
        <p className="text-destructive flex items-start gap-2 text-xs">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          Above the {fmt(MAX_RECIPIENTS)} per-send limit. Narrow the filters —
          the server will refuse this.
        </p>
      ) : null}

      {data.total === 0 ? (
        <EmptyAudience audience={audience} onClear={onClear} />
      ) : (
        <Sample sample={data.sample} total={data.total} />
      )}
    </div>
  );
}

/**
 * Why the count is zero, and how to undo it.
 *
 * Most profiles here carry no trade and no city, so a single tick in either
 * list empties the audience — which looks identical to a broken page unless
 * the panel says what it is filtering on.
 */
function EmptyAudience({
  audience,
  onClear,
}: Readonly<{ audience: AudienceFilters; onClear?: () => void }>) {
  const filters = activeFilters(audience);

  if (filters.length === 0) {
    return (
      <p className="text-muted-foreground text-xs">
        No active account matches. Every profile is either inactive, deleted or
        opted out.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs">
        Nobody matches all of these at once:
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {filters.map((filter) => (
          <li
            key={filter}
            className="bg-muted rounded-md px-2 py-0.5 text-xs"
          >
            {filter}
          </li>
        ))}
      </ul>
      {onClear ? (
        <Button variant="outline" size="sm" onClick={onClear}>
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}

function ChannelBreakdown({
  data,
  channels,
}: Readonly<{ data: AudiencePreview; channels: BroadcastChannel[] }>) {
  const rows: { channel: BroadcastChannel; label: string; count: number }[] = [
    { channel: "IN_APP", label: "In-app", count: data.reachable.IN_APP },
    { channel: "WHATSAPP", label: "WhatsApp", count: data.reachable.WHATSAPP },
    { channel: "EMAIL", label: "Email", count: data.reachable.EMAIL },
  ];

  return (
    <dl className="space-y-1.5 text-sm">
      {rows.map((row) => {
        const selected = channels.includes(row.channel);
        return (
          <div
            key={row.channel}
            className={`flex items-center justify-between ${
              selected ? "" : "text-muted-foreground/60"
            }`}
          >
            <dt>
              {row.label}
              {selected ? "" : " (not selected)"}
            </dt>
            <dd className="tabular-nums">{fmt(row.count)}</dd>
          </div>
        );
      })}
      {channels.includes("WHATSAPP") ? (
        <div className="text-muted-foreground border-none pt-1 text-xs">
          {fmt(data.freeWhatsapp)} of them wrote to us in the last 24h, so they
          cost nothing. {fmt(data.billableWhatsapp)} need a paid template.
        </div>
      ) : null}
    </dl>
  );
}

function CostLine({
  data,
  channels,
}: Readonly<{ data: AudiencePreview; channels: BroadcastChannel[] }>) {
  if (!channels.includes("WHATSAPP")) {
    return (
      <p className="bg-muted rounded-lg p-3 text-sm">
        No WhatsApp: this send costs nothing.
      </p>
    );
  }

  return (
    <p className="bg-muted rounded-lg p-3 text-sm">
      Roughly{" "}
      <span className="font-medium tabular-nums">
        {fmt(data.billableWhatsapp)}
      </span>{" "}
      paid message{data.billableWhatsapp === 1 ? "" : "s"}. The exact figure is
      confirmed when you send.
    </p>
  );
}

function Sample({
  sample,
  total,
}: Readonly<{ sample: AudiencePreview["sample"]; total: number }>) {
  if (sample.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground text-xs font-medium">For example</p>
      <ul className="space-y-1 text-sm">
        {sample.map((profile) => (
          <li key={profile.id} className="flex justify-between gap-2">
            <span className="truncate">
              {profile.firstName} {profile.lastName}
            </span>
            {profile.city ? (
              <span className="text-muted-foreground shrink-0 text-xs">
                {profile.city}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      {total > sample.length ? (
        <p className="text-muted-foreground text-xs">
          and {fmt(total - sample.length)} more
        </p>
      ) : null}
    </div>
  );
}
