import {
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Link } from "expo-router";
import { useRecommendedPeaks } from "@/domains/mountains/mountains.api";
import { BlurView } from "expo-blur";
import { Avatar, Icon } from "@/components/ui/atoms";
import { AvatarGroup } from "@/components/ui/molecules/avatar-group";
import { Fragment, useEffect } from "react";
import { Modal, MountainItemList } from "@/components/ui/molecules";
import { useQuery } from "@tanstack/react-query";
import { useApiWithAuth } from "@/hooks/use-api-with-auth";
import { useAuth } from "@/components/providers/auth-provider";
import { useUserMe } from "@/domains/user/user.api";

const latestSummits = [
  {
    mountain: "El tossal",
    date: "a few hours ago",
    users: [
      {
        name: "Josep Vidal",
        imageUrl:
          "https://media.licdn.com/dms/image/v2/D4E03AQFpQWS35rdxNg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1729674280775?e=1740009600&v=beta&t=qMlgUxWbIHz2XlEZ24GhsDWz9oDFSTxXCjVjoyqnkG8",
      },
      {
        name: "Ainé Garcia",
        imageUrl:
          "https://media.licdn.com/dms/image/v2/D4D03AQH9Xw8ywHmkcw/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1729705481301?e=1740009600&v=beta&t=Q_dUBQpNYRdKE7UVGD9gUpIzTVRdxptlDbgUGbVg5Fk",
      },
      {
        name: "Magda Vidal",
        imageUrl: "https://picsum.photos/id/1000/200",
      },
      {
        name: "Pepito Justo",
        imageUrl: "https://picsum.photos/id/250/200",
      },
    ],
  },
  {
    mountain: "La Mola de Prat",
    date: "2 days ago",
    users: [
      {
        name: "Ainé Garcia",
        imageUrl:
          "https://media.licdn.com/dms/image/v2/D4D03AQH9Xw8ywHmkcw/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1729705481301?e=1740009600&v=beta&t=Q_dUBQpNYRdKE7UVGD9gUpIzTVRdxptlDbgUGbVg5Fk",
      },
    ],
  },
  {
    mountain: "Puig Cavaller",
    date: "1 week ago",
    users: [
      {
        name: "Ainé Garcia",
        imageUrl:
          "https://media.licdn.com/dms/image/v2/D4D03AQH9Xw8ywHmkcw/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1729705481301?e=1740009600&v=beta&t=Q_dUBQpNYRdKE7UVGD9gUpIzTVRdxptlDbgUGbVg5Fk",
      },
      {
        name: "Josep Vidal",
        imageUrl:
          "https://media.licdn.com/dms/image/v2/D4E03AQFpQWS35rdxNg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1729674280775?e=1740009600&v=beta&t=qMlgUxWbIHz2XlEZ24GhsDWz9oDFSTxXCjVjoyqnkG8",
      },
    ],
  },
];

export default function TabIndexScreen() {
  const recommendedPeaks = useRecommendedPeaks();
  const { isAuthenticated } = useAuth();
  const { data } = useUserMe();
  const fullName = `${data?.data?.message.firstName} ${data?.data?.message?.lastName}`;

  return (
    <ThemedView>
      <BlurView className="absolute z-20 h-[7.5rem] justify-end pb-2 w-full px-6">
        <View className="flex-row items-center justify-between">
          <View />
          <Link href={isAuthenticated ? "/user" : "/join"}>
            <Avatar
              name={data ? fullName : ""}
              emoji={!isAuthenticated ? "🏔️" : undefined}
            />
          </Link>
        </View>
      </BlurView>
      <ScrollView className="px-6">
        <View className="h-36" />
        <View className="gap-2 mb-6">
          <View className="flex-row justify-between items-end">
            <View className="items-center flex-row">
              <ThemedText className="text-2xl font-bold">Score</ThemedText>
              <Modal
                Trigger={({ setOpen }) => (
                  <TouchableOpacity
                    onPress={() => setOpen((o) => !o)}
                    className="py-1.5 pl-1.5 pr-3"
                  >
                    <Icon name="info.circle" size={20} muted />
                  </TouchableOpacity>
                )}
              >
                <View>
                  <ThemedText className="text-2xl font-semibold mb-0">
                    About the score
                  </ThemedText>
                  <ThemedText className="text-lg leading-5 text-muted-foreground mb-3">
                    The score is based on the height of the completed peaks
                    mountains.
                  </ThemedText>
                  <ThemedText className="mb-4">
                    One mountain of 1000 meters ={" "}
                    <ThemedText className="text-accent">1000 points</ThemedText>
                    .
                  </ThemedText>
                  <View className="border border-border rounded-lg p-2 items-center flex-row gap-2">
                    <ThemedText>🔥</ThemedText>
                    <ThemedText>
                      <ThemedText className="text-primary font-medium">
                        Essentials{" "}
                      </ThemedText>
                      are worth x2. Summit them!
                    </ThemedText>
                  </View>
                </View>
              </Modal>
            </View>
            <Link href="/highscores" className="px-2 -mx-2">
              <View className="flex-row items-center gap-1">
                <ThemedText className="text-muted-foreground">
                  View highscores
                </ThemedText>
                <Icon name="arrow.forward" size={12} weight="bold" muted />
              </View>
            </Link>
          </View>
          <View className="flex-row gap-2">
            <ThemedText className="text-5xl font-black text-accent">
              31245
            </ThemedText>
            <View className="mt-3">
              <View className="items-center flex-row gap-1">
                <ThemedText className="font-bold text-xl">5</ThemedText>
                <ThemedText className="text-sm mt-0.5">peaks</ThemedText>
              </View>
            </View>
          </View>
        </View>
        <View className="gap-2 mb-6">
          <ThemedText className="text-2xl font-bold">Latest summits</ThemedText>
          <View className="border border-border rounded-xl">
            {latestSummits.map(({ mountain, date, users }, index, items) => {
              const firstName = users[0]?.name?.split(" ")?.[0];
              const firstNameSecond = users[1]?.name?.split(" ")?.[0];

              return (
                <Fragment key={mountain}>
                  <View className="p-4" key={mountain}>
                    <View className="mb-2">
                      <ThemedText className="font-black">
                        {mountain}
                        <ThemedText className="text-muted-foreground">
                          , by{" "}
                        </ThemedText>
                        <ThemedText className="font-medium">
                          {firstName}
                        </ThemedText>
                        {users.length >= 2 && (
                          <ThemedText className="font-medium">
                            {users.length === 2 ? (
                              <ThemedText className="text-muted-foreground">
                                {" "}
                                &
                              </ThemedText>
                            ) : (
                              ","
                            )}{" "}
                            {firstNameSecond}
                          </ThemedText>
                        )}
                        {users.length > 2 && (
                          <ThemedText className="text-muted-foreground">
                            {" "}
                            & {users.length - 2} more
                          </ThemedText>
                        )}
                      </ThemedText>
                    </View>
                    <View className="flex-row items-end justify-between gap-4">
                      <AvatarGroup items={users} />
                      <ThemedText className="">{date}</ThemedText>
                    </View>
                  </View>
                  {index !== items.length - 1 && (
                    <View className="h-[1px] bg-border" />
                  )}
                </Fragment>
              );
            })}
          </View>
        </View>
        <View className="gap-2 mb-4">
          <View className="flex-row justify-between items-end">
            <ThemedText className="text-2xl font-bold">
              Peaks for you
            </ThemedText>
            <View>
              <Link href="/mountains" className="px-2 -mx-2">
                <View className="flex-row items-center gap-1">
                  <ThemedText className="text-muted-foreground">
                    View all
                  </ThemedText>
                  <Icon name="arrow.forward" size={12} weight="bold" muted />
                </View>
              </Link>
            </View>
          </View>
        </View>
        <View className="gap-4">
          {recommendedPeaks?.map(
            ({ id, name, height, slug, imageUrl, essential, location }) => (
              <MountainItemList
                key={id}
                name={name}
                height={height}
                slug={slug}
                imageUrl={imageUrl}
                essential={essential}
                location={location}
              />
            ),
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}
