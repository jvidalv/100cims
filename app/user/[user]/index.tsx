import { format } from "date-fns/format";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { analytics } from "@jvidalv/react-analytics";
import { FormattedMessage, useIntl } from "react-intl";
import { View, TouchableOpacity, Image, Share } from "react-native";

import { SummitCard } from "@/components/summit";
import { Icon, Skeleton, ThemedText } from "@/components/ui/atoms";
import { AvatarGroup } from "@/components/ui/molecules";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import {
  useAnyUserSummits,
  useUserMe,
  useUserOneGet,
  useUserProfile,
} from "@/domains/user/user.api";
import { getFullName } from "@/domains/user/user.utils";
import { getUrlDeeplink } from "@/lib/deeplink";

export default function UserScreen() {
  const intl = useIntl();
  const router = useRouter();
  const { data: me } = useUserMe();
  const { user: userId } = useLocalSearchParams<{ user: string }>();
  const { data: user } = useUserOneGet({ userId });
  const { data: userDetails } = useUserProfile({ userId });
  const { data: summits, isPending: isPendingSummits } = useAnyUserSummits({
    userId,
  });

  const isMe = me?.id === userId;

  const handleShare = async () => {
    analytics.action(`user-shared-started`, { id: userId });

    const messages = {
      en: `🏞️ Check out my profile on 100cims!\n💪\n\n${getUrlDeeplink(`user/${userId}`)}`,
      es: `🏞️ Mira mi perfil en 100cims!\n💪\n\n${getUrlDeeplink(`user/${userId}`)}`,
      ca: `🏞️ Mira el meu perfil a 100cims!\n💪\n\n${getUrlDeeplink(`user/${userId}`)}`,
    };

    const locale = intl.locale;
    const msg = messages[locale as "ca" | "es" | "en"] || messages.en;

    const response = await Share.share({
      message: msg,
    });

    // if (response.action === "sharedAction")
    //   analytics.action(`user-shared-done`, { id: userId });

    // if (response.action === "dismissedAction")
    //   analytics.action(`user-shared-canceled`, { id: userId });
  };

  return (
    <ParallaxScrollView
      title={user ? getFullName(user) : "..."}
      headerClassName="flex items-center justify-center bg-primary"
      contentClassName="py-6"
      parallaxRightElement={
        <View className="flex-row  items-end gap-4 opacity-80">
          {isMe && (
            <Link href="/user/me" asChild>
              <TouchableOpacity>
                <Icon
                  name="square.and.pencil"
                  color="white"
                  size={22}
                  animationSpec={{ effect: { type: "bounce" } }}
                />
              </TouchableOpacity>
            </Link>
          )}
          <TouchableOpacity onPress={handleShare}>
            <Icon
              name="square.and.arrow.up"
              color="white"
              size={24}
              animationSpec={{ effect: { type: "bounce" } }}
            />
          </TouchableOpacity>
        </View>
      }
      headerRightElement={
        <TouchableOpacity
          onPress={handleShare}
          className="flex-row items-center justify-end pb-3 pr-4"
        >
          <Icon
            name="square.and.arrow.up"
            color="white"
            animationSpec={{ effect: { type: "bounce" } }}
          />
        </TouchableOpacity>
      }
      headerImage={
        user?.imageUrl ? (
          <Image
            source={{ uri: user?.imageUrl }}
            style={{ flex: 1, width: "100%", resizeMode: "cover" }}
          />
        ) : (
          <View className="flex-1 bg-primary" />
        )
      }
    >
      {!!user ? (
        <View className="mx-6 mb-6 gap-3">
          {!!user.town && (
            <View className="flex-row gap-4">
              <View className="flex-row gap-2">
                <Icon name="house.circle" muted size={24} />
                <ThemedText className="text-xl font-medium">
                  {user?.town}
                </ThemedText>
              </View>
            </View>
          )}
          <View className="flex-row gap-2">
            <Icon name="calendar" muted size={24} />
            <ThemedText className="text-xl font-medium">
              <FormattedMessage
                defaultMessage="Joined on {date}"
                values={{
                  date: format(
                    new Date(user.createdAt as string | number),
                    "dd MMMM yyyy",
                  ),
                }}
              />
            </ThemedText>
          </View>
          {userDetails && !!userDetails?.sharedUsers?.length && (
            <>
              <View>
                <View className="mb-1 flex-row gap-2">
                  <Icon name="person.3.fill" muted size={24} />
                  <ThemedText className="text-xl font-medium">
                    <FormattedMessage defaultMessage="People" />
                  </ThemedText>
                </View>
                <View>
                  <AvatarGroup
                    size="sm"
                    items={userDetails.sharedUsers.map((person) => ({
                      name: getFullName(person),
                      imageUrl: person.imageUrl,
                      id: person.userId,
                    }))}
                    onPress={({ id }) => router.push(`/user/${id}`)}
                  />
                </View>
              </View>
            </>
          )}
        </View>
      ) : (
        <View className="mx-6 ">
          <Skeleton className="mb-6 h-24 w-full" />
        </View>
      )}
      <View className="relative flex-row items-center justify-between">
        <ThemedText className="mb-4 px-6 text-2xl font-semibold">
          <FormattedMessage defaultMessage="Summits" />
          <ThemedText className="font-medium text-muted-foreground">
            {"  "}
            {summits?.length}
          </ThemedText>
        </ThemedText>
      </View>
      <View className="flex flex-row flex-wrap px-6">
        {isPendingSummits && (
          <>
            <View className="w-1/2">
              <Skeleton
                className="w-full border-background mb-2"
                style={{ height: 243, borderRadius: 6 }}
              />
            </View>
            <View className="w-1/2 pl-1.5">
              <Skeleton
                className="w-full border-background mb-2"
                style={{ height: 243, borderRadius: 6 }}
              />
            </View>
            <View className="w-1/2">
              <Skeleton
                className="w-full border-background mb-2"
                style={{ height: 243, borderRadius: 6 }}
              />
            </View>
            <View className="w-1/2 pl-1.5">
              <Skeleton
                className="w-full border-background mb-2"
                style={{ height: 243, borderRadius: 6 }}
              />
            </View>
            <View className="w-1/2">
              <Skeleton
                className="w-full border-background mb-2"
                style={{ height: 243, borderRadius: 6 }}
              />
            </View>
            <View className="w-1/2 pl-1.5">
              <Skeleton
                className="w-full border-background mb-2"
                style={{ height: 243, borderRadius: 6 }}
              />
            </View>
            <View className="w-1/2">
              <Skeleton
                className="w-full border-background mb-2"
                style={{ height: 243, borderRadius: 6 }}
              />
            </View>
            <View className="w-1/2 pl-1.5">
              <Skeleton
                className="w-full border-background mb-2"
                style={{ height: 243, borderRadius: 6 }}
              />
            </View>
          </>
        )}
        {!summits?.length && !isPendingSummits && (
          <ThemedText className="text-muted-foreground">
            <FormattedMessage defaultMessage="No summits yet." />
          </ThemedText>
        )}
        {summits?.map((summit, index) => (
          <SummitCard
            key={summit.summitId}
            summit={summit}
            index={index}
            onPress={() =>
              router.push({
                pathname: "/user/summits/[summit]",
                params: { summit: summit.summitId },
              })
            }
            onParticipantPress={(userId) => router.push(`/user/${userId}`)}
          />
        ))}
      </View>
    </ParallaxScrollView>
  );
}
