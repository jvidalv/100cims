import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/components/providers/auth-provider";
import { useChallenge } from "@/components/providers/challenge-provider";
import { useApiWithAuth } from "@/hooks/use-api-with-auth";
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

export const useSummitGet = ({ summitId }: { summitId: string }) => {
  const api = useApiWithAuth();
  const { isAuthenticated } = useAuth();

  const args = useQuery({
    queryKey: [summitId],
    enabled: () => isAuthenticated,
    queryFn: () =>
      api.protected.summit.one.get({
        query: {
          summitId,
        },
      }),
  });

  return { ...args, data: args.data?.data?.message };
};
