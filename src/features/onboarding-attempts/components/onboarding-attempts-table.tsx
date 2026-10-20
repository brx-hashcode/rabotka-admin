import { useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { IconBrandWhatsapp, IconPhoneCheck } from "@tabler/icons-react";
import { toast } from "sonner";
import { Card, CardContent } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
import { Textarea } from "#/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import {
  listOnboardingAttempts,
  markOnboardingContacted,
  type AdminOnboardingAttempt,
  type OnboardingStage,
} from "#/lib/api/onboarding-attempts-controller";
import { STAGE_LABELS, whatsAppLink } from "../stage-labels";

const PAGE_SIZE = 20;

/**
 * "Non terminées" first and by default: this page exists to find the people
 * to call. The single stages narrow that down to one place in the flow.
 */
type StageFilter = "INCOMPLETE" | "ALL" | OnboardingStage;
const STAGE_FILTERS: { value: StageFilter; label: string }[] = [
  { value: "INCOMPLETE", label: "Non terminées" },
  { value: "CODE_SENT", label: STAGE_LABELS.CODE_SENT },
  { value: "PHONE_VERIFIED", label: STAGE_LABELS.PHONE_VERIFIED },
  { value: "DOCUMENTS", label: STAGE_LABELS.DOCUMENTS },
  { value: "CONFIRMATION", label: STAGE_LABELS.CONFIRMATION },
  { value: "COMPLETED", label: STAGE_LABELS.COMPLETED },
  { value: "ALL", label: "Toutes" },
];

function stageVariant(stage: OnboardingStage) {
  if (stage === "COMPLETED") return "default" as const;
  if (stage === "CODE_SENT") return "destructive" as const;
  return "secondary" as const;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("fr", { dateStyle: "medium", timeStyle: "short" });

export function OnboardingAttemptsTable() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<StageFilter>("INCOMPLETE");
  const [onlyToCall, setOnlyToCall] = useState(false);
  const [contacting, setContacting] = useState<AdminOnboardingAttempt | null>(
    null,
  );

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "onboarding-attempts", "list", page, q, stage, onlyToCall],
    queryFn: () =>
      listOnboardingAttempts({
        page,
        limit: PAGE_SIZE,
        q: q || undefined,
        incomplete: stage === "INCOMPLETE",
        stage: stage === "INCOMPLETE" || stage === "ALL" ? undefined : [stage],
        contacted: onlyToCall ? false : undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Card className="shadow-soft">
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher un nom, un téléphone…"
            className="h-9 max-w-xs"
          />
          <div className="flex flex-wrap gap-1">
            {STAGE_FILTERS.map((f) => (
              <Button
                key={f.value}
                size="sm"
                variant={stage === f.value ? "secondary" : "ghost"}
                onClick={() => {
                  setStage(f.value);
                  setPage(1);
                }}
              >
                {f.label}
              </Button>
            ))}
          </div>
          <Button
            size="sm"
            variant={onlyToCall ? "secondary" : "outline"}
            onClick={() => {
              setOnlyToCall((v) => !v);
              setPage(1);
            }}
          >
            Pas encore contactées
          </Button>
          <span className="text-muted-foreground ml-auto text-sm tabular-nums">
            {total} inscription{total > 1 ? "s" : ""}
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Personne</TableHead>
              <TableHead className="w-[110px]">Type</TableHead>
              <TableHead className="w-[160px]">Arrêtée à</TableHead>
              <TableHead className="w-[90px] text-right">Codes</TableHead>
              <TableHead className="w-[170px]">Dernière activité</TableHead>
              <TableHead className="w-[240px]">Suivi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && rows.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-10 text-center"
                >
                  Aucune inscription pour ces critères.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>
                        {[row.firstName, row.lastName].filter(Boolean).join(" ") || (
                          <span className="text-muted-foreground italic">
                            Nom inconnu
                          </span>
                        )}
                      </span>
                      <a
                        href={whatsAppLink(row.phone)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
                      >
                        <IconBrandWhatsapp className="size-3.5" />
                        {row.phone}
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.profileType ? (
                      <Badge variant="secondary">
                        {row.profileType === "WORKER" ? "Travailleur" : "Employeur"}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={stageVariant(row.stage)}>
                      {STAGE_LABELS[row.stage]}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className="text-right tabular-nums"
                    // Several codes and no verification: the code is probably
                    // not reaching them — worth saying on the call.
                    title={
                      row.codeSends > 1 && row.stage === "CODE_SENT"
                        ? "Plusieurs codes demandés sans succès : le code n'arrive peut-être pas."
                        : undefined
                    }
                  >
                    {row.codeSends}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(row.lastActivityAt)}
                  </TableCell>
                  <TableCell>
                    {row.contactedAt ? (
                      <div className="flex flex-col gap-0.5 text-sm">
                        <span className="inline-flex items-center gap-1">
                          <IconPhoneCheck className="size-4 text-emerald-600" />
                          {formatDate(row.contactedAt)}
                        </span>
                        {row.contactedBy && (
                          <span className="text-muted-foreground text-xs">
                            par {row.contactedBy}
                          </span>
                        )}
                        {row.contactNote && (
                          <span className="text-muted-foreground line-clamp-2 text-xs">
                            « {row.contactNote} »
                          </span>
                        )}
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground self-start text-xs underline"
                          onClick={() => setContacting(row)}
                        >
                          Modifier
                        </button>
                      </div>
                    ) : row.stage === "COMPLETED" ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setContacting(row)}
                      >
                        Marquer contactée
                      </Button>
                    )}
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
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
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

      <ContactDialog attempt={contacting} onClose={() => setContacting(null)} />
    </Card>
  );
}

function ContactDialog({
  attempt,
  onClose,
}: {
  attempt: AdminOnboardingAttempt | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [forId, setForId] = useState<string | null>(null);
  // Start from the saved note each time a different row is opened.
  if (attempt && attempt.id !== forId) {
    setForId(attempt.id);
    setNote(attempt.contactNote ?? "");
  }

  const save = useMutation({
    mutationFn: () => markOnboardingContacted(attempt!.id, note),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["admin", "onboarding-attempts"],
      });
      toast.success("Suivi enregistré");
      onClose();
    },
    onError: () => toast.error("Impossible d'enregistrer le suivi"),
  });

  const name = attempt
    ? [attempt.firstName, attempt.lastName].filter(Boolean).join(" ") ||
      attempt.phone
    : "";

  return (
    <Dialog open={attempt !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact avec {name}</DialogTitle>
          <DialogDescription>
            Arrêtée à « {attempt ? STAGE_LABELS[attempt.stage] : ""} ». Notez
            pourquoi la personne n'a pas terminé et ce qui l'aiderait.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 1000))}
          placeholder="Ex : le code WhatsApp n'arrivait pas ; n'avait pas sa pièce d'identité sur elle…"
          rows={5}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
