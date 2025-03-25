import { format } from "date-fns/format";
import { Link, Redirect } from "expo-router";
import { analytics } from "expofast-analytics";
import { FormattedMessage, useIntl } from "react-intl";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";
import { twMerge } from "tailwind-merge";

import {
  ThemedText,
  ThemedKeyboardAvoidingView,
  Avatar,
  Skeleton,
  Icon,
} from "@/components/ui/atoms";
import { ScreenHeader } from "@/components/ui/molecules";
import { useUserMe, useUserSummits } from "@/domains/user/user.api";
import { useApiWithAuth } from "@/hooks/use-api-with-auth";

export default function UserSummitsScreen() {
  const intl = useIntl();
  const api = useApiWithAuth();
  const { data: me } = useUserMe();

  const {
    data: userSummits,
    isPending: isPendingUserSummits,
    refetch: refetchSummits,
  } = useUserSummits();

  const onDelete = (summitId: string) => {
    Alert.alert(
      intl.formatMessage({ defaultMessage: "Deleting summit" }),
      intl.formatMessage({
        defaultMessage: "Are you sure you want to continue?",
      }),
      [
        {
          text: intl.formatMessage({ defaultMessage: "Cancel" }),
          style: "cancel",
        },
        {
          text: intl.formatMessage({ defaultMessage: "Yes" }),
          style: "default",
          onPress: async () => {
            analytics.action("delete-summit", { summitId });
            await api.protected.summit.delete.post({ summitId });
            void refetchSummits();
          },
        },
      ],
    );
  };

  if (!me) {
    return <Redirect href="/join" />;
  }

  return (
    <ThemedKeyboardAvoidingView>
      <ScreenHeader />
      <ScrollView className="flex-1 px-6">
        <ThemedText className="mb-4 text-4xl font-bold">
          <FormattedMessage defaultMessage="My summits" />{" "}
          <ThemedText className="text-lg font-semibold text-muted-foreground">
            {userSummits?.summits?.length}
          </ThemedText>
        </ThemedText>
        <View className="gap-4">
          {isPendingUserSummits && !userSummits?.summits?.length && (
            <View className="flex-row items-center justify-between">
              <View className="flex-row gap-2">
                <Skeleton className="size-10 rounded-full" />
                <View className="gap-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </View>
              </View>
              <Skeleton className="h-4 w-20" />
            </View>
          )}
          {userSummits?.summits?.map(
            ({
              summitId,
              mountainName,
              summitedAt,
              summitedValidated,
              score,
              mountainImageUrl,
              mountainEssential,
            }) => {
              return (
                <View className="flex-row items-center gap-4" key={summitId}>
                  <Link
                    href={{
                      pathname: "/user/summits/[summit]",
                      params: { summit: summitId },
                    }}
                    asChild
                  >
                    <TouchableOpacity className="flex-1 flex-row gap-2">
                      <Avatar size="sm" imageUrl={mountainImageUrl} />
                      <View className="flex-1">
                        <ThemedText
                          className="flex-1 font-medium"
                          numberOfLines={1}
                        >
                          {mountainName}
                        </ThemedText>
                        <View className="flex-row items-center gap-2">
                          <View
                            className={twMerge(
                              "size-3 rounded-full",
                              mountainEssential
                                ? "bg-primary"
                                : "bg-muted-foreground/50",
                            )}
                          />
                          <ThemedText className="text-sm text-muted-foreground">
                            {format(summitedAt, "dd MMM yyyy")}
                          </ThemedText>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Link>
                  <View className="ml-auto flex-row items-center gap-3">
                    <ThemedText
                      className={twMerge(
                        "font-medium text-muted-foreground",
                        summitedValidated && "text-primary",
                      )}
                    >
                      +{score}
                    </ThemedText>
                    <TouchableOpacity onPress={() => onDelete(summitId)}>
                      <Icon name="trash" muted size={16} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            },
          )}
        </View>
      </ScrollView>
    </ThemedKeyboardAvoidingView>
  );
}
