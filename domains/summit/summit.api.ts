import { useQuery } from "@tanstack/react-query";

import { useChallenge } from "@/components/providers/challenge-provider";
import { api } from "@/lib";

export const SUMMITS_KEY = ({
  challengeId,
  mountainId,
  limit,
}: {
  challengeId: string;
  mountainId?: string;
  limit?: number;
}) => ["summits", challengeId, mountainId, limit];

export const useSummitsGet = ({
  mountainId,
  limit,
}: {
  mountainId?: string;
  limit?: number;
}) => {
  const { challengeId } = useChallenge();

  const args = useQuery({
    queryKey: SUMMITS_KEY({ mountainId, limit, challengeId }),
    queryFn: () =>
      api.public.mountains.summits.get({
        query: {
          challengeId,
          mountainId,
          limit,
        },
      }),
  });

  return { ...args, data: args.data?.data?.message };
};
