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
import { ThemedView } from "@/components/ui/atoms/themed-view";
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
  maxSelected?: number;
};

export const UserSelectInput = ({
  selectedUsers = [],
  selectableUsers,
  firstSelectedRemovable = true,
  onSelectedUsersChange,
  initialHeightSize = 500,
  maxSelected,
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

  const filteredUsers = selectableUsers?.filter((user) =>
    cleanText(user.fullName)
      ?.toLowerCase()
      .includes(cleanText(query)?.toLowerCase()),
  );

  return (
    <BottomDrawer
      Trigger={({ setOpen }) => (
        <Pressable
          onPress={() => setOpen(true)}
          className="flex-row items-center rounded-xl border-2 border-border bg-background py-2"
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="flex-row gap-2 pl-4"
          >
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
                  <View className="absolute right-0 top-0 size-4 items-center justify-center rounded-full bg-background/80">
                    <Icon name="xmark" size={10} weight="semibold" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            onPress={() => setOpen(true)}
            className="mx-4 size-10 items-center justify-center rounded-xl bg-muted-foreground/30 shadow"
          >
            <Icon name="plus" weight="semibold" color="white" size={16} />
          </TouchableOpacity>
        </Pressable>
      )}
    >
      {({ setOpen }) => (
        <Animated.View style={animatedStyle}>
          <View className="gap-4 px-6 pb-2 pt-6">
            <SearchInput onChangeText={setQuery} />
            <View className="flex-row justify-between">
              <ThemedText className="text-muted-foreground">
                {filteredUsers?.length} total
              </ThemedText>
              {selectedUsers?.length && (
                <ThemedText className="text-emerald-500">
                  {selectedUsers?.length} selected
                </ThemedText>
              )}
            </View>
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="gap-6 px-6 pb-36 pt-2"
          >
            {filteredUsers?.map((user) => {
              const isSelected = selectedUsers.some(
                (selectedUser) => selectedUser.id === user.id,
              );

              const isFirstSelectedAndNotRemovable =
                !firstSelectedRemovable && user.id === selectedUsers?.[0].id;

              const notAllowed = !!(
                maxSelected &&
                maxSelected === selectedUsers?.length &&
                !isSelected
              );

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
                    notAllowed && "opacity-50",
                  )}
                  onPress={onPress}
                  disabled={isFirstSelectedAndNotRemovable || notAllowed}
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
                    {isFirstSelectedAndNotRemovable ? (
                      <Icon name="lock.fill" color="#22c55e" />
                    ) : (
                      <Icon
                        name={isSelected ? "checkmark.square.fill" : "square"}
                        color={isSelected ? "#22c55e" : undefined}
                        animationSpec={
                          isSelected
                            ? { effect: { type: "bounce" } }
                            : undefined
                        }
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
          <ThemedView className="absolute bottom-0 h-32 w-full p-6">
            <Button onPress={() => setOpen(false)} intent="outline">
              Done
            </Button>
          </ThemedView>
        </Animated.View>
      )}
    </BottomDrawer>
  );
};
