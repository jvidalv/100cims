import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { userKeys } from "@/lib/query-keys";

export const useMe = () =>
  useQuery({
    queryKey: userKeys.me(),
    queryFn: async () => {
      const { data, error } = await api.api.admin.me.get();
      if (error) throw error;
      return data.message;
    },
  });
