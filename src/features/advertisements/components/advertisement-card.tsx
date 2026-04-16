import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import {
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Users,
  CalendarDays,
  Repeat2,
  Pencil,
  Trash2,
  Eye,
  ChartColumnIncreasing,
} from "lucide-react";
import {
  IconPhoto,
  IconCheck,
  IconX,
  IconPlayerPause,
  IconPlayerPlay,
  IconSend,
  IconBan,
  IconCreditCard,
} from "@tabler/icons-react";
import { Badge } from "#/components/ui/badge";
import { Button, buttonVariants } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "#/components/ui/alert-dialog";
import { Textarea } from "#/components/ui/textarea";
import type { Advertisement } from "#/lib/api/advertisements-controller";
import {
  confirmPaymentAdvertisement,
  submitAdvertisement,
  approveAdvertisement,
  rejectAdvertisement,
  pauseAdvertisement,
  resumeAdvertisement,
  cancelAdvertisement,
  deleteAdvertisement,
} from "#/lib/api/advertisements-controller";
import { getAdvertisementStatusLabel } from "#/lib/status-labels";
import { AdvertisementDialog } from "./advertisement-dialog";
import { AdvertisementPreviewDialog } from "./advertisement-preview-dialog";
import { AdvertisementStatsSheet } from "./advertisement-stats-sheet";

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "DRAFT":
      return "bg-zinc-500 text-white border-transparent";
    case "PENDING_REVIEW":
      return "bg-amber-500 text-white border-transparent";
    case "APPROVED":
      return "bg-blue-600 text-white border-transparent";
    case "ACTIVE":
      return "bg-emerald-500 text-white border-transparent";
    case "PAUSED":
      return "bg-orange-500 text-white border-transparent";
    case "COMPLETED":
      return "bg-violet-600 text-white border-transparent";
    case "REJECTED":
      return "bg-rose-500 text-white border-transparent";
    case "CANCELLED":
      return "bg-red-600 text-white border-transparent";
    default:
      return "bg-zinc-500 text-white border-transparent";
  }
}

function getChannelBadgeClass(channel: string): string {
  switch (channel) {
    case "EMAIL":
      return "bg-sky-500 text-white border-transparent";
    case "WHATSAPP":
      return "bg-green-600 text-white border-transparent";
    case "BOTH":
      return "bg-violet-500 text-white border-transparent";
    default:
      return "bg-zinc-500 text-white border-transparent";
  }
}

type Direction = 1 | -1;

const slideVariants = {
  enter: (d: Direction) => ({ x: d > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: Direction) => ({ x: d > 0 ? "-100%" : "100%", opacity: 0 }),
};

function ImageCarousel({ urls }: Readonly<{ urls: string[] }>) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<Direction>(1);

  if (urls.length === 0) {
    return (
      <div className="flex h-70 w-full items-center justify-center bg-muted">
        <IconPhoto className="size-10 text-muted-foreground" />
      </div>
    );
  }

  const go = (dir: Direction) => {
    setDirection(dir);
    setIndex((prev) => (prev + dir + urls.length) % urls.length);
  };

  return (
    <div className="relative h-70 w-full overflow-hidden bg-muted">
      <AnimatePresence custom={direction} initial={false}>
        <motion.img
          key={index}
          src={urls[index]}
          alt={`Ad image ${index + 1}`}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>

      {urls.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white hover:bg-black/60 transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1 text-white hover:bg-black/60 transition-colors"
          >
            <ChevronRight className="size-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {urls.map((_, i) => (
              <button
                key={`dot-${i + 1}`}
                type="button"
                onClick={() => {
                  setDirection(i > index ? 1 : -1);
                  setIndex(i);
                }}
                className={`size-1.5 rounded-full transition-colors ${
                  i === index ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

type Props = { advertisement: Advertisement };

export function AdvertisementCard({ advertisement: ad }: Readonly<Props>) {
  const queryClient = useQueryClient();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmPaymentOpen, setConfirmPaymentOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [pauseOpen, setPauseOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "advertisements"] });

  const useActionMutation = <T,>(
    fn: () => Promise<T>,
    successMsg: string,
    onDone?: () => void,
  ) =>
    useMutation({
      mutationFn: fn,
      onSuccess: () => {
        toast.success(successMsg);
        onDone?.();
        invalidate();
      },
      onError: (e: Error) => toast.error(e.message),
    });

  const confirmPaymentMut = useActionMutation(
    () => confirmPaymentAdvertisement(ad.id),
    "Payment confirmed",
    () => setConfirmPaymentOpen(false),
  );
  const submitMut = useActionMutation(
    () => submitAdvertisement(ad.id),
    "Submitted for review",
    () => setSubmitOpen(false),
  );
  const approveMut = useActionMutation(
    () => approveAdvertisement(ad.id),
    "Advertisement approved",
    () => setApproveOpen(false),
  );
  const rejectMut = useMutation({
    mutationFn: () => rejectAdvertisement(ad.id, rejectReason),
    onSuccess: () => {
      toast.success("Advertisement rejected");
      setRejectOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const pauseMut = useActionMutation(
    () => pauseAdvertisement(ad.id),
    "Advertisement paused",
    () => setPauseOpen(false),
  );
  const resumeMut = useActionMutation(
    () => resumeAdvertisement(ad.id),
    "Advertisement resumed",
    () => setResumeOpen(false),
  );
  const cancelMut = useMutation({
    mutationFn: () => cancelAdvertisement(ad.id),
    onSuccess: () => {
      toast.success("Advertisement cancelled");
      setCancelOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: () => deleteAdvertisement(ad.id),
    onSuccess: () => {
      toast.success("Advertisement deleted");
      setDeleteOpen(false);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const s = ad.status;
  const canConfirmPayment = s === "DRAFT" && ad.payment_status === "UNPAID";
  const canEdit = s === "DRAFT" || s === "PAUSED";
  const canSubmit = s === "DRAFT" && ad.payment_status === "PAID";
  const canApprove = s === "PENDING_REVIEW";
  const canReject = s === "PENDING_REVIEW";
  const canPause = s === "ACTIVE";
  const canResume = s === "PAUSED";
  const canCancel = s !== "COMPLETED" && s !== "CANCELLED" && s !== "REJECTED";
  // const isReadOnly = s === "COMPLETED" || s === "CANCELLED" || s === "REJECTED";

  const canDelete =
    s === "DRAFT" ||
    s === "PAUSED" ||
    s === "PENDING_REVIEW" ||
    s === "APPROVED";

  const showSeparatorBeforeDanger = canCancel || canDelete;

  const formatDate = (d: string) => {
    try {
      return format(new Date(d), "dd/MM/yyyy");
    } catch {
      return "—";
    }
  };

  return (
    <>
      <div className="relative flex flex-col rounded-lg border bg-card overflow-hidden">
        <div className="relative">
          <ImageCarousel urls={ad.image_urls ?? []} />

          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
            <Badge
              className={`text-[10px] py-0.5 px-2 backdrop-blur-sm ${getStatusBadgeClass(s)}`}
            >
              {getAdvertisementStatusLabel(s)}
            </Badge>
            {ad.bundle?.allowed_channels.map((ch) => (
              <Badge
                key={ch}
                className={`text-[10px] py-0.5 px-2 backdrop-blur-sm ${getChannelBadgeClass(ch)}`}
              >
                {ch}
              </Badge>
            ))}
            {ad.payment_status === "UNPAID" && (
              <Badge className="text-[10px] py-0.5 px-2 backdrop-blur-sm bg-yellow-500 text-white border-transparent">
                Unpaid
              </Badge>
            )}
          </div>

          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm"
                >
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setPreviewOpen(true)}>
                  <Eye className="size-4" />
                  View as
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatsOpen(true)}>
                  <ChartColumnIncreasing className="size-4" />
                  Stats
                </DropdownMenuItem>
                {canEdit && (
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Pencil className="size-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canConfirmPayment && (
                  <DropdownMenuItem onClick={() => setConfirmPaymentOpen(true)}>
                    <IconCreditCard className="size-4" />
                    Confirm Payment
                  </DropdownMenuItem>
                )}
                {canSubmit && (
                  <DropdownMenuItem onClick={() => setSubmitOpen(true)}>
                    <IconSend className="size-4" />
                    Submit for Review
                  </DropdownMenuItem>
                )}
                {canApprove && (
                  <DropdownMenuItem onClick={() => setApproveOpen(true)}>
                    <IconCheck className="size-4" />
                    Approve
                  </DropdownMenuItem>
                )}
                {canReject && (
                  <DropdownMenuItem onClick={() => setRejectOpen(true)}>
                    <IconX className="size-4" />
                    Reject
                  </DropdownMenuItem>
                )}
                {canPause && (
                  <DropdownMenuItem onClick={() => setPauseOpen(true)}>
                    <IconPlayerPause className="size-4" />
                    Pause
                  </DropdownMenuItem>
                )}
                {canResume && (
                  <DropdownMenuItem onClick={() => setResumeOpen(true)}>
                    <IconPlayerPlay className="size-4" />
                    Resume
                  </DropdownMenuItem>
                )}
                {showSeparatorBeforeDanger ? <DropdownMenuSeparator /> : null}
                {canCancel && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={() => setCancelOpen(true)}
                  >
                    <IconBan className="size-4" />
                    Cancel
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex-1 flex flex-col p-5 gap-3">
          <h3 className="font-bold text-xl leading-snug line-clamp-2">
            {ad.title}
          </h3>

          {ad.description && (
            <p className="text-sm text-muted-foreground line-clamp-6">
              {ad.description}
            </p>
          )}

          <div className="border-t mt-1" />

          <div className="flex flex-col gap-2 text-xs">
            {ad.bundle && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="size-3.5 shrink-0" />
                <span>
                  Up to{" "}
                  <span className="font-medium text-foreground">
                    {ad.bundle.max_reach.toLocaleString()}
                  </span>{" "}
                  recipients
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="size-3.5 shrink-0" />
              <span>
                {formatDate(ad.start_date)} → {formatDate(ad.end_date)}
              </span>
            </div>
            {ad.bundle && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Repeat2 className="size-3.5 shrink-0" />
                <span>
                  <span className="font-medium text-foreground">
                    {ad.bundle.max_frequency_per_week}×
                  </span>{" "}
                  per week
                </span>
              </div>
            )}
          </div>

          {ad.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap mt-1">
              {ad.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-[10px] py-0 px-1.5 bg-emerald-100 text-emerald-700 border-emerald-200"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t bg-muted/30 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground truncate">
            {ad.bundle?.name ?? "—"}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatDate(ad.created_at)}
          </span>
        </div>
      </div>

      <AdvertisementStatsSheet
        open={statsOpen}
        onOpenChange={setStatsOpen}
        advertisement={ad}
      />

      <AlertDialog
        open={confirmPaymentOpen}
        onOpenChange={setConfirmPaymentOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm payment?</AlertDialogTitle>
            <AlertDialogDescription>
              Mark &ldquo;{ad.title}&rdquo; as paid. The advertiser will then be
              able to submit it for review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmPaymentMut.mutate()}
              disabled={confirmPaymentMut.isPending}
            >
              {confirmPaymentMut.isPending ? "Confirming…" : "Confirm Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit for review?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{ad.title}&rdquo; will be sent to the moderation queue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => submitMut.mutate()}
              disabled={submitMut.isPending}
            >
              {submitMut.isPending ? "Submitting…" : "Submit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Approve */}
      <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve advertisement?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{ad.title}&rdquo; will be approved and scheduled for
              delivery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => approveMut.mutate()}
              disabled={approveMut.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
            >
              {approveMut.isPending ? "Approving…" : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject advertisement?</AlertDialogTitle>
            <AlertDialogDescription>
              Provide a reason so the advertiser knows what to fix.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Rejection reason…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => rejectMut.mutate()}
              disabled={!rejectReason.trim() || rejectMut.isPending}
            >
              {rejectMut.isPending ? "Rejecting…" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pauseOpen} onOpenChange={setPauseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pause advertisement?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{ad.title}&rdquo; will be paused and stop delivering until
              resumed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pauseMut.mutate()}
              disabled={pauseMut.isPending}
            >
              {pauseMut.isPending ? "Pausing…" : "Pause"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resumeOpen} onOpenChange={setResumeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resume advertisement?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{ad.title}&rdquo; will resume delivery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resumeMut.mutate()}
              disabled={resumeMut.isPending}
            >
              {resumeMut.isPending ? "Resuming…" : "Resume"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel advertisement?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{ad.title}&rdquo; will be cancelled and can no longer be
              activated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelMut.mutate()}
              disabled={cancelMut.isPending}
              className={buttonVariants({ variant: "destructive" })}
            >
              {cancelMut.isPending ? "Cancelling…" : "Cancel Ad"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete advertisement?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{ad.title}&rdquo; will be permanently deleted. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMut.mutate()}
              disabled={deleteMut.isPending}
              className={buttonVariants({ variant: "destructive" })}
            >
              {deleteMut.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AdvertisementDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        advertisement={ad}
      />

      <AdvertisementPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        advertisement={ad}
      />
    </>
  );
}
