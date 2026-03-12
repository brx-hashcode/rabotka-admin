import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getSystemConfigs,
  updateSystemConfig,
  type ConfigCategory,
  type SystemConfigItem,
} from "#/lib/api/system-config-controller";

function categoryQueryKey(category: ConfigCategory) {
  return ["admin", "system-configs", category];
}

export function useSystemConfigCategory(category: ConfigCategory) {
  const queryClient = useQueryClient();
  const queryKey = categoryQueryKey(category);

  const query = useQuery({
    queryKey,
    queryFn: () => getSystemConfigs(category),
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      updateSystemConfig(key, value),
    onSuccess: (_data, variables) => {
      // Optimistically update the cached item so UI reflects immediately
      queryClient.setQueryData<SystemConfigItem[]>(queryKey, (prev) =>
        prev?.map((item) =>
          item.key === variables.key
            ? { ...item, value: variables.value }
            : item,
        ),
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  /**
   * Save a batch of key→value pairs in parallel.
   * Skips keys whose value hasn't changed from the fetched data.
   * Shows a single success toast when all patches succeed.
   */
  async function saveChanges(changes: Record<string, string>) {
    const current = query.data ?? [];
    const pairs = Object.entries(changes).filter(([key, value]) => {
      const existing = current.find((item) => item.key === key);
      return existing && existing.value !== value;
    });

    if (pairs.length === 0) return;

    await Promise.all(
      pairs.map(([key, value]) => updateMutation.mutateAsync({ key, value })),
    );

    toast.success("Paramètres enregistrés");
  }

  return {
    configs: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    saveChanges,
    isSaving: updateMutation.isPending,
  };
}
