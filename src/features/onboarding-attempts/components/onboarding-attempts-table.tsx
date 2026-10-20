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
  IconPhoneCheck,
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
import { STAGE_LABELS, stageIndex, timeAgo, whatsAppLink } from "../stage-labels";

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
}: Readonly<{
  stats: AdminOnboardingStats | undefined;
  stage: OnboardingStage | null;
  onClearStage: () => void;
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
    queryKey: ["admin", "onboarding-attempts", "list", page, q, tab, stage],
    queryFn: () =>
      listOnboardingAttempts({
        page,
        limit: PAGE_SIZE,
        q: q || undefined,
        ...queryFor(tab, stage),
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
              <TableHead className="w-[280px]">Progression</TableHead>
              <TableHead className="w-[140px]">Dernière activité</TableHead>
              <TableHead className="w-[220px] text-right">Suivi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && rows.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-9 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-12 text-center">
                  {tab === "to-call"
                    ? "Personne à rappeler ici. 🎉"
                    : "Aucune inscription pour ces critères."}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => setOpenId(row.id)}
                >
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-2 font-medium">
                        {fullName(row) || (
                          <span className="text-muted-foreground font-normal italic">
                            Nom inconnu
                          </span>
                        )}
                        {row.profileType && (
                          <Badge variant="outline" className="font-normal">
                            {row.profileType === "WORKER" ? "Travailleur" : "Employeur"}
                          </Badge>
                        )}
                      </span>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {row.phone}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StageProgress stage={row.stage} codeSends={row.codeSends} />
                  </TableCell>
                  <TableCell
                    className="text-muted-foreground text-sm"
                    title={new Date(row.lastActivityAt).toLocaleString("fr")}
                  >
                    {timeAgo(row.lastActivityAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {row.contactedAt && (
                        <span
                          className="text-muted-foreground inline-flex items-center gap-1 text-xs"
                          title={row.contactNote ?? undefined}
                        >
                          <IconPhoneCheck className="size-4 text-emerald-600" />
                          {timeAgo(row.contactedAt)}
                        </span>
                      )}
                      <Button
                        size="icon"
                        variant="outline"
                        className="size-8"
                        onClick={(e) => e.stopPropagation()}
                        render={
                          <a
                            href={whatsAppLink(row.phone)}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Écrire à ${fullName(row) || row.phone} sur WhatsApp`}
                          />
                        }
                      >
                        <IconBrandWhatsapp className="size-4" />
                      </Button>
                      {row.stage !== "COMPLETED" && (
                        <Button
                          size="sm"
                          variant={row.contactedAt ? "ghost" : "secondary"}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenId(row.id);
                          }}
                        >
                          {row.contactedAt ? "Voir" : "Noter l'appel"}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {lastPage > 1 && (
          <div className="flex items-center justify-end gap-2">
            <span className="text-muted-foreground text-sm">
              Page {page} sur {lastPage}
            </span>
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Précédent
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= lastPage}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
            </Button>
          </div>
        )}
      </CardContent>

      <AttemptSheet attempt={open} onClose={() => setOpenId(null)} />
    </Card>
  );
}

/**
 * Five segments, one per step, filled up to where they got — the drop-off
 * point reads at a glance, and lines up row to row.
 */
function StageProgress({
  stage,
  codeSends,
}: Readonly<{
  stage: OnboardingStage;
  codeSends: number;
}>) {
  const reached = stageIndex(stage);
  const done = stage === "COMPLETED";
  const filled = done ? "bg-emerald-500" : "bg-primary";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1" aria-hidden>
        {ONBOARDING_STAGES.map((s, i) => (
          <span
            key={s}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i <= reached ? filled : "bg-muted",
            )}
          />
        ))}
      </div>
      <span className="text-xs">
        {done ? "Compte créé" : `Arrêtée : ${STAGE_LABELS[stage]}`}
        {stage === "CODE_SENT" && codeSends > 1 && (
          <span
            className="text-destructive ml-1.5"
            title="Plusieurs codes demandés sans succès : le code n'arrive peut-être pas."
          >
            · {codeSends} codes demandés
          </span>
        )}
      </span>
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
              <SheetTitle>{fullName(attempt) || attempt.phone}</SheetTitle>
              <SheetDescription>
                {attempt.phone}
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
              <Button
                variant="outline"
                className="flex-1"
                render={
                  <a href={whatsAppLink(attempt.phone)} target="_blank" rel="noreferrer" />
                }
              >
                <IconBrandWhatsapp className="size-4" />
                WhatsApp
              </Button>
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
