import { useMemo } from "react";
import {
  format,
  addDays,
  startOfDay,
  parseISO,
  differenceInCalendarDays,
  isBefore,
  isToday,
} from "date-fns";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader,
} from "lucide-react";
import { Badge } from "#/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "#/components/ui/sheet";
import type { Advertisement } from "#/lib/api/advertisements-controller";
import { useAdvertisementAnalytics } from "#/hooks/use-advertisement-analytics";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advertisement: Advertisement;
};

type DispatchStatus = "sent" | "missed" | "in-progress" | "upcoming";

type DispatchEntry = {
  date: Date;
  dayIndex: number;
  status: DispatchStatus;
  scheduledAt: Date;   // always: the planned dispatch moment
  actualAt: Date | null; // only for "sent": real first-delivery timestamp
};

type Week = {
  weekNumber: number;
  from: Date;
  to: Date;
  dispatches: DispatchEntry[];
};

/** Convert stored UTC "HH:MM" to local-time Date on a given day */
function scheduledMoment(day: Date, utcTime: string): Date {
  const [h, m] = utcTime.split(":").map(Number);
  const d = new Date(day);
  d.setUTCHours(h, m, 0, 0);
  return d;
}

/** Format a UTC time string ("HH:MM") to local HH:MM for display */
function utcTimeToLocal(utcTime: string): string {
  const [h, m] = utcTime.split(":").map(Number);
  const d = new Date();
  d.setUTCHours(h, m, 0, 0);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Format a Date to local HH:MM */
function dateToLocalTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Computes the planned dispatch dates using the same formula as the backend:
 *   expectedSends = floor((daysSinceStart / 7) * freqPerWeek) + 1
 *
 * Status is driven by actual delivery records (dispatchedMap), NOT wall-clock time:
 * - "sent"        = delivery log exists for that UTC date
 * - "missed"      = past slot with no delivery log and not today
 * - "in-progress" = today, dispatch hasn't fired yet
 * - "upcoming"    = future slot
 */
function computeDispatchDates(
  startDate: Date,
  endDate: Date,
  freqPerWeek: number,
  dispatchTime: string,
  dispatchedMap: Map<string, Date>,
): DispatchEntry[] {
  const now = new Date();
  const totalDays = differenceInCalendarDays(endDate, startDate) + 1;
  const dispatches: DispatchEntry[] = [];
  let previousExpected = 0;

  for (let day = 0; day < totalDays; day++) {
    const expected = Math.floor((day / 7) * freqPerWeek) + 1;
    if (expected > previousExpected) {
      const dispatchDay = addDays(startDate, day);
      const scheduledAt = scheduledMoment(dispatchDay, dispatchTime);
      // UTC date key to match backend dispatch records
      const dayKey = format(dispatchDay, "yyyy-MM-dd");

      let status: DispatchStatus;
      let actualAt: Date | null = null;

      if (dispatchedMap.has(dayKey)) {
        status = "sent";
        actualAt = dispatchedMap.get(dayKey)!;
      } else if (isBefore(scheduledAt, now) && !isToday(dispatchDay)) {
        status = "missed";
      } else if (isToday(dispatchDay)) {
        status = "in-progress";
      } else {
        status = "upcoming";
      }

      dispatches.push({ date: dispatchDay, dayIndex: day, status, scheduledAt, actualAt });
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
  if (status === "missed") return "bg-orange-500/5 border-orange-500/20";
  if (status === "in-progress") return "bg-amber-400/5 border-amber-400/20";
  return "bg-muted/20";
}

function entryTextClass(status: DispatchStatus): string {
  if (status === "sent" || status === "missed") return "text-muted-foreground";
  return "text-foreground";
}

function DispatchStatusIndicator({ status }: Readonly<{ status: DispatchStatus }>) {
  if (status === "sent") return <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />;
  if (status === "missed") return <AlertTriangle className="size-4 text-orange-500 shrink-0" />;
  if (status === "in-progress") return <Loader className="size-4 text-amber-400 shrink-0 animate-spin" />;
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
  if (status === "missed") {
    return (
      <Badge className="text-xs bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/10">
        Missed
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

function TimeDisplay({ entry, utcDispatchTime }: Readonly<{ entry: DispatchEntry; utcDispatchTime: string }>) {
  if (entry.status === "sent" && entry.actualAt) {
    return (
      <span className="text-xs text-emerald-500 font-mono shrink-0 mr-2">
        {dateToLocalTime(entry.actualAt)}
      </span>
    );
  }
  if (entry.status === "missed") {
    return (
      <span className="text-xs text-muted-foreground font-mono shrink-0 mr-2 line-through opacity-60">
        {utcTimeToLocal(utcDispatchTime)}
      </span>
    );
  }
  return (
    <span className="text-xs text-muted-foreground font-mono shrink-0 mr-2">
      {utcTimeToLocal(utcDispatchTime)}
    </span>
  );
}

export function AdvertisementPlanningSheet({
  open,
  onOpenChange,
  advertisement: ad,
}: Readonly<Props>) {
  const freqPerWeek = ad.bundle?.max_frequency_per_week ?? 1;

  const { data: analytics } = useAdvertisementAnalytics(ad.id, open);

  const dispatchedMap = useMemo<Map<string, Date>>(() => {
    const map = new Map<string, Date>();
    for (const ev of analytics?.dispatchEvents ?? []) {
      map.set(ev.day, new Date(ev.dispatchedAt));
    }
    return map;
  }, [analytics?.dispatchEvents]);

  const { weeks, sentCount, missedCount, upcomingCount, totalDispatches } = useMemo(() => {
    const startDate = startOfDay(parseISO(ad.start_date));
    const endDate = startOfDay(parseISO(ad.end_date));
    const dispatches = computeDispatchDates(
      startDate,
      endDate,
      freqPerWeek,
      ad.dispatch_time ?? "08:00",
      dispatchedMap,
    );
    const grouped = groupIntoWeeks(startDate, endDate, dispatches);
    const sent = dispatches.filter((d) => d.status === "sent").length;
    const missed = dispatches.filter((d) => d.status === "missed").length;
    const upcoming = dispatches.filter(
      (d) => d.status === "upcoming" || d.status === "in-progress",
    ).length;
    return {
      weeks: grouped,
      sentCount: sent,
      missedCount: missed,
      upcomingCount: upcoming,
      totalDispatches: dispatches.length,
    };
  }, [ad.start_date, ad.end_date, freqPerWeek, dispatchedMap]);

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
          <SheetDescription className="line-clamp-2">{ad.title}</SheetDescription>
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
            {missedCount > 0 && (
              <Badge className="text-xs bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/10 gap-1">
                <AlertTriangle className="size-3" />
                {missedCount} missed
              </Badge>
            )}
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {upcomingCount} upcoming
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
                      ({format(week.from, "dd MMM")} –{" "}
                      {format(week.to, "dd MMM yyyy")})
                    </span>
                  </div>
                  <div className="flex-1 h-px bg-border" />
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {week.dispatches.length} send
                    {week.dispatches.length !== 1 ? "s" : ""}
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
                        <span
                          className={`text-sm font-medium flex-1 ${entryTextClass(entry.status)}`}
                        >
                          {format(entry.date, "EEEE, dd MMMM yyyy")}
                        </span>
                        <TimeDisplay entry={entry} utcDispatchTime={ad.dispatch_time ?? "08:00"} />
                        <DispatchStatusBadge status={entry.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}

          <p className="text-xs text-muted-foreground text-center pt-2 pb-4">
            Sent times reflect when the first message of that batch was actually delivered.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
