import { useQuery } from "@tanstack/react-query";

import { useApiWithAuth } from "@/hooks/use-api-with-auth";

export const DONORS_KEY = ["donors"];
export const DONORS_MONTHLY_KEY = ["donors", "monthly"];

export const useDonorsGet = () => {
  const api = useApiWithAuth();
  const args = useQuery({
    queryKey: DONORS_KEY,
    queryFn: () => api.protected.donors.all.get(),
  });

  return { ...args, data: args.data?.data?.message };
};

export const useDonorsCurrentMonthGet = () => {
  const api = useApiWithAuth();
  const args = useQuery({
    queryKey: DONORS_MONTHLY_KEY,
    queryFn: () => api.protected.donors["current-month"].get(),
  });

  return { ...args, data: args.data?.data?.message };
};
