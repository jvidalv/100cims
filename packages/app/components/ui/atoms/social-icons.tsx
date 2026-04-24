import * as Linking from "expo-linking";
import { TouchableOpacity, View } from "react-native";
import Svg, { Path, Rect, Line } from "react-native-svg";

import { INSTAGRAM_URL, TIKTOK_URL } from "@/lib/app-links";

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
  </View>
);
