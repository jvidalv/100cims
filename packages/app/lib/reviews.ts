import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";

const LAST_REVIEW_KEY = "last_review_prompt";
const REVIEW_INTERVAL_DAYS = 30;

export const askForReview = async () => {
  const isAvailable = await StoreReview.isAvailableAsync();
  if (!isAvailable) return;

  const lastPrompt = await AsyncStorage.getItem(LAST_REVIEW_KEY);
  const now = Date.now();

  if (lastPrompt) {
    const last = parseInt(lastPrompt, 10);
    const diffInDays = (now - last) / (1000 * 60 * 60 * 24);
    if (diffInDays < REVIEW_INTERVAL_DAYS) return;
  }

  await StoreReview.requestReview();
  await AsyncStorage.setItem(LAST_REVIEW_KEY, now.toString());
};
