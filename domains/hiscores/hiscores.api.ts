import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib";

export const useHiscoresGet = () => {
  const args = useQuery({
    queryKey: ["hiscores"],
    queryFn: () => api.public.hiscores.all.get(),
  });

  return { ...args, data: args.data?.data?.message };
};
