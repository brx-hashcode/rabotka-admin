import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getProfilePortfolio,
  updatePortfolioItem,
  deletePortfolioItem,
  deletePortfolioImage,
  type AdminPortfolioItem,
  type AdminUpdatePortfolioItemParams,
} from "#/lib/api/portfolio-controller";
import { friendlyError } from "#/lib/api/friendly-error";

export function useProfilePortfolio(profileId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["admin", "profiles", profileId, "portfolio"];

  const query = useQuery<AdminPortfolioItem[]>({
    queryKey,
    queryFn: () => getProfilePortfolio(profileId),
    enabled: !!profileId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey });

  const updateItemMutation = useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: string;
      data: AdminUpdatePortfolioItemParams;
    }) => updatePortfolioItem(profileId, itemId, data),
    onSuccess: () => {
      void invalidate();
      toast.success("Portfolio item updated");
    },
    onError: (error) => {
      toast.error(friendlyError(error, "Couldn't update the portfolio item. Try again."));
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) => deletePortfolioItem(profileId, itemId),
    onSuccess: () => {
      void invalidate();
      toast.success("Portfolio item deleted");
    },
    onError: (error) => {
      toast.error(friendlyError(error, "Couldn't delete the portfolio item. Try again."));
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: ({ itemId, imageId }: { itemId: string; imageId: string }) =>
      deletePortfolioImage(profileId, itemId, imageId),
    onSuccess: () => {
      void invalidate();
      toast.success("Image deleted");
    },
    onError: (error) => {
      toast.error(friendlyError(error, "Couldn't delete the image. Try again."));
    },
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateItem: updateItemMutation.mutateAsync,
    isUpdating: updateItemMutation.isPending,
    deleteItem: deleteItemMutation.mutateAsync,
    isDeletingItem: deleteItemMutation.isPending,
    deleteImage: deleteImageMutation.mutateAsync,
    isDeletingImage: deleteImageMutation.isPending,
  };
}
