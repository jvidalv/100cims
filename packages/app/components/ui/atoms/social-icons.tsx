import * as Linking from "expo-linking";
import { TouchableOpacity, useColorScheme, View } from "react-native";
import Svg, { Path, Rect, Line } from "react-native-svg";

import { Colors } from "@/constants/colors";
import {
  INSTAGRAM_URL,
  TIKTOK_URL,
  WHATSAPP_COMMUNITY_URL,
  YOUTUBE_URL,
} from "@/lib/app-links";

type Props = {
  size?: number;
  color?: string;
};

/**
 * Default fill/stroke for the brand glyphs when the caller doesn't supply
 * `color`. Picks black on light theme and white on dark — matches the
 * page's foreground text colour so the icons read at the same weight as
 * adjacent copy. Callers can still override with `color="#hex"` for cases
 * (e.g. footer chips on a coloured background) where the brand should
 * pop instead of blend.
 */
const useDefaultIconColor = (): string => {
  const scheme = useColorScheme();
  return scheme === "dark" ? Colors.dark.foreground : Colors.light.foreground;
};

export const InstagramIcon = ({ size = 24, color }: Props) => {
  const defaultColor = useDefaultIconColor();
  const fill = color ?? defaultColor;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5"
        stroke={fill}
        strokeWidth={2}
      />
      <Path
        d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"
        stroke={fill}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="17.5"
        y1="6.5"
        x2="17.51"
        y2="6.5"
        stroke={fill}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const TikTokIcon = ({ size = 24, color }: Props) => {
  const defaultColor = useDefaultIconColor();
  const fill = color ?? defaultColor;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
      <Path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.57a8.16 8.16 0 0 0 4.77 1.52V6.69a4.85 4.85 0 0 1-1.84 0z" />
    </Svg>
  );
};

// Strava double-chevron mark. The canonical brand glyph: two stacked
// chevrons sharing a vertical centerline, with the lower chevron offset so
// its peak sits just under the upper chevron's trough.
export const StravaIcon = ({ size = 24, color }: Props) => {
  const defaultColor = useDefaultIconColor();
  const fill = color ?? defaultColor;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
      <Path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.172" />
    </Svg>
  );
};

// Wikiloc trail mark.
export const WikilocIcon = ({ size = 24, color }: Props) => {
  const defaultColor = useDefaultIconColor();
  const fill = color ?? defaultColor;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9L8 16L12 11L16 16L21 9"
        stroke={fill}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M5 5H17" stroke={fill} strokeWidth={2} strokeLinecap="round" />
      <Path
        d="M14 3L17 5L14 7"
        stroke={fill}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const WhatsAppIcon = ({ size = 24, color }: Props) => {
  const defaultColor = useDefaultIconColor();
  const fill = color ?? defaultColor;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill={fill}>
      <Path d="M16 3C8.82 3 3 8.82 3 16c0 2.29.6 4.53 1.74 6.5L3 29l6.66-1.74A12.94 12.94 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.8c-1.97 0-3.9-.53-5.58-1.52l-.4-.24-3.95 1.03 1.05-3.85-.26-.41A10.76 10.76 0 0 1 5.2 16c0-5.95 4.85-10.8 10.8-10.8S26.8 10.05 26.8 16 21.95 26.8 16 26.8zm5.93-8.08c-.32-.16-1.92-.95-2.22-1.06-.3-.11-.52-.16-.73.16-.22.32-.84 1.06-1.03 1.28-.19.22-.38.24-.7.08-.32-.16-1.37-.5-2.6-1.61-.96-.86-1.61-1.91-1.8-2.23-.19-.32-.02-.5.14-.66.15-.14.32-.38.48-.56.16-.19.21-.32.32-.54.11-.22.05-.4-.03-.56-.08-.16-.73-1.76-1-2.4-.26-.63-.53-.55-.73-.56l-.62-.01c-.21 0-.56.08-.86.4-.3.32-1.13 1.1-1.13 2.69 0 1.58 1.16 3.11 1.32 3.33.16.21 2.28 3.49 5.53 4.89.77.33 1.38.53 1.85.68.78.25 1.48.21 2.04.13.62-.09 1.92-.78 2.19-1.54.27-.76.27-1.4.19-1.54-.08-.13-.29-.21-.61-.37z" />
    </Svg>
  );
};

export const YouTubeIcon = ({ size = 24, color }: Props) => {
  const defaultColor = useDefaultIconColor();
  const fill = color ?? defaultColor;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
      <Path d="M21.58 7.19a2.51 2.51 0 0 0-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42A2.51 2.51 0 0 0 2.42 7.19 26.27 26.27 0 0 0 2 12a26.27 26.27 0 0 0 .42 4.81 2.51 2.51 0 0 0 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42a2.51 2.51 0 0 0 1.77-1.77A26.27 26.27 0 0 0 22 12a26.27 26.27 0 0 0-.42-4.81zM10 15V9l5.2 3-5.2 3z" />
    </Svg>
  );
};

export const SocialIcons = ({ size = 24, color }: Props) => (
  <View className="flex-row items-center gap-4">
    <TouchableOpacity
      onPress={() => void Linking.openURL(INSTAGRAM_URL)}
      accessibilityLabel="Instagram"
      hitSlop={8}
    >
      <InstagramIcon size={size} color={color} />
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => void Linking.openURL(TIKTOK_URL)}
      accessibilityLabel="TikTok"
      hitSlop={8}
    >
      <TikTokIcon size={size} color={color} />
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => void Linking.openURL(YOUTUBE_URL)}
      accessibilityLabel="YouTube"
      hitSlop={8}
    >
      <YouTubeIcon size={size} color={color} />
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => void Linking.openURL(WHATSAPP_COMMUNITY_URL)}
      accessibilityLabel="WhatsApp"
      hitSlop={8}
    >
      <WhatsAppIcon size={size} color={color} />
    </TouchableOpacity>
  </View>
);
