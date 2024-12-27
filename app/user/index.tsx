import {
  ThemedText,
  ThemedView,
  Icon,
  IconSymbolName,
} from "@/components/ui/atoms";
import { Header } from "@/components/navigation";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";
import * as Application from "expo-application";

import { Fragment } from "react";
import { useUserMe } from "@/domains/user/user.api";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "expo-router";

export default function UserScreen() {
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
      text: "Personal information",
      onPress: () => false,
    },
    {
      iconName: "mountain.2",
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
              router.replace("/");
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
        <ThemedText className="text-4xl font-bold mb-4">
          {data?.data?.message?.firstName}
        </ThemedText>
        <View className="rounded-lg border border-border mb-4">
          {items.map(({ iconName, text, onPress }, index) => (
            <Fragment key={text}>
              <TouchableOpacity
                onPress={onPress}
                className="justify-center p-4"
              >
                <View className="flex-row items-center gap-4">
                  <Icon name={iconName} />
                  <ThemedText className="text-xl">{text}</ThemedText>
                  <View className="ml-auto opacity-50">
                    <Icon name="chevron.right" weight="semibold" size={16} />
                  </View>
                </View>
              </TouchableOpacity>
              {index + 1 !== items.length && (
                <View className="h-[1px] w-full bg-border" />
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
