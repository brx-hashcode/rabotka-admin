import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconBrain, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "#/components/ui/button";
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
import {
  eraseProfileVovaMemory,
  getProfileVovaMemory,
} from "#/lib/api/profiles-controller";
import { useRole } from "#/hooks/use-role";

type Props = { profileId: string; profileName: string };

function formatDate(v: string | null) {
  if (!v) return null;
  try {
    return new Date(v).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return null;
  }
}

/**
 * What VoVa carries about this person between conversations.
 *
 * It sits beside the transcript because that is what it is made of, and
 * because the two are read together: a strange answer in the conversation is
 * usually explained by a line in this list.
 *
 * Shown even when empty. A moderator handling « the bot said something odd
 * about me » needs to be able to tell "nothing is stored" apart from "I could
 * not find where to look" — an absent card answers neither.
 */
export function ProfileVovaMemory({ profileId, profileName }: Props) {
  const queryClient = useQueryClient();
  const { canManageContent } = useRole();
  const [confirming, setConfirming] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["profile-vova-memory", profileId],
    queryFn: () => getProfileVovaMemory(profileId),
  });

  const erase = useMutation({
    mutationFn: () => eraseProfileVovaMemory(profileId),
    onSuccess: async () => {
      setConfirming(false);
      await queryClient.invalidateQueries({
        queryKey: ["profile-vova-memory", profileId],
      });
      toast.success("Memory erased");
    },
    onError: () => toast.error("Could not erase the memory"),
  });

  const facts = data?.facts ?? [];
  const updatedAt = formatDate(data?.updatedAt ?? null);

  return (
    <section className="bg-card shadow-soft flex flex-col gap-3 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconBrain className="text-muted-foreground size-4" />
          <div>
            <h3 className="text-sm font-medium">VoVa memory</h3>
            <p className="text-muted-foreground text-xs">
              What the assistant keeps from one conversation to the next, and
              recalls in each of its answers.
            </p>
          </div>
        </div>

        {canManageContent && facts.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive shrink-0"
            onClick={() => setConfirming(true)}
          >
            <IconTrash className="size-4" />
            Erase
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : facts.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nothing kept yet. That is the most common case: the list builds up
          after a few exchanges with the assistant.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-1.5">
            {facts.map((fact) => (
              <li key={fact.text} className="text-sm">
                <span className="text-muted-foreground mr-2">•</span>
                {fact.text}
              </li>
            ))}
          </ul>
          {updatedAt && (
            <p className="text-muted-foreground text-xs">
              Updated {updatedAt}
            </p>
          )}
        </>
      )}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Erase {profileName}&apos;s memory?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The assistant will forget {facts.length === 1 ? "this fact" : `these ${facts.length} facts`}. This
              is not a permanent block: the list builds up again from later
              conversations. The action is recorded in the profile&apos;s log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // The dialog closes on its own action click, which would unmount
                // the row before the request resolves and swallow the error
                // toast. Closing on success instead keeps the failure visible.
                e.preventDefault();
                erase.mutate();
              }}
              disabled={erase.isPending}
            >
              {erase.isPending ? "Erasing…" : "Erase"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
