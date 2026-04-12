import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { adminKeys } from "@/lib/query-keys";

export const useCrons = () =>
  useQuery({
    queryKey: adminKeys.crons(),
    queryFn: async () => {
      const { data, error } = await api.api.admin.crons.get();
      if (error) throw error;
      return data.message;
    },
  });

export const useTriggerCron = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await api.api.admin
        .crons({ name })
        .trigger.post();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminKeys.crons() });
    },
  });
};
