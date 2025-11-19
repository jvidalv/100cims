import { BlurView as ExpoBlur } from "expo-blur";

import { ThemedView } from "@/components/ui/atoms/themed-view";
import { isAndroid } from "@/lib/device";

export const BlurView = isAndroid ? ThemedView : ExpoBlur;
