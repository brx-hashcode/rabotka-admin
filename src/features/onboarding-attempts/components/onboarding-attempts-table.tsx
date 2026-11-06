import { useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  IconBrandWhatsapp,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconConfetti,
  IconCopy,
  IconMail,
  IconPhone,
  IconPhoneCheck,
  IconUserSearch,
  IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
import { Textarea } from "#/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "#/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import { cn } from "#/lib/utils";
import {
  listOnboardingAttempts,
  markOnboardingContacted,
  type AdminOnboardingAttempt,
  type AdminOnboardingStats,
  type OnboardingEntry,
  type OnboardingStage,
} from "#/lib/api/onboarding-attempts-controller";
import {
  contactOf,
  emailFollowUpLink,
  initials,
  isWarmLead,
  pageRange,
  stageLabel,
  stagesFor,
  type EntryFilter,
  timeAgo,
  whatsAppFollowUpLink,
} from "../stage-labels";

const PAGE_SIZE = 20;

/** Follow-up first: the page exists to work through the people to call. */
type FollowUp = "to-call" | "contacted" | "completed" | "all";

function queryFor(tab: FollowUp, stage: OnboardingStage | null) {
  const stageFilter = stage ? { stage: [stage] } : {};
  switch (tab) {
    case "to-call":
      return { ...stageFilter, incomplete: !stage, contacted: false };
    case "contacted":
      return { ...stageFilter, incomplete: !stage, contacted: true };
    case "completed":
      return { stage: ["COMPLETED" as const] };
    default:
      return stageFilter;
  }
}

const fullName = (a: AdminOnboardingAttempt) =>
  [a.firstName, a.lastName].filter(Boolean).join(" ");

/** « Business » for a business sign-up, else the profile type they chose. */
const kindLabel = (a: Pick<AdminOnboardingAttempt, "entry" | "profileType">) =>
  a.entry === "business"
    ? "Business"
    : a.profileType === "WORKER"
      ? "Worker"
      : "Employer";

export function OnboardingAttemptsTable({
  stats,
  entry = "all",
  stage,
  onClearStage,
  window = {},
}: Readonly<{
  stats: AdminOnboardingStats | undefined;
  /** The page's kind of sign-up: the list shows the same people as the numbers. */
  entry?: EntryFilter;
  stage: OnboardingStage | null;
  onClearStage: () => void;
  /** The page's period: the list covers the same sign-ups as the numbers. */
  window?: { startedFrom?: string; startedTo?: string };
}>) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<FollowUp>("to-call");
  const [openId, setOpenId] = useState<string | null>(null);

  // A step picked above narrows the list; going back to page 1 with it.
  const [lastStage, setLastStage] = useState(stage);
  if (stage !== lastStage) {
    setLastStage(stage);
    setPage(1);
    if (tab === "completed") setTab("to-call");
  }

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "onboarding-attempts", "list", page, q, tab, stage, entry, window],
    queryFn: () =>
      listOnboardingAttempts({
        page,
        limit: PAGE_SIZE,
        q: q || undefined,
        ...queryFor(tab, stage),
        ...(entry === "all" ? {} : { entry }),
        ...window,
      }),
    placeholderData: keepPreviousData,
  });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const open = rows.find((r) => r.id === openId) ?? null;

  // Counts on the tabs only make sense for the whole list, not one step.
  const counts: Partial<Record<FollowUp, number>> =
    stats && !stage
      ? {
          "to-call": Math.max(0, stats.dropped - stats.contacted),
          contacted: stats.contacted,
          completed: stats.completed,
          all: stats.started,
        }
      : {};

  const tabs: { value: FollowUp; label: string }[] = [
    { value: "to-call", label: "To call back" },
    { value: "contacted", label: "Contacted" },
    { value: "completed", label: "Finished" },
    { value: "all", label: "All" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">People</CardTitle>
        <p className="text-muted-foreground text-xs">
          Who started, where each one stopped, and who has already been called back.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as FollowUp);
              setPage(1);
              if (v === "completed") onClearStage();
            }}
          >
            <TabsList className="h-9">
              {tabs.map((t) => (
                <TabsTrigger key={t.value} value={t.value} className="cursor-pointer">
                  {t.label}
                  {counts[t.value] !== undefined && (
                    <span className="text-muted-foreground ml-1.5 tabular-nums">
                      {counts[t.value]}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {stage && (
            <Badge variant="secondary" className="gap-1 py-1 pl-2.5">
              Stopped at: {stageLabel(stage, entry)}
              <button
                type="button"
                onClick={onClearStage}
                aria-label="Remove the step filter"
                className="hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <IconX className="size-3" />
              </button>
            </Badge>
          )}

          <Input
            name="q"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search a name, phone or email…"
            className="ml-auto h-9 w-full max-w-xs"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Person</TableHead>
              <TableHead className="w-[260px]">Step reached</TableHead>
              <TableHead className="hidden w-[150px] lg:table-cell">Activity</TableHead>
              <TableHead className="hidden w-[220px] md:table-cell">Follow-up</TableHead>
              <TableHead className="w-[150px] text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && rows.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-11 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-14">
                  <div className="text-muted-foreground flex flex-col items-center gap-2 text-center text-sm">
                    <span className="bg-muted flex size-10 items-center justify-center rounded-full">
                      {tab === "to-call" ? (
                        <IconConfetti className="size-5" />
                      ) : (
                        <IconUserSearch className="size-5" />
                      )}
                    </span>
                    {tab === "to-call"
                      ? "Nobody to call back in this period."
                      : "No sign-ups match these filters."}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <AttemptRow
                  key={row.id}
                  row={row}
                  selected={row.id === openId}
                  onOpen={() => setOpenId(row.id)}
                />
              ))
            )}
          </TableBody>
        </Table>

        {total > 0 && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-sm tabular-nums">
              {pageRange(page, PAGE_SIZE, total)}
            </span>
            {lastPage > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="size-8"
                  aria-label="Previous page"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <IconChevronLeft className="size-4" />
                </Button>
                <span className="text-muted-foreground px-2 text-sm tabular-nums">
                  {page} / {lastPage}
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  className="size-8"
                  aria-label="Next page"
                  disabled={page >= lastPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <IconChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <AttemptSheet attempt={open} onClose={() => setOpenId(null)} />
    </Card>
  );
}

/**
 * One person to call: who, how far they got, when, where the follow-up
 * stands, and the three ways to act — call, WhatsApp, note the call.
 */
function AttemptRow({
  row,
  selected,
  onOpen,
}: Readonly<{
  row: AdminOnboardingAttempt;
  selected: boolean;
  onOpen: () => void;
}>) {
  const name = fullName(row);
  const contact = contactOf(row);
  const done = row.stage === "COMPLETED";
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <TableRow
      className={cn("group cursor-pointer", selected && "bg-muted/60")}
      onClick={onOpen}
      data-state={selected ? "selected" : undefined}
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
              done
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                : "bg-primary/10 text-primary",
            )}
          >
            {initials(row.firstName, row.lastName, contact)}
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="flex items-center gap-2 truncate font-medium">
              {name || (
                <span className="text-muted-foreground font-normal italic">
                  No name yet
                </span>
              )}
              {(row.entry === "business" || row.profileType) && (
                <Badge variant="outline" className="font-normal">
                  {kindLabel(row)}
                </Badge>
              )}
            </span>
            <span className="text-muted-foreground flex items-center gap-1 text-xs tabular-nums">
              {contact}
              <button
                type="button"
                onClick={(e) => {
                  stop(e);
                  void navigator.clipboard
                    ?.writeText(contact)
                    .then(() => toast.success(row.phone ? "Number copied" : "Address copied"));
                }}
                aria-label={row.phone ? "Copy the number" : "Copy the address"}
                className="hover:text-foreground rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <IconCopy className="size-3" />
              </button>
            </span>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <StageCell stage={row.stage} entry={row.entry} codeSends={row.codeSends} />
      </TableCell>

      <TableCell className="hidden lg:table-cell">
        <div className="flex flex-col text-xs">
          <span title={new Date(row.lastActivityAt).toLocaleString("en-GB")}>
            Active {timeAgo(row.lastActivityAt)}
          </span>
          <span
            className="text-muted-foreground"
            title={new Date(row.startedAt).toLocaleString("en-GB")}
          >
            Started {timeAgo(row.startedAt)}
          </span>
        </div>
      </TableCell>

      <TableCell className="hidden md:table-cell">
        <FollowUpCell row={row} />
      </TableCell>

      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1.5">
          {row.phone ? (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="size-8"
                onClick={stop}
                render={
                  <a href={`tel:${row.phone.replace(/\s/g, "")}`} aria-label="Call" />
                }
              >
                <IconPhone className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 text-emerald-600"
                onClick={stop}
                render={
                  <a
                    href={whatsAppFollowUpLink(row.phone, row.firstName)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Message ${name || contact} on WhatsApp`}
                  />
                }
              >
                <IconBrandWhatsapp className="size-4" />
              </Button>
            </>
          ) : row.email ? (
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={stop}
              render={
                <a
                  href={emailFollowUpLink(row.email, row.firstName)}
                  aria-label={`Email ${name || row.email}`}
                />
              }
            >
              <IconMail className="size-4" />
            </Button>
          ) : null}
          {!done && (
            <Button
              size="sm"
              variant={row.contactedAt ? "ghost" : "secondary"}
              onClick={(e) => {
                stop(e);
                onOpen();
              }}
            >
              {row.contactedAt ? "View" : "Log call"}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

/**
 * Where they stopped, as a pill and five segments that line up row to row,
 * plus the two signals that change how to call: almost done, or a code that
 * may never have arrived.
 */
function StageCell({
  stage,
  entry,
  codeSends,
}: Readonly<{ stage: OnboardingStage; entry: OnboardingEntry; codeSends: number }>) {
  const stages = stagesFor(entry);
  const reached = stages.indexOf(stage);
  const done = stage === "COMPLETED";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "rounded-md px-2 py-0.5 text-xs font-medium",
            done
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
              : "bg-muted text-foreground",
          )}
        >
          {done ? "Account created" : stageLabel(stage, entry)}
        </span>
        {isWarmLead(stage) && (
          <span
            className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400"
            title="Got far: a call has a good chance of finishing the sign-up."
          >
            Almost done
          </span>
        )}
        {stage === "CODE_SENT" && codeSends > 1 && (
          <span
            className="bg-destructive/10 text-destructive rounded-md px-2 py-0.5 text-xs font-medium"
            title={`${codeSends} codes requested without success: the code may not be arriving.`}
          >
            Code not received?
          </span>
        )}
      </div>
      <div className="flex max-w-[200px] gap-1" aria-hidden>
        {stages.map((s, i) => (
          <span
            key={s}
            className={cn(
              "h-1 flex-1 rounded-full",
              i <= reached ? (done ? "bg-emerald-500" : "bg-primary") : "bg-muted",
            )}
          />
        ))}
      </div>
    </div>
  );
}

/** Where the follow-up stands, with the note's first line. */
function FollowUpCell({ row }: Readonly<{ row: AdminOnboardingAttempt }>) {
  if (row.stage === "COMPLETED") {
    return <span className="text-muted-foreground text-xs">Finished</span>;
  }
  if (!row.contactedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
        <span className="size-1.5 rounded-full bg-amber-500" />
        To call back
      </span>
    );
  }
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        <IconPhoneCheck className="size-3.5" />
        Contacted {timeAgo(row.contactedAt)}
      </span>
      {(row.contactNote || row.contactedBy) && (
        <span
          className="text-muted-foreground truncate text-xs"
          title={row.contactNote ?? undefined}
        >
          {row.contactedBy && `${row.contactedBy} · `}
          {row.contactNote}
        </span>
      )}
    </div>
  );
}

/** The attempt's timeline and the follow-up note, beside the list. */
function AttemptSheet({
  attempt,
  onClose,
}: Readonly<{
  attempt: AdminOnboardingAttempt | null;
  onClose: () => void;
}>) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [forId, setForId] = useState<string | null>(null);
  if (attempt && attempt.id !== forId) {
    setForId(attempt.id);
    setNote(attempt.contactNote ?? "");
  }

  const save = useMutation({
    mutationFn: () => markOnboardingContacted(attempt!.id, note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "onboarding-attempts"] });
      toast.success("Call logged");
      onClose();
    },
    onError: () => toast.error("Could not save the follow-up"),
  });

  const stages = attempt ? stagesFor(attempt.entry) : [];
  const reached = attempt ? stages.indexOf(attempt.stage) : -1;
  const when: Partial<Record<OnboardingStage, string | null>> = attempt
    ? {
        CODE_SENT: attempt.startedAt,
        PHONE_VERIFIED: attempt.phoneVerifiedAt,
        COMPLETED: attempt.completedAt,
      }
    : {};

  return (
    <Sheet open={attempt !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        {attempt && (
          <>
            <SheetHeader>
              <SheetTitle>{fullName(attempt) || contactOf(attempt)}</SheetTitle>
              <SheetDescription>
                {contactOf(attempt)}
                {(attempt.entry === "business" || attempt.profileType) &&
                  ` · ${kindLabel(attempt)}`}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4">
              <ol className="flex flex-col">
                {stages.map((s, i) => {
                  const ok = i <= reached;
                  const at = when[s];
                  return (
                    <li key={s} className="flex gap-3 pb-4 last:pb-0">
                      <span
                        className={cn(
                          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                          ok ? "bg-primary text-primary-foreground" : "bg-muted",
                        )}
                      >
                        {ok && <IconCheck className="size-3" />}
                      </span>
                      <div className="flex flex-col">
                        <span className={cn("text-sm", !ok && "text-muted-foreground")}>
                          {stageLabel(s, attempt.entry)}
                          {s === "CODE_SENT" && attempt.codeSends > 1 &&
                            ` (${attempt.codeSends} codes)`}
                        </span>
                        {ok && at && (
                          <span className="text-muted-foreground text-xs">
                            {new Date(at).toLocaleString("en-GB", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                        )}
                        {i === reached && s !== "COMPLETED" && (
                          <span className="text-destructive text-xs">Stopped here</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>

              {attempt.stage !== "COMPLETED" && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Call follow-up</span>
                  {attempt.contactedAt && (
                    <span className="text-muted-foreground text-xs">
                      Contacted {timeAgo(attempt.contactedAt)}
                      {attempt.contactedBy && ` by ${attempt.contactedBy}`}
                    </span>
                  )}
                  <Textarea
                    name="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 1000))}
                    placeholder="Why they did not finish, and what would help. E.g. the WhatsApp code was not arriving."
                    rows={5}
                  />
                </div>
              )}
            </div>

            <SheetFooter className="flex-row gap-2">
              {attempt.phone ? (
                <Button
                  variant="outline"
                  className="flex-1"
                  render={
                    <a
                      href={whatsAppFollowUpLink(attempt.phone, attempt.firstName)}
                      target="_blank"
                      rel="noreferrer"
                    />
                  }
                >
                  <IconBrandWhatsapp className="size-4" />
                  WhatsApp
                </Button>
              ) : attempt.email ? (
                <Button
                  variant="outline"
                  className="flex-1"
                  render={<a href={emailFollowUpLink(attempt.email, attempt.firstName)} />}
                >
                  <IconMail className="size-4" />
                  Email
                </Button>
              ) : null}
              {attempt.stage !== "COMPLETED" && (
                <Button
                  className="flex-1"
                  onClick={() => save.mutate()}
                  disabled={save.isPending}
                >
                  {attempt.contactedAt ? "Update" : "Mark contacted"}
                </Button>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
