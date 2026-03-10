import { useQuery } from "@tanstack/react-query";
import { IconMessageCircle } from "@tabler/icons-react";
import { cn } from "#/lib/utils";
import { Card, CardContent } from "#/components/ui/card";
import {
  getProfileMessages,
  type AdminProfileMessage,
} from "#/lib/api/profiles-controller";

type Props = {
  profileId: string;
  profileName: string;
};

function formatTime(v: string) {
  try {
    return new Date(v).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return v;
  }
}

export function ProfileMessagesContent({ profileId, profileName }: Readonly<Props>) {
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["admin", "profiles", profileId, "messages"],
    queryFn: () => getProfileMessages(profileId),
  });

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
        Loading messages...
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <Card className="py-12">
        <CardContent className="flex flex-col items-center justify-center text-center">
          <IconMessageCircle className="text-muted-foreground mb-2 size-10" />
          <p className="text-muted-foreground text-sm">No messages yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3 max-w-2xl">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} profileName={profileName} />
      ))}
    </div>
  );
}

function MessageBubble({
  message,
  profileName,
}: {
  message: AdminProfileMessage;
  profileName: string;
}) {
  const isOutbound = message.direction === "OUTBOUND";

  return (
    <div
      className={cn("flex flex-col gap-1", isOutbound ? "items-end" : "items-start")}
    >
      <span className="text-xs text-muted-foreground px-1">
        {isOutbound ? "System" : profileName}
      </span>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
          isOutbound
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted text-foreground rounded-tl-sm",
        )}
      >
        {message.body}
      </div>
      <span className="text-[11px] text-muted-foreground px-1">
        {formatTime(message.createdAt)}
      </span>
    </div>
  );
}
