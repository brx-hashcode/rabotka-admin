import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "#/components/ui/card";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import { listFeedback } from "#/lib/api/feedback-controller";

const PAGE_SIZE = 20;
const SCORES = [5, 4, 3, 2, 1] as const;

/** Filled stars up to the score, hollow after — readable without colour. */
function Stars({ score }: { score: number }) {
  return (
    <span className="tabular-nums" title={`${score} sur 5`}>
      <span aria-hidden>
        {"★".repeat(score)}
        <span className="text-muted-foreground/40">{"★".repeat(5 - score)}</span>
      </span>
      <span className="sr-only">{score} sur 5</span>
    </span>
  );
}

export function FeedbackTable() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [score, setScore] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "feedback", "list", page, q, score],
    queryFn: () =>
      listFeedback({
        page,
        limit: PAGE_SIZE,
        q: q || undefined,
        score: score ?? undefined,
      }),
    // Without this the table blanks on every keystroke and page change.
    placeholderData: keepPreviousData,
  });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const setFilter = (next: number | null) => {
    setScore(next);
    setPage(1);
  };

  return (
    <Card className="shadow-soft">
      <CardContent className="flex flex-col gap-4">
        {/* Filters in one row above the table. */}
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Rechercher un commentaire, un nom, un téléphone…"
            className="h-9 max-w-xs"
          />
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={score === null ? "secondary" : "ghost"}
              onClick={() => setFilter(null)}
            >
              Toutes
            </Button>
            {SCORES.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={score === s ? "secondary" : "ghost"}
                onClick={() => setFilter(score === s ? null : s)}
              >
                {s}★
              </Button>
            ))}
          </div>
          <span className="text-muted-foreground ml-auto text-sm tabular-nums">
            {total} avis
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Note</TableHead>
              <TableHead>Commentaire</TableHead>
              <TableHead className="w-[200px]">Auteur</TableHead>
              <TableHead className="w-[110px]">Type</TableHead>
              <TableHead className="w-[150px]">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && rows.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-10 text-center"
                >
                  Aucun avis pour ces critères.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Stars score={row.score} />
                  </TableCell>
                  <TableCell className="max-w-md">
                    {row.comment ? (
                      <span className="whitespace-pre-wrap">{row.comment}</span>
                    ) : (
                      <span className="text-muted-foreground italic">
                        Sans commentaire
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.profile ? (
                      <div className="flex flex-col">
                        <span>
                          {row.profile.firstName} {row.profile.lastName}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {row.profile.phone}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.profile ? (
                      <Badge variant="secondary">
                        {row.profile.profileType === "WORKER"
                          ? "Travailleur"
                          : "Employeur"}
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(row.createdAt).toLocaleString("fr", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
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
    </Card>
  );
}
