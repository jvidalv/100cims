import * as Application from "expo-application";
import { useRouter } from "expo-router";
import { Fragment } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";

import { Header } from "@/components/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import {
  ThemedText,
  ThemedView,
  Icon,
  IconSymbolName,
} from "@/components/ui/atoms";
import { useUserMe } from "@/domains/user/user.api";

export default function UserIndexScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const { data } = useUserMe();
  const items: {
    iconName: IconSymbolName;
    text: string;
    onPress: () => void;
  }[] = [
    {
      iconName: "person",
      text: "Me",
      onPress: () => router.push("/user/me"),
    },
    {
      iconName: "list.bullet",
      text: "Summits",
      onPress: () => false,
    },
    {
      iconName: "info.circle",
      text: "About 100cims",
      onPress: () => false,
    },
    {
      iconName: "rectangle.portrait.and.arrow.right",
      text: "Logout",
      onPress: () => {
        Alert.alert("Leaving 100cims", "Are you sure you want to logout?", [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Yes",
            style: "default",
            onPress: () => {
              logout();
              router.dismissAll();
            },
          },
        ]);
      },
    },
  ];

  return (
    <ThemedView className="flex-1">
      <Header />
      <ScrollView className="flex-1 px-6">
        <ThemedText className="mb-4 text-4xl font-bold">
          {data?.data?.message?.firstName}
        </ThemedText>
        <View className="mb-4 rounded-xl border-2 border-border">
          {items.map(({ iconName, text, onPress }, index) => (
            <Fragment key={text}>
              <TouchableOpacity
                onPress={onPress}
                className="justify-center p-4"
              >
                <View className="flex-row items-center gap-4">
                  <Icon name={iconName} />
                  <ThemedText className="text-xl font-semibold">
                    {text}
                  </ThemedText>
                  <View className="ml-auto opacity-25">
                    <Icon name="chevron.right" weight="semibold" size={16} />
                  </View>
                </View>
              </TouchableOpacity>
              {index + 1 !== items.length && (
                <View className="h-[2px] w-full bg-border" />
              )}
            </Fragment>
          ))}
        </View>
        <View>
          <ThemedText className="text-center text-muted-foreground">
            Version {Application.nativeApplicationVersion}
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}
