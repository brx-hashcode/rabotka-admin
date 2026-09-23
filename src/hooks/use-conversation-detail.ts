import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  closeConversation,
  getConversationById,
  reopenConversation,
  type AdminConversationDetail,
} from "#/lib/api/conversations-controller";
import { friendlyError } from "#/lib/api/friendly-error";

export function useConversationDetail(id: string) {
  const queryClient = useQueryClient();
  const detailKey = ["admin", "conversations", "detail", id];

  const query = useQuery({
    queryKey: detailKey,
    queryFn: () => getConversationById(id),
    enabled: Boolean(id),
  });

  const onSettled = (conversation: AdminConversationDetail) => {
    queryClient.setQueryData(detailKey, conversation);
    // The list carries the open/closed badge too, and a row that still says
    // "Open" after you just locked it reads as the action having failed.
    void queryClient.invalidateQueries({
      queryKey: ["admin", "conversations"],
    });
  };

  const close = useMutation({
    mutationFn: () => closeConversation(id),
    onSuccess: (conversation) => {
      onSettled(conversation);
      toast.success("Conversation locked. Neither side can write in it now.");
    },
    onError: (error) =>
      toast.error(friendlyError(error, "Could not lock this conversation")),
  });

  const reopen = useMutation({
    mutationFn: () => reopenConversation(id),
    onSuccess: (conversation) => {
      onSettled(conversation);
      toast.success("Conversation unlocked. Both sides can write again.");
    },
    onError: (error) =>
      toast.error(friendlyError(error, "Could not unlock this conversation")),
  });

  return {
    conversation: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    close: close.mutate,
    reopen: reopen.mutate,
    isLocking: close.isPending || reopen.isPending,
  };
}
