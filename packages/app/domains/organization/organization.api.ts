import { useQuery } from "@tanstack/react-query";

import apiClient from "@/lib/api-client";
import { organizationKeys } from "@/lib/query-keys";

/**
 * Fetch an organization by id — drives the `/organization/[id]` screen.
 * Public endpoint, no auth headers needed. `enabled: !!id` guards against
 * the route-param-undefined window that NativeTabs' eager-mount creates
 * (see CLAUDE.md / memory: `feedback_react_query_enabled_guards`).
 */
export const useOrganizationOneGet = ({
  id,
}: {
  id: string | undefined;
}) =>
  useQuery({
    queryKey: organizationKeys.one(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/api/public/organizations/one",
        {
          params: { query: { id: id ?? "" } },
        },
      );
      if (error) throw error;
      return data.message;
    },
  });
