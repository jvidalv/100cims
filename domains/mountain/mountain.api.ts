import { useMutation, useQuery } from "@tanstack/react-query";

import { useChallenge } from "@/components/providers/challenge-provider";
import { useUserChallengeSummits } from "@/domains/user/user.api";
import { useLocation } from "@/hooks/use-location";
import apiClient from "@/lib/api-client";
import { getDistanceInKm } from "@/lib/location";

export const useMountainOne = ({ mountainSlug }: { mountainSlug: string }) => {
  const props = useQuery({
    queryKey: ["mountain", mountainSlug],
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/public/mountains/one", {
        params: { query: { mountainSlug } },
      });
      if (error) throw error;
      return data.message;
    },
  });

  return props;
};

export const useMountains = () => {
  const { challengeId } = useChallenge();

  return useQuery({
    queryKey: ["mountains", challengeId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/public/mountains/all", {
        params: { query: { challengeId } },
      });
      if (error) throw error;
      return data.message;
    },
    retryOnMount: false,
    staleTime: 10000 * 60 * 60,
    refetchOnWindowFocus: false,
  });
};

export const useRecommendedPeaks = () => {
  const { data: mountains } = useMountains();
  const { data: userSummits } = useUserChallengeSummits();
  const { location: userLocation } = useLocation();

  const filteredMountains = mountains?.filter(
    ({ slug, essential }) =>
      essential &&
      !userSummits?.summits?.some(({ mountainSlug }) => mountainSlug === slug),
  );

  if (!filteredMountains?.length) return [];

  if (userLocation) {
    const sortedByDistance = [...filteredMountains].sort((a, b) => {
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
  return [...filteredMountains]
    .sort((a, b) => parseInt(b.height) - parseInt(a.height))
    .slice(0, 3);
};

export const useSummitPost = (mountainSlug: string) => {
  return useMutation({
    mutationKey: ["summit", mountainSlug],
    mutationFn: async (input: {
      mountainId: string;
      usersId: string[];
      date: string;
      image: string;
    }) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/mountain/summit",
        { body: input },
      );
      if (error) throw error;
      return data;
    },
  });
};
