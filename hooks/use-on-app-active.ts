import { useEffect } from "react";
import { AppState } from "react-native";

export const useOnAppActive = (callback: () => void) => {
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        callback();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [callback]);
};
