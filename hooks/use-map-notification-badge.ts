import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "@100cims:map_notification_seen";

export function useMapNotificationBadge() {
  const [showBadge, setShowBadge] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkBadgeStatus() {
      try {
        const value = await AsyncStorage.getItem(STORAGE_KEY);
        setShowBadge(value !== "true");
      } catch (error) {
        // If there's an error reading, default to showing the badge
        setShowBadge(true);
      } finally {
        setIsLoading(false);
      }
    }

    void checkBadgeStatus();
  }, []);

  const markAsSeen = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, "true");
      setShowBadge(false);
    } catch (error) {
      // Silently fail if we can't write to storage
      console.error("Failed to mark map notification as seen:", error);
    }
  }, []);

  return { showBadge, markAsSeen, isLoading };
}
