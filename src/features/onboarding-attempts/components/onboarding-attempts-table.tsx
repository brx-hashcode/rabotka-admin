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
import { Card, CardContent } from "#/components/ui/card";
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
  ONBOARDING_STAGES,
  type AdminOnboardingAttempt,
  type AdminOnboardingStats,
  type OnboardingStage,
} from "#/lib/api/onboarding-attempts-controller";
import {
  STAGE_LABELS,
  contactOf,
  emailFollowUpLink,
  initials,
  isWarmLead,
  pageRange,
  stageIndex,
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

export function OnboardingAttemptsTable({
  stats,
  stage,
  onClearStage,
  window = {},
}: Readonly<{
  stats: AdminOnboardingStats | undefined;
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
    queryKey: ["admin", "onboarding-attempts", "list", page, q, tab, stage, window],
    queryFn: () =>
      listOnboardingAttempts({
        page,
        limit: PAGE_SIZE,
        q: q || undefined,
        ...queryFor(tab, stage),
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
    { value: "to-call", label: "À rappeler" },
    { value: "contacted", label: "Contactées" },
    { value: "completed", label: "Terminées" },
    { value: "all", label: "Toutes" },
  ];

  return (
    <Card className="shadow-soft">
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
              Arrêtées à : {STAGE_LABELS[stage]}
              <button
                type="button"
                onClick={onClearStage}
                aria-label="Retirer le filtre d'étape"
                className="hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <IconX className="size-3" />
              </button>
            </Badge>
          )}

          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher un nom, un téléphone…"
            className="ml-auto h-9 w-full max-w-xs"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Personne</TableHead>
              <TableHead className="w-[260px]">Étape atteinte</TableHead>
              <TableHead className="hidden w-[150px] lg:table-cell">Activité</TableHead>
              <TableHead className="hidden w-[220px] md:table-cell">Suivi</TableHead>
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
                      ? "Personne à rappeler sur cette période."
                      : "Aucune inscription pour ces critères."}
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
                  aria-label="Page précédente"
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
                  aria-label="Page suivante"
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
                  Nom pas encore saisi
                </span>
              )}
              {row.profileType && (
                <Badge variant="outline" className="font-normal">
                  {row.profileType === "WORKER" ? "Travailleur" : "Employeur"}
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
                    .then(() => toast.success(row.phone ? "Numéro copié" : "Adresse copiée"));
                }}
                aria-label={row.phone ? "Copier le numéro" : "Copier l'adresse"}
                className="hover:text-foreground rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <IconCopy className="size-3" />
              </button>
            </span>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <StageCell stage={row.stage} codeSends={row.codeSends} />
      </TableCell>

      <TableCell className="hidden lg:table-cell">
        <div className="flex flex-col text-xs">
          <span title={new Date(row.lastActivityAt).toLocaleString("fr")}>
            Active {timeAgo(row.lastActivityAt)}
          </span>
          <span
            className="text-muted-foreground"
            title={new Date(row.startedAt).toLocaleString("fr")}
          >
            Commencée {timeAgo(row.startedAt)}
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
                  <a href={`tel:${row.phone.replace(/\s/g, "")}`} aria-label="Appeler" />
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
                    aria-label={`Écrire à ${name || contact} sur WhatsApp`}
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
                  aria-label={`Écrire à ${name || row.email} par e-mail`}
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
              {row.contactedAt ? "Voir" : "Noter"}
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
  codeSends,
}: Readonly<{ stage: OnboardingStage; codeSends: number }>) {
  const reached = stageIndex(stage);
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
          {done ? "Compte créé" : STAGE_LABELS[stage]}
        </span>
        {isWarmLead(stage) && (
          <span
            className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400"
            title="Arrivée loin : un appel a de bonnes chances de finir l'inscription."
          >
            Presque fini
          </span>
        )}
        {stage === "CODE_SENT" && codeSends > 1 && (
          <span
            className="bg-destructive/10 text-destructive rounded-md px-2 py-0.5 text-xs font-medium"
            title={`${codeSends} codes demandés sans succès : le code n'arrive peut-être pas.`}
          >
            Code non reçu ?
          </span>
        )}
      </div>
      <div className="flex max-w-[200px] gap-1" aria-hidden>
        {ONBOARDING_STAGES.map((s, i) => (
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
    return <span className="text-muted-foreground text-xs">Terminée</span>;
  }
  if (!row.contactedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
        <span className="size-1.5 rounded-full bg-amber-500" />
        À rappeler
      </span>
    );
  }
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        <IconPhoneCheck className="size-3.5" />
        Contactée {timeAgo(row.contactedAt)}
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
      toast.success("Appel noté");
      onClose();
    },
    onError: () => toast.error("Impossible d'enregistrer le suivi"),
  });

  const reached = attempt ? stageIndex(attempt.stage) : -1;
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
                {attempt.profileType &&
                  ` · ${attempt.profileType === "WORKER" ? "Travailleur" : "Employeur"}`}
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4">
              <ol className="flex flex-col">
                {ONBOARDING_STAGES.map((s, i) => {
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
                          {STAGE_LABELS[s]}
                          {s === "CODE_SENT" && attempt.codeSends > 1 &&
                            ` (${attempt.codeSends} codes)`}
                        </span>
                        {ok && at && (
                          <span className="text-muted-foreground text-xs">
                            {new Date(at).toLocaleString("fr", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                        )}
                        {i === reached && s !== "COMPLETED" && (
                          <span className="text-destructive text-xs">S'est arrêtée ici</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>

              {attempt.stage !== "COMPLETED" && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Suivi de l'appel</span>
                  {attempt.contactedAt && (
                    <span className="text-muted-foreground text-xs">
                      Contactée {timeAgo(attempt.contactedAt)}
                      {attempt.contactedBy && ` par ${attempt.contactedBy}`}
                    </span>
                  )}
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 1000))}
                    placeholder="Pourquoi la personne n'a pas terminé, et ce qui l'aiderait. Ex : le code WhatsApp n'arrivait pas."
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
                  E-mail
                </Button>
              ) : null}
              {attempt.stage !== "COMPLETED" && (
                <Button
                  className="flex-1"
                  onClick={() => save.mutate()}
                  disabled={save.isPending}
                >
                  {attempt.contactedAt ? "Mettre à jour" : "Marquer contactée"}
                </Button>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
