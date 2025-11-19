import { useSegments } from "expo-router";

export const useIsCurrentScreen = (route: string) => {
  const segments = useSegments();
  return `/${segments.join("/")}` === route;
};
