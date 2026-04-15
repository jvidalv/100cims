import { Lock, Plus, Square, SquareCheck, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { FormattedMessage } from "react-intl";
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
import { LucideIcon } from "@/components/ui/atoms/lucide-icon";
import { SearchInput } from "@/components/ui/atoms/search-input";
import { Skeleton } from "@/components/ui/atoms/skeleton";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { BottomDrawer } from "@/components/ui/molecules/bottom-drawer";
import { useIsKeyboardVisible } from "@/hooks/use-is-keyboard-visible";
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
  query: string;
  onQueryChange: (query: string) => void;
  firstSelectedRemovable?: boolean;
  isFetchingUsers?: boolean;
  className?: string;
  initialHeightSize?: number;
  maxSelected?: number;
};

export const UserSelectInput = ({
  selectedUsers = [],
  selectableUsers,
  firstSelectedRemovable = true,
  onSelectedUsersChange,
  isFetchingUsers,
  query,
  initialHeightSize = 400,
  onQueryChange,
  maxSelected,
}: Props) => {
  const isKeyboardVisible = useIsKeyboardVisible();
  const height = useSharedValue(initialHeightSize);
  const totalHeightSize = initialHeightSize + 100;
  const [isOpen, setIsOpen] = useState(false);

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
    <>
      <Pressable
        onPress={() => setIsOpen(true)}
        className="flex-row items-center rounded border-2 border-border bg-background py-2"
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
                  <LucideIcon icon={X} size={10} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity
          onPress={() => setIsOpen(true)}
          className="mx-4 size-10 items-center justify-center rounded bg-muted-foreground/30 shadow"
        >
          <LucideIcon icon={Plus} color="white" size={16} />
        </TouchableOpacity>
      </Pressable>
      <BottomDrawer
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        height={totalHeightSize}
      >
        <Animated.View style={animatedStyle}>
          <View className="gap-4 px-6 pb-4 pt-6">
            <SearchInput autoFocus onChangeText={onQueryChange} />
            {!query && (
              <ThemedText className="text-muted-foreground/50">
                <FormattedMessage defaultMessage="Type to search." />
              </ThemedText>
            )}
            {query && isFetchingUsers && (
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Skeleton className="size-12 rounded-full" />
                  <Skeleton className="h-6 w-32" />
                </View>
                <Skeleton className="size-5" />
              </View>
            )}
            {query && !isFetchingUsers && !selectableUsers?.length && (
              <ThemedText className="text-muted-foreground/50">
                <FormattedMessage defaultMessage="No results, please change the search." />
              </ThemedText>
            )}
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="gap-6 px-6 pb-36 pt-2"
          >
            {selectableUsers?.map((user) => {
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
                      <LucideIcon icon={Lock} color="#22c55e" />
                    ) : (
                      <LucideIcon
                        icon={isSelected ? SquareCheck : Square}
                        color={isSelected ? "#22c55e" : undefined}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
          <ThemedView className="absolute bottom-0 h-32 w-full p-6">
            <Button onPress={() => setIsOpen(false)} intent="outline">
              <FormattedMessage defaultMessage="Done" />
            </Button>
          </ThemedView>
        </Animated.View>
      </BottomDrawer>
    </>
  );
};
