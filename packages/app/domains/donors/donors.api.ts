import { useQuery } from "@tanstack/react-query";

import apiClient from "@/lib/api-client";

export const DONORS_KEY = ["donors"];
export const DONORS_MONTHLY_KEY = ["donors", "monthly"];

export const useDonorsGet = () => {
  const args = useQuery({
    queryKey: DONORS_KEY,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/api/protected/donors/all");
      if (error) throw error;
      return data?.message;
    },
  });

  return args;
};

export const useDonorsCurrentMonthGet = () => {
  const args = useQuery({
    queryKey: DONORS_MONTHLY_KEY,
    queryFn: async () => {
      const { data, error } = await apiClient.GET(
        "/api/protected/donors/current-month",
      );
      if (error) throw error;
      return data?.message;
    },
  });

  return args;
};
