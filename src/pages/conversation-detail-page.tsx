import { Link } from "@tanstack/react-router";

import { Badge } from "#/components/ui/badge";
import { Card, CardContent } from "#/components/ui/card";
import { Skeleton } from "#/components/ui/skeleton";
import { canReadConversationBody } from "#/features/conversations/access";
import { ConversationThread } from "#/features/conversations/components/conversation-thread";
import { LockConversationDialog } from "#/features/conversations/components/lock-conversation-dialog";
import { ThreadLockedCard } from "#/features/conversations/components/thread-locked-card";
import { useConversationDetail } from "#/hooks/use-conversation-detail";
import { useRole } from "#/hooks/use-role";
import type {
  AdminConversationDetail,
  ConversationParty,
  RedactionCategory,
} from "#/lib/api/conversations-controller";

const CATEGORY_LABELS: Record<RedactionCategory, string> = {
  PHONE: "Phone",
  EMAIL: "Email",
  MESSAGING_HANDLE: "Messaging handle",
  URL: "Link",
  OBFUSCATED_DIGITS: "Spelled-out digits",
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(value);
  }
}

function Field({
  label,
  value,
}: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground text-xs tracking-wide uppercase">
        {label}
      </p>
      <div className="text-sm font-medium wrap-break-word">{value}</div>
    </div>
  );
}

function PartyCard({
  role,
  party,
}: Readonly<{ role: string; party: ConversationParty }>) {
  return (
    <Card>
      <CardContent className="space-y-4 px-6 py-5">
        <Field
          label={role}
          value={
            <Link
              to="/profiles/$profileId"
              params={{ profileId: party.id }}
              className="hover:underline"
            >
              {party.name}
            </Link>
          }
        />
        <Field label="Phone" value={party.phone} />
        <Field label="Last read" value={formatDateTime(party.lastReadAt)} />
        {/* Clearing deletes nothing — the other side keeps every message. It is
            here because it answers "they swear they never saw it". */}
        <Field
          label="Cleared their copy"
          value={
            party.hiddenAt ? (
              <span>{formatDateTime(party.hiddenAt)}</span>
            ) : (
              <span className="text-muted-foreground">Never</span>
            )
          }
        />
      </CardContent>
    </Card>
  );
}

function ModerationCard({
  conversation,
}: Readonly<{ conversation: AdminConversationDetail }>) {
  const categories = (
    Object.keys(CATEGORY_LABELS) as RedactionCategory[]
  ).filter((category) => conversation.redactionsByCategory[category] > 0);

  return (
    <Card>
      <CardContent className="space-y-5 px-6 py-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Messages" value={conversation.messageCount} />
          <Field label="Clean" value={conversation.cleanCount} />
          <Field
            label="Redacted"
            value={
              conversation.redactedCount > 0 ? (
                <span className="text-amber-600 dark:text-amber-500">
                  {conversation.redactedCount}
                </span>
              ) : (
                0
              )
            }
          />
          {/* Held is the one that means "never reached anybody" — a message that
              was mostly contact details. It is the strongest signal on the page. */}
          <Field
            label="Held"
            value={
              conversation.heldCount > 0 ? (
                <span className="text-destructive">
                  {conversation.heldCount}
                </span>
              ) : (
                0
              )
            }
          />
        </div>

        <div>
          <p className="text-muted-foreground mb-2 text-xs tracking-wide uppercase">
            Withheld by category
          </p>
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nothing has been withheld in this conversation.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge key={category} variant="secondary">
                  {CATEGORY_LABELS[category]}{" "}
                  <span className="ml-1 tabular-nums">
                    {conversation.redactionsByCategory[category]}
                  </span>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {conversation.pendingReportCount > 0 && (
          <p className="text-sm">
            <span className="font-medium text-amber-600 dark:text-amber-500">
              {conversation.pendingReportCount}
            </span>{" "}
            message
            {conversation.pendingReportCount > 1 ? "s" : ""} whose author says
            the detection was wrong, still unreviewed.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function ConversationDetailPage({
  conversationId,
}: Readonly<{ conversationId: string }>) {
  const { conversation, isLoading, isError, close, reopen, isLocking } =
    useConversationDetail(conversationId);
  const { role, canManageContent } = useRole();
  const canReadBodies = canReadConversationBody(role);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !conversation) {
    return (
      <p className="text-muted-foreground py-16 text-center">
        Failed to load this conversation.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 px-6 py-5">
        {/* Locking sits on the DETAIL page, never in a list row action: a
            MODERATOR triaging the list is the one role that cannot read the
            thread, and a control that acts on evidence you may not look at is
            not a moderation control. `canManageContent` hides it from them and
            from lateral roles at once, matching the endpoint's @Roles(MANAGER). */}
        {canManageContent && conversation && (
          <div className="flex justify-end">
            <LockConversationDialog
              isClosed={Boolean(conversation.closedAt)}
              workerName={conversation.worker.name}
              employerName={conversation.employer.name}
              onConfirm={() =>
                conversation.closedAt ? reopen() : close()
              }
              disabled={isLocking}
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field
            label="Status"
            value={
              conversation.closedAt ? (
                <Badge variant="secondary">Closed</Badge>
              ) : (
                <Badge className="border-transparent bg-emerald-600 text-white">
                  Open
                </Badge>
              )
            }
          />
          <Field
            label="Context"
            value={
              conversation.jobTitle ?? (
                <Badge className="border-transparent bg-violet-600 text-white">
                  Direct
                </Badge>
              )
            }
          />
          <Field label="Opened" value={formatDateTime(conversation.createdAt)} />
          {/* Null here is not missing data: every message was held, so nothing
              was ever delivered to move this on. */}
          <Field
            label="Last activity"
            value={
              conversation.lastMessageAt ? (
                formatDateTime(conversation.lastMessageAt)
              ) : (
                <span className="text-muted-foreground">Nothing delivered</span>
              )
            }
          />
        </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <PartyCard role="Worker" party={conversation.worker} />
        <PartyCard role="Employer" party={conversation.employer} />
      </div>

      <ModerationCard conversation={conversation} />

      {/* The thread. A MODERATOR gets the locked card instead — and the hook is
          disabled for them, so no request is fired and no audit row is written
          for a read that did not happen. */}
      {canReadBodies ? (
        <ConversationThread conversationId={conversationId} enabled />
      ) : (
        <ThreadLockedCard />
      )}
    </div>
  );
}
