import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";

import { ReasonField } from "#/components/reason-field";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { agentsQueryKey } from "#/hooks/use-agents";
import {
  changeAgentStatus,
  type AgentStatusAction,
} from "#/lib/api/agents-controller";
import { friendlyError } from "#/lib/api/friendly-error";
import { STATUS_ACTIONS } from "../agent-rules";

type Props = {
  readonly agent: { id: string; firstName: string; lastName: string };
  /** The action to confirm; null keeps the dialog closed. */
  readonly action: AgentStatusAction | null;
  readonly onClose: () => void;
};

/**
 * Suspend, reactivate or revoke. A reason is required wherever the server
 * requires one; it is kept on the agent and shown to admins only.
 */
export function AgentStatusDialog({ agent, action, onClose }: Props) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (action) {
      setReason("");
      setAttempted(false);
    }
  }, [action]);

  const rule = action ? STATUS_ACTIONS[action] : null;
  const name = `${agent.firstName} ${agent.lastName}`;

  const mutation = useMutation({
    mutationFn: () =>
      changeAgentStatus(agent.id, action!, reason.trim() || undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: agentsQueryKey });
      toast.success(`${name} ${rule!.done}.`);
      onClose();
    },
  });

  const confirm = () => {
    setAttempted(true);
    if (rule?.needsReason && !reason.trim()) return;
    mutation.mutate();
  };

  return (
    <Dialog
      open={action !== null}
      onOpenChange={(open) => {
        if (!open && !mutation.isPending) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        {rule && (
          <>
            <DialogHeader>
              <DialogTitle>{rule.title}</DialogTitle>
              <DialogDescription>
                <span className="text-foreground font-medium">{name}</span>.{" "}
                {rule.description}
              </DialogDescription>
            </DialogHeader>

            {rule.needsReason && (
              <ReasonField
                value={reason}
                onChange={setReason}
                templateScope={null}
                placeholder="Why? Visible to admins only."
                required
                error={attempted && !reason.trim()}
                disabled={mutation.isPending}
              />
            )}

            {mutation.isError && (
              <p className="text-destructive text-sm">
                {friendlyError(mutation.error, "Couldn't update this agent.")}
              </p>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant={rule.destructive ? "destructive" : "default"}
                onClick={confirm}
                disabled={mutation.isPending}
              >
                {mutation.isPending && (
                  <IconLoader2 className="size-4 animate-spin" />
                )}
                {rule.label}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
