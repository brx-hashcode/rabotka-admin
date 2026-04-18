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
import { CalendarDays, CheckCircle2, Clock, Loader2 } from "lucide-react";
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

type DispatchStatus = "sent" | "in-progress" | "upcoming";

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

/** Convert stored UTC "HH:MM" to local "HH:MM" for display and comparison */
function utcTimeToLocal(utcTime: string): string {
  const [h, m] = utcTime.split(":").map(Number);
  const d = new Date();
  d.setUTCHours(h, m, 0, 0);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Computes the planned dispatch dates for an advertisement.
 * The backend dispatches at 08:00 UTC daily using:
 *   expectedSends = floor((daysSinceStart / 7) * freqPerWeek) + 1
 *
 * Status is purely time-based:
 * - "sent"        = 08:00 UTC has passed for that date
 * - "in-progress" = today, but 08:00 UTC hasn't passed yet
 * - "upcoming"    = future date
 */
function computeDispatchDates(
  startDate: Date,
  endDate: Date,
  freqPerWeek: number,
  dispatchTime: string,
): DispatchEntry[] {
  const now = new Date();
  const localTime = utcTimeToLocal(dispatchTime);
  const [dispatchHour, dispatchMinute] = localTime.split(":").map(Number);
  const totalDays = differenceInCalendarDays(endDate, startDate) + 1;
  const dispatches: DispatchEntry[] = [];
  let previousExpected = 0;

  for (let day = 0; day < totalDays; day++) {
    const expected = Math.floor((day / 7) * freqPerWeek) + 1;
    if (expected > previousExpected) {
      const dispatchDay = addDays(startDate, day);
      const dispatchAt = setSeconds(setMinutes(setHours(dispatchDay, dispatchHour), dispatchMinute), 0);

      let status: DispatchStatus;
      if (isBefore(dispatchAt, now)) {
        status = "sent";
      } else if (isToday(dispatchDay)) {
        status = "in-progress";
      } else {
        status = "upcoming";
      }

      dispatches.push({ date: dispatchDay, dayIndex: day, status });
      previousExpected = expected;
    }
  }

  return dispatches;
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

  const { weeks, sentCount, totalDispatches } = useMemo(() => {
    const startDate = startOfDay(parseISO(ad.start_date));
    const endDate = startOfDay(parseISO(ad.end_date));
    const dispatches = computeDispatchDates(startDate, endDate, freqPerWeek, ad.dispatch_time ?? "08:00");
    const grouped = groupIntoWeeks(startDate, endDate, dispatches);
    const sent = dispatches.filter((d) => d.status === "sent").length;
    return { weeks: grouped, sentCount: sent, totalDispatches: dispatches.length };
  }, [ad.start_date, ad.end_date, freqPerWeek]);

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
              {utcTimeToLocal(ad.dispatch_time ?? "08:00")} local
            </Badge>
            <Badge variant="outline" className="text-xs">
              {freqPerWeek}x / week
            </Badge>
            <Badge className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10 gap-1">
              <CheckCircle2 className="size-3" />
              {sentCount} sent
            </Badge>
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {totalDispatches - sentCount} upcoming
            </Badge>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">

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
                          {utcTimeToLocal(ad.dispatch_time ?? "08:00")}
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
