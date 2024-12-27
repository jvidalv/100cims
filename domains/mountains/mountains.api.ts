import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib";

export const useMountains = () => {
  return useQuery({
    queryKey: ["mountains"],
    queryFn: () => api.public.mountains.all.get(),
    retryOnMount: false,
    staleTime: 10000 * 60 * 60,
    refetchOnWindowFocus: false,
  });
};

export const useRecommendedPeaks = () => {
  const { data } = useMountains();

  return data?.data?.message?.filter(({ essential }) => essential).slice(0, 5);
};
