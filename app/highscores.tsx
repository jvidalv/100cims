import {
  ThemedView,
  ThemedText,
  SearchInput,
  Avatar,
} from "@/components/ui/atoms";
import { useMountains } from "@/domains/mountains/mountains.api";
import { Header } from "@/components/navigation";
import { FlatList, ScrollView, TouchableOpacity, View } from "react-native";
import { MountainItemList } from "@/components/ui/molecules";
import { useEffect, useMemo, useRef, useState } from "react";
import { cleanText } from "@/lib";
import clsx from "clsx";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from "react-native-reanimated";

const dummyData = [
  {
    id: 1,
    name: "Ainé Fernandez",
    score: 9321,
    peaks: 5,
    image_url:
      "https://media.licdn.com/dms/image/v2/D4D03AQH9Xw8ywHmkcw/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1729705481301?e=1740009600&v=beta&t=Q_dUBQpNYRdKE7UVGD9gUpIzTVRdxptlDbgUGbVg5Fk",
  },
  {
    id: 2,
    name: "Josep Vidal",
    score: 3211,
    peaks: 3,
    image_url:
      "https://media.licdn.com/dms/image/v2/D4E03AQFpQWS35rdxNg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1729674280775?e=1740009600&v=beta&t=qMlgUxWbIHz2XlEZ24GhsDWz9oDFSTxXCjVjoyqnkG8",
  },
  {
    id: 3,
    name: "Pepito Vidal",
    score: 2211,
    peaks: 2,
    image_url:
      "https://media.licdn.com/dms/image/v2/D5603AQHy_w-CECDFVA/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1694731324670?e=1740009600&v=beta&t=_qaxV7Yc0o5zb0__wTPHpDVZp9-f3531cEmjD2PQID8",
  },
  {
    id: 4,
    name: "Catacrok Peritopalotes",
    score: 1211,
    peaks: 1,
    image_url:
      "https://media.licdn.com/dms/image/v2/D4D03AQE-25bUz9Up5A/profile-displayphoto-shrink_100_100/profile-displayphoto-shrink_100_100/0/1732600695414?e=1740009600&v=beta&t=Lb0tPMg1oiZtV3ueftZ-5InLPSlE01HP1Klo8xlXVI8",
  },
  {
    id: 5,
    name: "Margarita Robles Engineering",
    score: 900,
    peaks: 2,
    image_url: "https://picsum.photos/id/1/200",
  },
  {
    id: 6,
    name: "Roberto del Bosque Marichalar",
    score: 700,
    peaks: 1,
    image_url: "https://picsum.photos/id/4/200",
  },
  {
    id: 7,
    name: "Usuario Sin Cimas",
    score: 0,
    peaks: 0,
    image_url: "https://picsum.photos/id/7/200",
  },
  {
    id: 8,
    name: "Usuario Sin Cimas 2",
    score: 0,
    peaks: 0,
    image_url: "https://picsum.photos/id/10/200",
  },
  {
    id: -2,
    name: "Usuario Sin Cimas 3",
    score: 0,
    peaks: 0,
    image_url: "https://picsum.photos/id/12/200",
  },
  {
    id: 9,
    name: "Usuario Sin Cimas 4",
    score: 0,
    peaks: 0,
    image_url: "https://picsum.photos/id/14/200",
  },
  {
    id: 10,
    name: "Usuario Sin Cimas 5",
    score: 0,
    peaks: 0,
    image_url: "https://picsum.photos/id/16/200",
  },
  {
    id: 11,
    name: "Usuario Sin Cimas 6",
    score: 0,
    peaks: 0,
    image_url: "https://picsum.photos/id/17/200",
  },
  {
    id: 12,
    name: "Usuario Sin Cimas 7",
    score: 0,
    peaks: 0,
    image_url: "https://picsum.photos/id/18/200",
  },
];

export default function HighscoresScreen() {
  const scrollY = useSharedValue(0);
  const mounted = useSharedValue(-100); // Initial position for entry animation

  // Trigger entry animation on mount
  useEffect(() => {
    setTimeout(() => {
      mounted.value = withSpring(0, { damping: 5, stiffness: 80 });
    }, 125);
  }, []);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(scrollY.value > 50 ? 0 : 1),
      transform: [
        {
          translateY:
            scrollY.value > 50
              ? withTiming(-100, { duration: 300 }) // Smooth disappearance
              : withSpring(5, { damping: 5, stiffness: 80 }), // Bounce effect on return
        },
        {
          translateY: mounted.value, // Entry animation from the top
        },
        {
          rotate: "320deg",
        },
      ],
    };
  });

  return (
    <ThemedView className="flex-1">
      <Header />
      <View>
        <Animated.FlatList
          data={dummyData}
          onScroll={onScroll}
          initialNumToRender={25}
          stickyHeaderIndices={[0]}
          ListHeaderComponent={
            <ThemedView className="pb-2 px-6">
              <ThemedText className="text-4xl font-bold mb-2">
                Highscores
              </ThemedText>
            </ThemedView>
          }
          scrollEventThrottle={16}
          ListFooterComponent={<View className="h-32" />}
          keyExtractor={({ id }) => `${id}`}
          renderItem={({ index, item: { name, score, image_url } }) => {
            return (
              <View className="px-6 mb-1" style={{ zIndex: 1000 - index }}>
                <ThemedView className="relative border rounded-xl border-border p-4">
                  <ThemedView className="absolute items-center justify-center top-6 -left-4 w-6 h-6 border border-border rounded-full z-10">
                    <ThemedText className="font-semibold">
                      {index + 1}
                    </ThemedText>
                  </ThemedView>
                  <View className="absolute top-10 -left-4">
                    {index === 0 && (
                      <ThemedText className="text-xl">🥇</ThemedText>
                    )}
                    {index === 1 && (
                      <ThemedText className="text-xl">🥈</ThemedText>
                    )}
                    {index === 2 && (
                      <ThemedText className="text-xl">🥉</ThemedText>
                    )}
                  </View>
                  <View className="flex-row items-center justify-between gap-4">
                    <View className="relative flex-row gap-2 items-center flex-1">
                      <Avatar size="sm" name={name} imageUrl={image_url} />
                      <ThemedText
                        className="font-semibold text-lg flex-1"
                        numberOfLines={1}
                      >
                        {name}
                      </ThemedText>
                    </View>
                    <View>
                      <ThemedText className="text-2xl text-accent font-semibold">
                        {score}
                      </ThemedText>
                    </View>
                  </View>
                </ThemedView>
              </View>
            );
          }}
        />
      </View>
      <Animated.View className="absolute right-8 top-14" style={animatedStyle}>
        <ThemedText style={{ fontSize: 70 }}>🏆</ThemedText>
      </Animated.View>
    </ThemedView>
  );
}
