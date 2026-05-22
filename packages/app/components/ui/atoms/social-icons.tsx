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

export const WhatsAppIcon = ({ size = 24, color = "#6B7280" }: Props) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 1.67c2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.24 8.24a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm-4.51 4.4c-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.63s1.13 3.05 1.29 3.26c.16.21 2.22 3.39 5.38 4.75.75.32 1.34.52 1.8.66.76.24 1.45.21 1.99.13.61-.09 1.87-.76 2.13-1.5.26-.74.26-1.37.18-1.5-.08-.13-.29-.21-.61-.37-.31-.16-1.87-.92-2.16-1.03-.29-.1-.5-.16-.71.16-.21.31-.81 1.02-.99 1.23-.18.21-.37.24-.68.08-.31-.16-1.34-.49-2.55-1.57-.94-.84-1.58-1.88-1.76-2.19-.18-.31-.02-.48.14-.64.14-.14.31-.37.47-.55.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.55-.08-.16-.71-1.72-.99-2.35-.26-.62-.52-.53-.71-.54-.18-.01-.39-.01-.6-.01z" />
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
