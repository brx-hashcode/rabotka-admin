import { useQuery } from "@tanstack/react-query";
import { getMe } from "#/lib/api/auth-controller";

export function useAdminMe() {
  return useQuery({
    queryKey: ["admin", "me"],
    queryFn: getMe,
    retry: false,
  });
}
