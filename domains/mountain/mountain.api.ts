import { useMutation, useQuery } from "@tanstack/react-query";

import { useChallenge } from "@/components/providers/challenge-provider";
import { useUserChallengeSummits } from "@/domains/user/user.api";
import { useApiWithAuth } from "@/hooks/use-api-with-auth";
import { useLocation } from "@/hooks/use-location";
import { api } from "@/lib";
import { getDistanceInKm } from "@/lib/location";

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
  const { data: mountainData } = useMountains();
  const { data: userSummits } = useUserChallengeSummits();
  const { location: userLocation } = useLocation();

  const mountains = mountainData?.data?.message?.filter(
    ({ slug, essential }) =>
      essential &&
      !userSummits?.summits?.some(({ mountainSlug }) => mountainSlug === slug),
  );

  if (!mountains?.length) return [];

  if (userLocation) {
    const sortedByDistance = [...mountains].sort((a, b) => {
      const distA = getDistanceInKm(userLocation.coords, {
        latitude: parseFloat(a.latitude),
        longitude: parseFloat(a.longitude),
      });
      const distB = getDistanceInKm(userLocation.coords, {
        latitude: parseFloat(b.latitude),
        longitude: parseFloat(b.longitude),
      });
      return distA - distB;
    });

    return sortedByDistance.slice(0, 3); // return closest only
  }

  // Fallback to highest if no location
  return [...mountains]
    .sort((a, b) => parseInt(b.height) - parseInt(a.height))
    .slice(0, 3);
};

export const useSummitPost = (mountainSlug: string) => {
  const apiWithAuth = useApiWithAuth();

  return useMutation({
    mutationKey: ["summit", mountainSlug],
    mutationFn: apiWithAuth.protected.mountain.summit.post,
  });
};
