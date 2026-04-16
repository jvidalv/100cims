import { Link } from "expo-router";
import { ChevronRight, Mountain, Plus } from "lucide-react-native";
import { FormattedMessage } from "react-intl";
import { ScrollView, TouchableOpacity, View } from "react-native";

import {
  LucideIcon,
  Skeleton,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import { PersonRow, ScreenHeader } from "@/components/ui/molecules";
import { useUserPeople } from "@/domains/user/user.api";

export default function UserPeopleScreen() {
  const { data, isPending } = useUserPeople();

  return (
    <ThemedView className="flex-1">
      <ScreenHeader />
      <View className="mb-6 px-6">
        <ThemedText className="text-4xl font-bold">
          <FormattedMessage defaultMessage="My people" />
        </ThemedText>
      </View>
      <ScrollView contentContainerClassName="gap-3 px-6 pb-28">
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
        )}
      </ScrollView>
    </ThemedView>
  );
}
