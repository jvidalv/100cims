import { useMemo } from "react";

import { Coordinates, getDistanceInKm } from "@/lib/location";

import { useLocation } from "./use-location";

export function useDistanceToTarget(target: Coordinates) {
  const { location, status, error } = useLocation();

  const distanceInKm = useMemo(() => {
    if (location) {
      return getDistanceInKm(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        target,
      );
    }
    return null;
  }, [location, target]);

  return {
    distanceInKm,
    location,
    status,
    error,
  };
}
