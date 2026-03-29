import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  IconMail,
  IconPhone,
  IconExternalLink,
  IconBriefcase,
  IconFileText,
  IconUser,
  IconCreditCard,
  IconTrash,
} from "@tabler/icons-react";

import type { AdminPenaltyDetailResponse } from "#/lib/api/penalties-controller";
import {
  confirmPenaltyPayment,
  deletePenalty,
} from "#/lib/api/penalties-controller";

import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Badge } from "#/components/ui/badge";
import { Button, buttonVariants } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Separator } from "#/components/ui/separator";
import { ConfirmDialog } from "#/features/team/components/confirm-dialog";

import { formatDate, formatAmount } from "../helpers";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (
    ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase().slice(0, 2) ||
    "?"
  );
}

type Props = {
  penalty: AdminPenaltyDetailResponse;
};

export function PenaltySummary({ penalty }: Readonly<Props>) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isPaid = penalty.paidAt != null;

  const [confirmPaymentOpen, setConfirmPaymentOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "penalties"] });
  };

  const confirmPaymentMutation = useMutation({
    mutationFn: () => confirmPenaltyPayment(penalty.id),
    onSuccess: () => {
      setConfirmPaymentOpen(false);
      toast.success("Payment confirmed — penalty marked as paid.");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePenalty(penalty.id),
    onSuccess: () => {
      setDeleteOpen(false);
      toast.success("Penalty deleted.");
      invalidate();
      navigate({ to: "/penalties" });
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      {/* Status cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Payment
            </p>
            <Badge
              variant={isPaid ? "default" : "destructive"}
              className="mt-1"
            >
              {isPaid ? "Paid" : "Unpaid"}
            </Badge>
          </CardContent>
        </Card>

        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Amount
            </p>
            <p className="mt-1 text-sm font-medium">
              {formatAmount(penalty.amount)}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Applied
            </p>
            <p className="mt-1 text-sm font-medium">
              {formatDate(penalty.appliedAt)}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-2 py-4">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Paid At
            </p>
            <p className="mt-1 text-sm font-medium">
              {formatDate(penalty.paidAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            className="w-full"
            disabled={isPaid}
            onClick={() => setConfirmPaymentOpen(true)}
          >
            <IconCreditCard className="size-3.5" />
            Confirm payment
          </Button>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setDeleteOpen(true)}
          >
            <IconTrash className="size-3.5" />
            Delete penalty
          </Button>
        </CardContent>
      </Card>

      {/* Worker card */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm">Worker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              {penalty.workerAvatarUrl ? (
                <AvatarImage
                  src={penalty.workerAvatarUrl}
                  alt={penalty.workerName}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                {getInitials(penalty.workerName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {penalty.workerName || "—"}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {penalty.workerEmail || "—"}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <IconMail className="text-muted-foreground size-4 shrink-0" />
              <span className="truncate text-sm">
                {penalty.workerEmail || "—"}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <IconPhone className="text-muted-foreground size-4 shrink-0" />
              <span className="text-sm">{penalty.workerPhone || "—"}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <IconUser className="text-muted-foreground size-4 shrink-0" />
              <span className="text-muted-foreground text-xs">
                Worker account
              </span>
            </div>
          </div>

          <Link
            to="/profiles/$profileId"
            params={{ profileId: penalty.workerId }}
            className={buttonVariants({
              variant: "outline",
              className: "w-full",
            })}
          >
            <IconExternalLink className="size-3.5" />
            View Profile
          </Link>
        </CardContent>
      </Card>

      {/* Quick links */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm">Related</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link
            to="/jobs/$jobId"
            params={{ jobId: penalty.jobOfferId }}
            className={buttonVariants({
              variant: "outline",
              className: "w-full",
            })}
          >
            <IconBriefcase className="size-3.5" />
            View Job
          </Link>
          <Link
            to="/applications/$applicationId"
            params={{ applicationId: penalty.applicationId }}
            className={buttonVariants({
              variant: "outline",
              className: "w-full",
            })}
          >
            <IconFileText className="size-3.5" />
            View Application
          </Link>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmPaymentOpen}
        onOpenChange={setConfirmPaymentOpen}
        title="Confirm penalty payment"
        description="This will mark the penalty as paid and credit the system wallet. This action cannot be undone."
        actionLabel="Confirm payment"
        onConfirm={() => confirmPaymentMutation.mutate()}
        isPending={confirmPaymentMutation.isPending}
        variant="default"
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete penalty"
        description="This will permanently delete this penalty. The worker's billing status will be updated automatically."
        actionLabel="Delete"
        onConfirm={() => deleteMutation.mutate()}
        isPending={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
