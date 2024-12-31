import { BlurView } from "expo-blur";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, TouchableOpacity, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { twMerge } from "tailwind-merge";

import { Avatar } from "@/components/ui/atoms/avatar";
import { Button } from "@/components/ui/atoms/button";
import { Icon } from "@/components/ui/atoms/icon";
import { SearchInput } from "@/components/ui/atoms/search-input";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { BottomDrawer } from "@/components/ui/molecules";
import { useIsKeyboardVisible } from "@/hooks/use-is-keyboard-visible";
import { cleanText } from "@/lib";
import { getInitials } from "@/lib/strings";

export type UserForSelectInput = {
  id: string;
  fullName: string;
  imageUrl?: string | null;
};

type Props = {
  selectedUsers?: UserForSelectInput[];
  selectableUsers?: UserForSelectInput[];
  onSelectedUsersChange: (selectedUsers: UserForSelectInput[]) => void;
  firstSelectedRemovable?: boolean;
  className?: string;
  initialHeightSize?: number;
};

export const UserSelectInput = ({
  selectedUsers = [],
  selectableUsers,
  firstSelectedRemovable = true,
  onSelectedUsersChange,
  initialHeightSize = 500,
}: Props) => {
  const [query, setQuery] = useState<string>("");
  const isKeyboardVisible = useIsKeyboardVisible();
  const height = useSharedValue(initialHeightSize);
  const totalHeightSize = initialHeightSize + 200;

  useEffect(() => {
    if (isKeyboardVisible) {
      height.value = withTiming(totalHeightSize, {
        duration: 500,
        easing: Easing.out(Easing.exp),
      });
    } else {
      height.value = withTiming(initialHeightSize, {
        duration: 300,
        easing: Easing.inOut(Easing.ease),
      });
    }
  }, [height, initialHeightSize, isKeyboardVisible, totalHeightSize]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: height.value,
    };
  });

  return (
    <BottomDrawer
      Trigger={({ setOpen }) => (
        <Pressable
          onPress={() => setOpen(true)}
          className="relative flex-row items-center rounded-xl border-2 border-border bg-background py-2"
        >
          <View className="flex-row gap-2 pl-4">
            {selectedUsers?.map((user, index) => (
              <TouchableOpacity
                onPress={() =>
                  onSelectedUsersChange?.(
                    selectedUsers?.filter(({ id }) => id !== user.id),
                  )
                }
                key={user.id}
                className="relative"
              >
                <Avatar
                  imageUrl={user?.imageUrl}
                  initials={getInitials(user?.fullName)}
                />
                {(index !== 0 || firstSelectedRemovable === true) && (
                  <View className="absolute right-0 top-0 size-4 items-center justify-center rounded-full bg-background/40">
                    <Icon name="xmark" size={10} weight="semibold" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={() => setOpen(true)}
            className="ml-auto mr-4 size-10 items-center justify-center rounded-xl bg-foreground/30"
          >
            <Icon name="plus" weight="semibold" size={16} />
          </TouchableOpacity>
        </Pressable>
      )}
    >
      {({ setOpen }) => (
        <Animated.View style={animatedStyle}>
          <View className="px-6 pb-4 pt-6">
            <SearchInput onChangeText={setQuery} />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="gap-6 px-6 pb-24 pt-2"
          >
            {selectableUsers
              ?.filter((user) =>
                cleanText(user.fullName)
                  ?.toLowerCase()
                  .includes(cleanText(query)?.toLowerCase()),
              )
              .map((user) => {
                const isSelected = selectedUsers.some(
                  (selectedUser) => selectedUser.id === user.id,
                );

                const isDisabled =
                  !firstSelectedRemovable && user.id === selectedUsers?.[0].id;

                const onPress = () => {
                  if (isSelected) {
                    onSelectedUsersChange?.(
                      selectedUsers.filter(({ id }) => id !== user.id),
                    );
                  } else {
                    onSelectedUsersChange?.([...selectedUsers, user]);
                  }
                };

                return (
                  <Pressable
                    key={user.id}
                    className={twMerge(
                      "flex flex-row items-center gap-4",
                      isDisabled && "opacity-80",
                    )}
                    onPress={onPress}
                    disabled={isDisabled}
                  >
                    <View className="flex flex-row items-center gap-4">
                      <Avatar
                        imageUrl={user?.imageUrl}
                        initials={getInitials(user?.fullName)}
                        style={{
                          boxShadow: isSelected
                            ? "0px 0px 0px 2px #22c55e"
                            : undefined,
                        }}
                      />
                      <ThemedText>{user.fullName}</ThemedText>
                    </View>
                    <View className="ml-auto text-green-500">
                      <Icon
                        name={isSelected ? "checkmark.square.fill" : "square"}
                        color={isSelected ? "#22c55e" : undefined}
                        animationSpec={
                          isSelected
                            ? { effect: { type: "bounce" } }
                            : undefined
                        }
                      />
                    </View>
                  </Pressable>
                );
              })}
          </ScrollView>
          <BlurView className="absolute bottom-0 h-32 w-full p-6">
            <Button onPress={() => setOpen(false)} intent="success">
              Done
            </Button>
          </BlurView>
        </Animated.View>
      )}
    </BottomDrawer>
  );
};
