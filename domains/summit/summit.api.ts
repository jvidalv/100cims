import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib";

export const SUMMITS_KEY = ({
  mountainId,
  limit,
}: {
  mountainId?: string;
  limit?: number;
}) => ["summits", mountainId, limit];

export const useSummitsGet = ({
  mountainId,
  limit,
}: {
  mountainId?: string;
  limit?: number;
}) => {
  const args = useQuery({
    queryKey: SUMMITS_KEY({ mountainId, limit }),
    queryFn: () =>
      api.public.mountains.summits.get({
        query: {
          mountainId,
          limit,
        },
      }),
  });

  return { ...args, data: args.data?.data?.message };
};
