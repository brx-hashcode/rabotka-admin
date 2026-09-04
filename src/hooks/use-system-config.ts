import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getSystemConfigs,
  updateSystemConfigs,
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
    mutationFn: (values: Record<string, string>) => updateSystemConfigs(values),
    onSuccess: (_data, values) => {
      queryClient.setQueryData<SystemConfigItem[]>(queryKey, (prev) =>
        prev?.map((item) =>
          item.key in values ? { ...item, value: values[item.key] } : item,
        ),
      );
    },
  });

  /**
   * Save every changed field as one request.
   *
   * This used to fan out one PATCH per key in parallel, which cannot express a
   * setting whose validity depends on another. Switching parrainage from
   * 300/200 FCFA to 60/40 % is three changes that are each invalid on their own
   * — the server sees "referrer = 60" while the stored type still says FIXED,
   * or two percentages summing to 260 — and rejects whichever lands first. The
   * batch endpoint validates the resulting state instead, and applies it in one
   * transaction, so a rejected save leaves nothing half-written.
   */
  async function saveChanges(changes: Record<string, string>) {
    const current = query.data ?? [];
    const values = Object.fromEntries(
      Object.entries(changes).filter(([key, value]) => {
        const existing = current.find((item) => item.key === key);
        return existing && existing.value !== value;
      }),
    );

    if (Object.keys(values).length === 0) return;

    try {
      await updateMutation.mutateAsync(values);
      toast.success("Settings saved");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save settings";
      toast.error(message);
    }
  }

  return {
    configs: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    saveChanges,
    isSaving: updateMutation.isPending,
  };
}
