import * as Linking from "expo-linking";
import { TouchableOpacity, View } from "react-native";
import Svg, { Path, Rect, Line } from "react-native-svg";

import {
  INSTAGRAM_URL,
  TIKTOK_URL,
  WHATSAPP_COMMUNITY_URL,
} from "@/lib/app-links";

type Props = {
  size?: number;
  color?: string;
};

export const InstagramIcon = ({ size = 24, color = "#6B7280" }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="2"
      y="2"
      width="20"
      height="20"
      rx="5"
      stroke={color}
      strokeWidth={2}
    />
    <Path
      d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line
      x1="17.5"
      y1="6.5"
      x2="17.51"
      y2="6.5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

export const TikTokIcon = ({ size = 24, color = "#6B7280" }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.57a8.16 8.16 0 0 0 4.77 1.52V6.69a4.85 4.85 0 0 1-1.84 0z" />
  </Svg>
);

// Strava chevron mark.
export const StravaIcon = ({ size = 24, color = "#6B7280" }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M10.4 2 4 14.4h3.9L10.4 9.5 12.8 14.4h3.9L10.4 2zm3.4 12.4-1.7 3.3-1.6-3.3H7.7l4.4 7.6 4.4-7.6h-2.7z" />
  </Svg>
);

// Wikiloc trail mark.
export const WikilocIcon = ({ size = 24, color = "#6B7280" }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9L8 16L12 11L16 16L21 9"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5 5H17"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M14 3L17 5L14 7"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const WhatsAppIcon = ({ size = 24, color = "#6B7280" }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 32 32" fill={color}>
    <Path d="M16 3C8.82 3 3 8.82 3 16c0 2.29.6 4.53 1.74 6.5L3 29l6.66-1.74A12.94 12.94 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.8c-1.97 0-3.9-.53-5.58-1.52l-.4-.24-3.95 1.03 1.05-3.85-.26-.41A10.76 10.76 0 0 1 5.2 16c0-5.95 4.85-10.8 10.8-10.8S26.8 10.05 26.8 16 21.95 26.8 16 26.8zm5.93-8.08c-.32-.16-1.92-.95-2.22-1.06-.3-.11-.52-.16-.73.16-.22.32-.84 1.06-1.03 1.28-.19.22-.38.24-.7.08-.32-.16-1.37-.5-2.6-1.61-.96-.86-1.61-1.91-1.8-2.23-.19-.32-.02-.5.14-.66.15-.14.32-.38.48-.56.16-.19.21-.32.32-.54.11-.22.05-.4-.03-.56-.08-.16-.73-1.76-1-2.4-.26-.63-.53-.55-.73-.56l-.62-.01c-.21 0-.56.08-.86.4-.3.32-1.13 1.1-1.13 2.69 0 1.58 1.16 3.11 1.32 3.33.16.21 2.28 3.49 5.53 4.89.77.33 1.38.53 1.85.68.78.25 1.48.21 2.04.13.62-.09 1.92-.78 2.19-1.54.27-.76.27-1.4.19-1.54-.08-.13-.29-.21-.61-.37z" />
  </Svg>
);

export const SocialIcons = ({ size = 24, color }: Props) => (
  <View className="flex-row items-center gap-4">
    <TouchableOpacity
      onPress={() => Linking.openURL(INSTAGRAM_URL)}
      accessibilityLabel="Instagram"
      hitSlop={8}
    >
      <InstagramIcon size={size} color={color} />
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => Linking.openURL(TIKTOK_URL)}
      accessibilityLabel="TikTok"
      hitSlop={8}
    >
      <TikTokIcon size={size} color={color} />
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => Linking.openURL(WHATSAPP_COMMUNITY_URL)}
      accessibilityLabel="WhatsApp"
      hitSlop={8}
    >
      <WhatsAppIcon size={size} color={color} />
    </TouchableOpacity>
  </View>
);
