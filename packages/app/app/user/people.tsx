import { Link } from "expo-router";
import { ChevronRight, Mountain, Plus, Share2 } from "lucide-react-native";
import { FormattedMessage, useIntl } from "react-intl";
import { Share, ScrollView, TouchableOpacity, View } from "react-native";

import {
  LucideIcon,
  Skeleton,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import {
  BLURRED_SCREEN_HEADER_HEIGHT,
  BlurredScreenHeader,
  PersonRow,
} from "@/components/ui/molecules";
import { useUnlockableUnlock, useUserPeople } from "@/domains/user/user.api";
import { SITE_URL } from "@/lib/app-links";

export default function UserPeopleScreen() {
  const intl = useIntl();
  const { data, isPending } = useUserPeople();
  const { mutate: unlock } = useUnlockableUnlock();

  const handleShareApp = async () => {
    const result = await Share.share({
      message: intl.formatMessage(
        { defaultMessage: "Check out Cims! {url}" },
        { url: `${SITE_URL}/share` },
      ),
    });
    if (result.action === "sharedAction") {
      unlock("share");
    }
  };

  return (
    <ThemedView className="flex-1">
      <BlurredScreenHeader>
        <ThemedText numberOfLines={1} className="text-lg font-medium">
          <FormattedMessage defaultMessage="My people" />
        </ThemedText>
      </BlurredScreenHeader>
      <ScrollView
        contentContainerStyle={{
          paddingTop: BLURRED_SCREEN_HEADER_HEIGHT,
          paddingHorizontal: 24,
          paddingBottom: 112,
          gap: 12,
        }}
      >
        {isPending && (
          <>
            {Array.from({ length: 8 }).map((_, i) => (
              <View key={i} className="flex-row items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="h-5 w-40" />
              </View>
            ))}
          </>
        )}
        {!isPending && !data?.length && (
          <View className="mt-auto rounded border-2 border-border p-4">
            <ThemedText className="mb-1 font-semibold">
              <FormattedMessage defaultMessage="No people yet" />
            </ThemedText>
            <ThemedText className="text-muted-foreground">
              <FormattedMessage defaultMessage="When you summit with other cims users, they'll appear here." />
            </ThemedText>
          </View>
        )}
        {data?.map((person) => (
          <Link
            key={person.userId}
            href={{
              pathname: "/user/[user]",
              params: { user: person.userId },
            }}
            asChild
          >
            <PersonRow
              person={person}
              trailing={
                person.sharedSummitCount > 0 ? (
                  <View className="flex-row items-center gap-1">
                    <ThemedText className="text-base text-muted-foreground">
                      <FormattedMessage
                        defaultMessage="{count} cims"
                        values={{ count: person.sharedSummitCount }}
                      />
                    </ThemedText>
                    <LucideIcon icon={Mountain} size={14} muted />
                  </View>
                ) : undefined
              }
            />
          </Link>
        ))}
        {!isPending && (
          <>
            <Link href="/user/people/add" asChild>
              <TouchableOpacity className="flex-row items-center gap-3">
                <View className="size-12 items-center justify-center rounded-full border-2 border-muted-foreground/50">
                  <LucideIcon icon={Plus} size={22} muted />
                </View>
                <ThemedText className="text-lg font-medium">
                  <FormattedMessage defaultMessage="Add people" />
                </ThemedText>
                <View className="ml-auto">
                  <LucideIcon icon={ChevronRight} size={20} muted />
                </View>
              </TouchableOpacity>
            </Link>
            <TouchableOpacity
              className="flex-row items-center gap-3"
              onPress={handleShareApp}
            >
              <View className="size-12 items-center justify-center rounded-full border-2 border-primary">
                <LucideIcon icon={Share2} size={20} primary />
              </View>
              <ThemedText className="text-lg font-medium text-primary">
                <FormattedMessage defaultMessage="Share with a friend" />
              </ThemedText>
              <View className="ml-auto">
                <LucideIcon icon={ChevronRight} size={20} primary />
              </View>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}
