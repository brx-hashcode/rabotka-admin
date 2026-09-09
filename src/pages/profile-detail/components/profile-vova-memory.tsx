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
      toast.success("Mémoire effacée");
    },
    onError: () => toast.error("Impossible d'effacer la mémoire"),
  });

  const facts = data?.facts ?? [];
  const updatedAt = formatDate(data?.updatedAt ?? null);

  return (
    <section className="bg-card shadow-soft flex flex-col gap-3 rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconBrain className="text-muted-foreground size-4" />
          <div>
            <h3 className="text-sm font-medium">Mémoire de VoVa</h3>
            <p className="text-muted-foreground text-xs">
              Ce que l'assistant retient d'une conversation à l'autre, et
              rappelle dans chacune de ses réponses.
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
            Effacer
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Chargement…</p>
      ) : facts.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Rien de retenu pour l'instant. C'est le cas le plus courant : la liste
          se construit après quelques échanges avec l'assistant.
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
              Mis à jour le {updatedAt}
            </p>
          )}
        </>
      )}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Effacer la mémoire de {profileName} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              L'assistant oubliera ces {facts.length} fait
              {facts.length > 1 ? "s" : ""}. Ce n'est pas un blocage
              définitif&nbsp;: la liste se reconstruira à partir des
              conversations suivantes. L'action est enregistrée dans le journal
              du profil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
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
              {erase.isPending ? "Effacement…" : "Effacer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
