export const getMountainPts = (height: number, essential: boolean) =>
  Math.round(height / 10) * (essential ? 2 : 1);
