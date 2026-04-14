import { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
import {
  FlatList,
  Modal,
  Pressable,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Icon, IconSymbolName } from "@/components/ui/atoms/icon";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";

const EMOJI_CATEGORIES = {
  nature: [
    "🏔️",
    "⛰️",
    "🗻",
    "🌋",
    "🏕️",
    "🌲",
    "🌳",
    "🌴",
    "🌵",
    "🌾",
    "🌿",
    "🍀",
    "🍁",
    "🍂",
    "🌸",
    "🌺",
    "🌻",
    "🌼",
    "🌷",
    "🪻",
    "🌱",
    "🪴",
    "🌍",
    "🌎",
    "🌏",
    "🌙",
    "⭐",
    "🌟",
    "✨",
    "☀️",
    "🌤️",
    "⛅",
    "🌈",
    "❄️",
    "💧",
    "🌊",
  ],
  animals: [
    "🦅",
    "🦆",
    "🦉",
    "🐦",
    "🦋",
    "🐝",
    "🐞",
    "🦎",
    "🐍",
    "🐢",
    "🦌",
    "🐐",
    "🦙",
    "🐑",
    "🐄",
    "🐎",
    "🐕",
    "🐈",
    "🐻",
    "🐺",
    "🦊",
    "🐗",
    "🦔",
    "🐿️",
    "🐰",
    "🦇",
    "🐟",
    "🐠",
    "🦈",
    "🐳",
    "🐬",
    "🦭",
  ],
  activities: [
    "🥾",
    "🏃",
    "🚶",
    "🧗",
    "⛷️",
    "🏂",
    "🪂",
    "🚴",
    "🏊",
    "🛶",
    "🎿",
    "🏋️",
    "🧘",
    "🏆",
    "🥇",
    "🥈",
    "🥉",
    "🎯",
    "🎪",
    "🎭",
    "🎨",
    "📸",
    "🎒",
    "🧭",
    "🗺️",
    "⛺",
    "🔦",
    "🪵",
    "🔥",
    "🌡️",
    "⚡",
    "💪",
  ],
  flags: [
    "🇪🇸",
    "🇫🇷",
    "🇮🇹",
    "🇩🇪",
    "🇬🇧",
    "🇵🇹",
    "🇦🇹",
    "🇨🇭",
    "🇧🇪",
    "🇳🇱",
    "🇵🇱",
    "🇨🇿",
    "🇸🇰",
    "🇭🇺",
    "🇷🇴",
    "🇧🇬",
    "🇬🇷",
    "🇭🇷",
    "🇸🇮",
    "🇷🇸",
    "🇲🇪",
    "🇦🇱",
    "🇲🇰",
    "🇧🇦",
    "🇺🇸",
    "🇨🇦",
    "🇲🇽",
    "🇦🇷",
    "🇨🇱",
    "🇵🇪",
    "🇯🇵",
    "🇰🇷",
  ],
  symbols: [
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💯",
    "✅",
    "🔴",
    "🟠",
    "🟡",
    "🟢",
    "🔵",
    "🟣",
    "⚫",
    "⚪",
    "🟤",
    "🔶",
    "🔷",
    "💎",
    "🏴",
    "🚩",
    "📍",
    "📌",
    "🎌",
    "🏁",
    "♻️",
    "🌐",
    "🔰",
  ],
};

type Category = keyof typeof EMOJI_CATEGORIES;

const CATEGORY_ICONS: Record<Category, IconSymbolName> = {
  nature: "leaf.fill",
  animals: "pawprint.fill",
  activities: "figure.hiking",
  flags: "flag.fill",
  symbols: "heart.fill",
};

type EmojiPickerProps = {
  value?: string;
  onSelect: (emoji: string) => void;
};

export function EmojiPicker({ value, onSelect }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<Category>("nature");

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setIsOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        className="h-[58px] w-[58px] items-center justify-center rounded border-2 border-border bg-muted/30"
      >
        {value ? (
          <ThemedText className="text-3xl">{value}</ThemedText>
        ) : (
          <Icon name="face.smiling" muted size={28} />
        )}
      </TouchableOpacity>

      <EmojiPickerModal
        isOpen={isOpen}
        category={category}
        onCategoryChange={setCategory}
        onSelect={handleSelect}
        onClose={() => setIsOpen(false)}
        selectedEmoji={value}
      />
    </>
  );
}

type EmojiPickerModalProps = {
  isOpen: boolean;
  category: Category;
  onCategoryChange: (category: Category) => void;
  onSelect: (emoji: string) => void;
  onClose: () => void;
  selectedEmoji?: string;
};

function EmojiPickerModal({
  isOpen,
  category,
  onCategoryChange,
  onSelect,
  onClose,
  selectedEmoji,
}: EmojiPickerModalProps) {
  const [visible, setVisible] = useState(isOpen);
  const translateY = useSharedValue(400);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      translateY.value = withTiming(0, { duration: 300 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateY.value = withTiming(400, { duration: 300 });
      opacity.value = withTiming(0, { duration: 200 });
      const timeout = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, translateY, opacity]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) return null;

  const emojis = EMOJI_CATEGORIES[category];

  return (
    <Modal animationType="none" visible={isOpen} transparent>
      <View className="flex-1 justify-end">
        <Animated.View
          className="absolute size-full bg-background/40"
          style={animatedOverlayStyle}
        >
          <Pressable className="size-full" onPress={onClose} />
        </Animated.View>
        <Animated.View
          style={animatedContainerStyle}
          className="relative rounded-t-2xl border border-border bg-background shadow-sm"
        >
          <TouchableOpacity
            onPress={onClose}
            className="absolute -top-8 right-4"
          >
            <Icon
              name="xmark"
              animationSpec={{ effect: { type: "bounce" } }}
              size={18}
            />
          </TouchableOpacity>

          <ThemedView className="p-4">
            <ThemedText className="mb-4 text-center text-lg font-semibold">
              <FormattedMessage defaultMessage="Select emoji" />
            </ThemedText>

            {/* Category tabs */}
            <View className="mb-4 flex-row justify-around rounded bg-muted/50 p-1">
              {(Object.keys(EMOJI_CATEGORIES) as Category[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => onCategoryChange(cat)}
                  className={`flex-1 items-center rounded py-2 ${
                    category === cat ? "bg-background" : ""
                  }`}
                >
                  <Icon
                    name={CATEGORY_ICONS[cat]}
                    size={20}
                    muted={category !== cat}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Emoji grid */}
            <FlatList
              data={emojis}
              numColumns={8}
              keyExtractor={(item) => item}
              contentContainerClassName="pb-8"
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 280 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => onSelect(item)}
                  className={`flex-1 items-center justify-center p-2 ${
                    selectedEmoji === item ? "rounded bg-primary/20" : ""
                  }`}
                >
                  <ThemedText className="text-2xl">{item}</ThemedText>
                </TouchableOpacity>
              )}
            />
          </ThemedView>
        </Animated.View>
      </View>
    </Modal>
  );
}
