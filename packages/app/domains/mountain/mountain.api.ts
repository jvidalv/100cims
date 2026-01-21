import { useMutation, useQuery } from "@tanstack/react-query";

import { useUserChallengeSummits } from "@/domains/user/user.api";
import { useLocation } from "@/hooks/use-location";
import apiClient from "@/lib/api-client";
import { getDistanceInKm } from "@/lib/location";
import { mountainKeys } from "@/lib/query-keys";

export const useMountainOne = ({ mountainSlug }: { mountainSlug: string }) => {
  const props = useQuery({
    queryKey: mountainKeys.one(mountainSlug),
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
  return useQuery({
    queryKey: mountainKeys.list(),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/public/mountains/all", {
        params: { query: {} },
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

  // Filter out already summited mountains
  const notSummited = mountains?.filter(
    ({ slug }) =>
      !userSummits?.summits?.some(({ mountainSlug }) => mountainSlug === slug),
  );

  if (!notSummited?.length) return [];

  // Prefer essentials, but fallback to all mountains if no essentials
  const essentials = notSummited.filter(({ essential }) => essential);
  const candidates = essentials.length > 0 ? essentials : notSummited;

  if (userLocation) {
    const sortedByDistance = [...candidates].sort((a, b) => {
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

    return sortedByDistance.slice(0, 3);
  }

  // Fallback to highest if no location
  return [...candidates]
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
        "/api/protected/mountains/summit",
        { body: input },
      );
      if (error) throw error;
      return data;
    },
  });
};

export const useMyMountains = () => {
  return useQuery({
    queryKey: mountainKeys.myList(),
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/api/protected/mountains/my-list"
      );
      if (error) throw error;
      return data.message;
    },
  });
};

export const useMountainUpdate = () => {
  return useMutation({
    mutationKey: ["mountain", "update"],
    mutationFn: async (input: {
      id: string;
      name?: string;
      location?: string;
      height?: number;
      latitude?: number;
      longitude?: number;
      essential?: boolean;
      image?: string;
    }) => {
      const { data, error } = await apiClient.POST(
        "/api/protected/mountains/update",
        { body: input }
      );
      if (error) throw error;
      return data.message;
    },
    onSuccess: () => {
      void import("@/components/providers/query-client-provider").then(
        ({ queryClient }) => {
          void queryClient.invalidateQueries({ queryKey: mountainKeys.all });
        }
      );
    },
  });
};
