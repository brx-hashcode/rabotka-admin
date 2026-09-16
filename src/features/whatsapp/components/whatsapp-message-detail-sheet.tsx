import { format } from "date-fns";
import { Link } from "@tanstack/react-router";
import type { WhatsappMessageItem } from "#/lib/api/whatsapp-controller";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "#/components/ui/sheet";
import {
  WhatsappCategoryBadge,
  WhatsappStatusBadge,
} from "./whatsapp-status-badge";
import { TechnicalDetails } from "#/components/technical-details";
import {
  messageKindLabel,
  sendErrorLabel,
  templateLabel,
  whatsappServiceLabel,
} from "../labels";

type WhatsappMessageDetailSheetProps = {
  message: WhatsappMessageItem | null;
  onClose: () => void;
};

function Field({
  label,
  value,
}: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div className="space-y-0.5">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      <div className="text-sm break-all">{value ?? "—"}</div>
    </div>
  );
}

/**
 * How long each step took, relative to the previous one.
 *
 * The absolute timestamps alone do not answer the question people actually
 * bring to this screen — "is delivery slow?" — because working out that
 * 10:14:03 is four minutes after 10:10:01 is work the reader should not have
 * to do while looking at forty of them.
 */
function relative(from: string | null, to: string | null): string | null {
  if (!from || !to) return null;
  const seconds = Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / 1000,
  );
  if (seconds < 0) return null;
  if (seconds < 60) return `+${seconds}s`;
  if (seconds < 3600) return `+${Math.round(seconds / 60)}m`;
  return `+${Math.round(seconds / 3600)}h`;
}

type Step = {
  label: string;
  at: string | null;
  from: string | null;
  tone: string;
};

function TimelineStep({ step }: Readonly<{ step: Step }>) {
  const delta = relative(step.from, step.at);
  return (
    <div className="flex items-center gap-3">
      <span
        className={`size-2 shrink-0 rounded-full ${
          step.at ? step.tone : "bg-muted-foreground/30"
        }`}
        aria-hidden
      />
      <span
        className={`w-24 text-sm ${step.at ? "" : "text-muted-foreground"}`}
      >
        {step.label}
      </span>
      {step.at ? (
        <>
          <span className="text-muted-foreground text-xs">
            {format(new Date(step.at), "MMM d, HH:mm:ss")}
          </span>
          {delta ? (
            <span className="text-muted-foreground/70 text-xs">{delta}</span>
          ) : null}
        </>
      ) : (
        <span className="text-muted-foreground/60 text-xs italic">
          not reached
        </span>
      )}
    </div>
  );
}

export function WhatsappMessageDetailSheet({
  message,
  onClose,
}: Readonly<WhatsappMessageDetailSheetProps>) {
  const steps: Step[] = message
    ? [
        {
          label: "Prepared",
          at: message.createdAt,
          from: null,
          tone: "bg-muted-foreground",
        },
        {
          label: "Sent",
          at: message.sentAt,
          from: message.createdAt,
          tone: "bg-blue-500",
        },
        {
          label: "Delivered",
          at: message.deliveredAt,
          from: message.sentAt,
          tone: "bg-emerald-500",
        },
        {
          label: "Read",
          at: message.readAt,
          from: message.deliveredAt,
          tone: "bg-violet-600",
        },
        ...(message.failedAt
          ? [
              {
                label: "Failed",
                at: message.failedAt,
                from: message.sentAt ?? message.createdAt,
                tone: "bg-rose-600",
              },
            ]
          : []),
      ]
    : [];

  return (
    <Sheet
      open={Boolean(message)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="flex w-full flex-col p-0 sm:max-w-lg">
        <div className="shrink-0 pb-4">
          <SheetHeader>
            <SheetTitle className="flex flex-wrap items-center gap-2">
              {message ? <WhatsappStatusBadge status={message.status} /> : null}
              <span className="font-mono text-sm font-normal">
                {message?.toPhone}
              </span>
            </SheetTitle>
            <SheetDescription>
              When the message was sent, delivered and read, and what it said
            </SheetDescription>
          </SheetHeader>
        </div>

        {message && (
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
            <div className="bg-card shadow-soft space-y-2 rounded-md p-4">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Delivery
              </p>
              {steps.map((step) => (
                <TimelineStep key={step.label} step={step} />
              ))}
            </div>

            {message.errorCode ? (
              <div className="bg-card shadow-soft space-y-1 rounded-md p-4">
                <p className="text-xs font-medium tracking-wide text-rose-600 uppercase">
                  Why it wasn't delivered
                </p>
                <p className="text-sm">{sendErrorLabel(message.errorCode)}</p>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Field label="Recipient" value={message.toPhone} />
              {/* Linked when we know who it is. The question this panel raises
                  most often is "who is this and what else happened to them",
                  and the answer is one page away — but only if the id resolved:
                  a message to a number with no profile has nowhere to go. */}
              <Field
                label="Profile"
                value={
                  message.profileId && message.profileName ? (
                    <Link
                      to="/profiles/$profileId"
                      params={{ profileId: message.profileId }}
                      className="hover:underline"
                    >
                      {message.profileName}
                    </Link>
                  ) : (
                    (message.profileName ?? "—")
                  )
                }
              />
              <Field label="Type" value={messageKindLabel(message.kind)} />
              <Field
                label="Approved message"
                value={message.templateKey ? templateLabel(message.templateKey) : "—"}
              />
              <Field
                label="Category"
                value={
                  <WhatsappCategoryBadge
                    category={
                      message.pricingCategory ?? message.templateCategory
                    }
                  />
                }
              />
              <Field
                label="Paid message"
                value={
                  message.billable === null
                    ? "—"
                    : message.billable
                      ? "Yes"
                      : "No (free)"
                }
              />
              <Field
                label="Sent through"
                value={whatsappServiceLabel(message.provider)}
              />
              <Field label="Sent by" value={message.sentByName ?? "System"} />
            </div>

            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                Content
              </p>
              <p className="bg-muted rounded-md p-3 text-sm leading-relaxed whitespace-pre-wrap">
                {message.bodyPreview}
              </p>
            </div>

            <TechnicalDetails
              rows={[
                { label: "WhatsApp reference", value: message.providerMessageId },
                { label: "Message template key", value: message.templateKey },
                { label: "Error code", value: message.errorCode },
                { label: "WhatsApp error code", value: message.errorProviderCode },
                { label: "WhatsApp error text", value: message.errorMessage },
              ]}
            >
              {message.variables ? (
                <pre className="bg-background overflow-x-auto rounded-md p-3 text-xs leading-relaxed">
                  {JSON.stringify(message.variables, null, 2)}
                </pre>
              ) : null}
            </TechnicalDetails>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
