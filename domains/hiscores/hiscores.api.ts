import { useQuery } from "@tanstack/react-query";

import { useChallenge } from "@/components/providers/challenge-provider";
import { api } from "@/lib";

export const useHiscoresGet = () => {
  const { challengeId } = useChallenge();
  const args = useQuery({
    queryKey: ["hiscores", challengeId],
    queryFn: () => api.public.hiscores.all.get({ query: { challengeId } }),
  });

  return { ...args, data: args.data?.data?.message };
};
