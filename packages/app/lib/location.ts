export type Coordinates = {
  latitude: number;
  longitude: number;
};

/**
 * Returns the distance in kilometers between two geographic coordinates.
 * - If < 1 km: returns with 1 decimal (e.g. 0.5)
 * - If ≥ 1 km: returns rounded whole number (e.g. 3)
 */
export function getDistanceInKm(from: Coordinates, to: Coordinates): number {
  const toRad = (value: number) => (value * Math.PI) / 180;

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);

  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;

  return distance < 1 ? Number(distance.toFixed(1)) : Math.round(distance);
}
