import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib";

export const DEFAULT_CHALLENGE_ID = "5f996363-7460-4bc8-817c-8dd633c0b504"; // 100cims

export const useChallengesGet = () => {
  const args = useQuery({
    queryKey: ["challenges"],
    queryFn: () => api.public.challenge.all.get(),
  });

  return { ...args, data: args.data?.data?.message };
};
