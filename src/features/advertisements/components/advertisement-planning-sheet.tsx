import { useMemo } from "react";
import {
  format,
  addDays,
  startOfDay,
  parseISO,
  differenceInCalendarDays,
  isBefore,
  isToday,
  setHours,
  setMinutes,
  setSeconds,
} from "date-fns";
import { AlertCircle, CalendarDays, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "#/components/ui/sheet";
import type { Advertisement } from "#/lib/api/advertisements-controller";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advertisement: Advertisement;
};

type DispatchStatus = "sent" | "in-progress" | "pending" | "upcoming";

type DispatchEntry = {
  date: Date;
  dayIndex: number;
  status: DispatchStatus;
};

type Week = {
  weekNumber: number;
  from: Date;
  to: Date;
  dispatches: DispatchEntry[];
};

/**
 * Computes the planned dispatch dates for an advertisement.
 * The backend dispatches at 08:00 UTC daily using:
 *   expectedSends = floor((daysSinceStart / 7) * freqPerWeek) + 1
 *
 * Status is derived from the ad's actual total_sent count (from delivery logs),
 * not from the current time — to avoid false "Sent" labels when the backend
 * missed or delayed a dispatch (e.g. ad was approved after start_date).
 *
 * "pending" means the scheduled time passed but no delivery log recorded yet —
 * the backend will catch up on the next daily dispatch run.
 */
function computeDispatchDates(
  startDate: Date,
  endDate: Date,
  freqPerWeek: number,
  actualSentCount: number,
): DispatchEntry[] {
  const now = new Date();
  const totalDays = differenceInCalendarDays(endDate, startDate) + 1;
  const dispatches: DispatchEntry[] = [];
  let previousExpected = 0;

  for (let day = 0; day < totalDays; day++) {
    const expected = Math.floor((day / 7) * freqPerWeek) + 1;
    if (expected > previousExpected) {
      const dispatchDay = addDays(startDate, day);
      const dispatchAt = setSeconds(setMinutes(setHours(dispatchDay, 8), 0), 0);
      const slotIndex = dispatches.length;

      const status = resolveStatus(slotIndex, actualSentCount, dispatchDay, dispatchAt, now);

      dispatches.push({ date: dispatchDay, dayIndex: day, status });
      previousExpected = expected;
    }
  }

  return dispatches;
}

function resolveStatus(
  slotIndex: number,
  actualSentCount: number,
  dispatchDay: Date,
  dispatchAt: Date,
  now: Date,
): DispatchStatus {
  if (slotIndex < actualSentCount) return "sent";
  if (isToday(dispatchDay) && isBefore(now, dispatchAt)) return "in-progress";
  if (isBefore(dispatchAt, now)) return "pending";
  return "upcoming";
}

function groupIntoWeeks(
  startDate: Date,
  endDate: Date,
  dispatches: DispatchEntry[],
): Week[] {
  const totalDays = differenceInCalendarDays(endDate, startDate) + 1;
  const totalWeeks = Math.ceil(totalDays / 7);
  const weeks: Week[] = [];

  for (let w = 0; w < totalWeeks; w++) {
    const weekFrom = addDays(startDate, w * 7);
    const weekTo = addDays(startDate, Math.min((w + 1) * 7 - 1, totalDays - 1));
    const weekDispatches = dispatches.filter(
      (d) => d.dayIndex >= w * 7 && d.dayIndex < (w + 1) * 7,
    );
    weeks.push({ weekNumber: w + 1, from: weekFrom, to: weekTo, dispatches: weekDispatches });
  }

  return weeks;
}

function entryRowClass(status: DispatchStatus): string {
  if (status === "sent") return "bg-emerald-500/5 border-emerald-500/20";
  if (status === "in-progress") return "bg-amber-400/5 border-amber-400/20";
  if (status === "pending") return "bg-orange-500/5 border-orange-500/20";
  return "bg-muted/20";
}

function entryTextClass(status: DispatchStatus): string {
  if (status === "sent") return "text-muted-foreground";
  return "text-foreground";
}

function DispatchStatusIndicator({ status }: Readonly<{ status: DispatchStatus }>) {
  if (status === "sent") {
    return <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />;
  }
  if (status === "in-progress") {
    return <Loader2 className="size-4 text-amber-400 shrink-0 animate-spin" />;
  }
  if (status === "pending") {
    return <AlertCircle className="size-4 text-orange-500 shrink-0" />;
  }
  return <div className="size-2 rounded-full bg-muted-foreground/40 shrink-0 mx-1" />;
}

function DispatchStatusBadge({ status }: Readonly<{ status: DispatchStatus }>) {
  if (status === "sent") {
    return (
      <Badge className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10">
        Sent
      </Badge>
    );
  }
  if (status === "in-progress") {
    return (
      <Badge className="text-xs bg-amber-400/10 text-amber-500 border-amber-400/20 hover:bg-amber-400/10">
        Today
      </Badge>
    );
  }
  if (status === "pending") {
    return (
      <Badge className="text-xs bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/10">
        Pending
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs text-muted-foreground">
      Upcoming
    </Badge>
  );
}

export function AdvertisementPlanningSheet({
  open,
  onOpenChange,
  advertisement: ad,
}: Readonly<Props>) {
  const freqPerWeek = ad.bundle?.max_frequency_per_week ?? 1;

  const { weeks, sentCount, pendingCount, totalDispatches } = useMemo(() => {
    const startDate = startOfDay(parseISO(ad.start_date));
    const endDate = startOfDay(parseISO(ad.end_date));
    const dispatches = computeDispatchDates(startDate, endDate, freqPerWeek, ad.total_sent);
    const grouped = groupIntoWeeks(startDate, endDate, dispatches);
    const sent = dispatches.filter((d) => d.status === "sent").length;
    const pending = dispatches.filter((d) => d.status === "pending").length;
    return { weeks: grouped, sentCount: sent, pendingCount: pending, totalDispatches: dispatches.length };
  }, [ad.start_date, ad.end_date, ad.total_sent, freqPerWeek]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col w-full sm:max-w-lg overflow-hidden p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <CalendarDays className="size-5 text-emerald-500" />
            Dispatch Planning
          </SheetTitle>
          <SheetDescription className="line-clamp-2">
            {ad.title}
          </SheetDescription>
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <Badge variant="outline" className="text-xs gap-1">
              <Clock className="size-3" />
              08:00 UTC
            </Badge>
            <Badge variant="outline" className="text-xs">
              {freqPerWeek}x / week
            </Badge>
            <Badge className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10 gap-1">
              <CheckCircle2 className="size-3" />
              {sentCount} sent
            </Badge>
            {pendingCount > 0 && (
              <Badge className="text-xs bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/10 gap-1">
                <AlertCircle className="size-3" />
                {pendingCount} pending
              </Badge>
            )}
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {totalDispatches - sentCount - pendingCount} upcoming
            </Badge>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {pendingCount > 0 && (
            <div className="rounded-md border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-xs text-orange-500 leading-relaxed">
              <strong>{pendingCount} dispatch{pendingCount !== 1 ? "es" : ""}</strong> missed their scheduled time. The backend will catch up on the next daily run (08:00 UTC).
            </div>
          )}

          {weeks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No dispatch dates available.
            </p>
          ) : (
            weeks.map((week) => (
              <div key={week.weekNumber}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
                      Week {week.weekNumber}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      ({format(week.from, "dd MMM")} – {format(week.to, "dd MMM yyyy")})
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-border" />
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {week.dispatches.length} send{week.dispatches.length !== 1 ? "s" : ""}
                  </Badge>
                </div>

                {week.dispatches.length === 0 ? (
                  <p className="text-xs text-muted-foreground pl-2 italic">
                    No dispatch in this week
                  </p>
                ) : (
                  <div className="space-y-2">
                    {week.dispatches.map((entry, i) => (
                      <div
                        key={`w${week.weekNumber}-d${i}`}
                        className={`flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors ${entryRowClass(entry.status)}`}
                      >
                        <DispatchStatusIndicator status={entry.status} />
                        <span className={`text-sm font-medium flex-1 ${entryTextClass(entry.status)}`}>
                          {format(entry.date, "EEEE, dd MMMM yyyy")}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono shrink-0 mr-2">
                          08:00 UTC
                        </span>
                        <DispatchStatusBadge status={entry.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}

          <p className="text-xs text-muted-foreground text-center pt-2 pb-4">
            Actual dispatch times may vary by a few minutes depending on queue load.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
