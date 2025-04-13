import { useMutation, useQuery } from "@tanstack/react-query";

import { useChallenge } from "@/components/providers/challenge-provider";
import { useUserChallengeSummits } from "@/domains/user/user.api";
import { useApiWithAuth } from "@/hooks/use-api-with-auth";
import { api } from "@/lib";

export const useMountainOne = ({ mountainSlug }: { mountainSlug: string }) => {
  const props = useQuery({
    queryKey: ["mountain", mountainSlug],
    queryFn: () => api.public.mountains.one.get({ query: { mountainSlug } }),
  });

  return {
    ...props,
    data: props.data?.data?.message,
  };
};

export const useMountains = () => {
  const { challengeId } = useChallenge();

  return useQuery({
    queryKey: ["mountains", challengeId],
    queryFn: () => api.public.mountains.all.get({ query: { challengeId } }),
    retryOnMount: false,
    staleTime: 10000 * 60 * 60,
    refetchOnWindowFocus: false,
  });
};

export const useRecommendedPeaks = () => {
  const { data } = useMountains();
  const { data: userSummits } = useUserChallengeSummits();

  return data?.data?.message
    ?.filter(
      ({ slug, essential }) =>
        essential &&
        !userSummits?.summits.some(({ mountainSlug }) => mountainSlug === slug),
    )
    ?.sort((a, b) => parseInt(b.height) - parseInt(a.height))
    .slice(0, 3);
};

export const useSummitPost = (mountainSlug: string) => {
  const apiWithAuth = useApiWithAuth();

  return useMutation({
    mutationKey: ["summit", mountainSlug],
    mutationFn: apiWithAuth.protected.mountain.summit.post,
  });
};
