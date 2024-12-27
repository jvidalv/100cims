import { ThemedView, ThemedText, Icon, Button } from "@/components/ui/atoms";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useMountains } from "@/domains/mountains/mountains.api";
import { Image } from "expo-image";
import { TouchableOpacity, View } from "react-native";
import * as Linking from "expo-linking";
import { Fragment } from "react";
import { AvatarGroup } from "@/components/ui/molecules";
import { BlurView } from "expo-blur";

const latestSummits = [
  {
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
    date: "a few hours ago",
    users: [
      {
        name: "Ainé Garcia",
        imageUrl:
          "https://media.licdn.com/dms/image/v2/D4D03AQH9Xw8ywHmkcw/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1729705481301?e=1740009600&v=beta&t=Q_dUBQpNYRdKE7UVGD9gUpIzTVRdxptlDbgUGbVg5Fk",
      },
    ],
  },
  {
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
  {
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
  {
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
  {
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

export default function MountainScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const { data: mountains } = useMountains();

  const mountain = mountains?.data?.message?.find(
    (mountain) => slug === mountain.slug,
  );

  if (!mountain) {
    return null;
  }

  return (
    <Fragment>
      <ParallaxScrollView
        title={mountain.name}
        headerClassName="flex items-center justify-center bg-primary"
        headerImage={
          <Image
            source={mountain.imageUrl}
            placeholder={{ blurhash: `L~I64nWEWXaz_NWEWWazbvWBaxfQ` }}
            style={{ flex: 1, width: "100%" }}
            contentFit="cover"
            contentPosition="center"
            transition={500}
          />
        }
      >
        {mountain.essential && (
          <View className="rounded-xl mx-6 mt-6 -mb-4">
            <ThemedText className="text-xl text-white font-bold text-primary">
              Essential
            </ThemedText>
          </View>
        )}
        <View className="mt-6 grid flex-row gap-4 px-6 mb-6">
          <View>
            <ThemedText className="text-lg font-medium text-muted-foreground">
              Height
            </ThemedText>
            <ThemedText className="text-xl font-bold -mt-0.5">
              {mountain.height}m
            </ThemedText>
          </View>
          <TouchableOpacity
            className="flex-1"
            onPress={() =>
              Linking.openURL(
                `https://www.google.es/maps?q=${mountain.latitude},${mountain.longitude}`,
              )
            }
          >
            <ThemedText className="text-lg font-medium text-muted-foreground">
              Location
            </ThemedText>
            <View className="-mt-0.5 items-center flex-row gap-1">
              <ThemedText className="text-xl font-bold flex-wrap">
                {mountain.location}
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() =>
            Linking.openURL(
              `https://es.wikiloc.com/wikiloc/map.do?q=100cims ${mountain.name}&fitMapToTrails=1&page=1`,
            )
          }
          className="mx-6 mb-6 border border-border rounded-xl p-4 flex-row items-center justify-between"
        >
          <View className="flex-row gap-3 items-center">
            <Image
              source={require("@/assets/images/wikilog.png")}
              style={{ width: 20, height: 20 }}
            />
            <ThemedText className="text-xl font-medium">
              Best trails on{" "}
              <ThemedText
                className="font-semibold"
                style={{ color: "#4b8c2a" }}
              >
                wikiloc
              </ThemedText>
            </ThemedText>
          </View>
          <Icon name="arrow.right" muted size={20} />
        </TouchableOpacity>
        <View className="gap-2 mb-32 mx-6">
          <ThemedText className="text-2xl font-semibold">Summits</ThemedText>
          <View className="border border-border rounded-xl">
            {latestSummits.map(({ date, users }, index, items) => {
              const firstName = users[0]?.name?.split(" ")?.[0];
              const firstNameSecond = users[1]?.name?.split(" ")?.[0];

              return (
                <Fragment key={index}>
                  <View className="p-4">
                    <View className="flex-row items-end justify-between gap-4">
                      <View>
                        <ThemedText className="font-black">
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
                      <ThemedText className="text-muted-foreground">
                        {date}
                      </ThemedText>
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
      </ParallaxScrollView>
      <BlurView className="absolute px-6 pt-4 pb-12 bottom-0 rounded-xl w-full">
        <View className="mb-4 flex-row justify-center items-center gap-2">
          <ThemedText className="text-emerald-500 font-semibold text-lg">
            You summited this mountain
          </ThemedText>
          <Icon
            name="checkmark.seal.fill"
            color="#10b981"
            weight="bold"
            size={20}
            animationSpec={{ effect: { type: "bounce" } }}
          />
        </View>
        <Link
          href={{ pathname: "/mountain/[slug]/summit", params: { slug } }}
          asChild
        >
          <Button intent="accent">Mark as summited</Button>
        </Link>
      </BlurView>
    </Fragment>
  );
}
