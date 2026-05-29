import { Link, Redirect, useLocalSearchParams } from "expo-router";
import { Link as LinkIcon } from "lucide-react-native";
import { FormattedMessage, useIntl } from "react-intl";
import { Linking, TouchableOpacity, View } from "react-native";

import { useAuth } from "@/components/providers/auth-provider";
import {
  ActivityIndicator,
  LucideIcon,
  Skeleton,
  ThemedText,
} from "@/components/ui/atoms";
import { Image } from "@/components/ui/atoms/image";
import { PersonRow } from "@/components/ui/molecules";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import { useOrganizationOneGet } from "@/domains/organization/organization.api";

export default function OrganizationScreen() {
  const intl = useIntl();
  const { isAuthenticated } = useAuth();
  // useGlobalSearchParams lies about type during NativeTabs' eager-mount
  // window — treat it as possibly-undefined; the enabled-guard inside the
  // hook is the real safety net. See `feedback_react_query_enabled_guards`.
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: organization, isPending } = useOrganizationOneGet({ id });

  if (!isAuthenticated) {
    return <Redirect href="/join" />;
  }

  const handleOpenWebsite = async () => {
    const url = organization?.websiteUrl;
    if (!url) return;
    // `canOpenURL` rejects malformed URLs cleanly. Without this, Android
    // returns a rejected promise from `openURL` with no ACTION_VIEW
    // handler — fires an unhandled-rejection warning the first time an
    // admin pastes a non-URL into the org form.
    const canOpen = await Linking.canOpenURL(url).catch(() => false);
    if (canOpen) {
      void Linking.openURL(url);
    }
  };

  return (
    <ParallaxScrollView
      title={organization?.name ?? "..."}
      headerClassName="flex items-center justify-center bg-primary"
      contentClassName="py-6"
      headerImage={
        organization?.imageUrl ? (
          <Image
            source={{ uri: organization.imageUrl }}
            style={{ flex: 1, width: "100%", resizeMode: "cover" }}
          />
        ) : (
          <View className="flex-1 bg-primary" />
        )
      }
    >
      {organization ? (
        <View className="mx-6 mb-6 gap-3">
          {!!organization.websiteUrl && (
            <TouchableOpacity
              onPress={handleOpenWebsite}
              className="flex-row items-center gap-2"
              accessibilityLabel={intl.formatMessage({
                defaultMessage: "Open organization website",
              })}
            >
              <View className="size-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                <LucideIcon icon={LinkIcon} size={16} />
              </View>
              <ThemedText className="text-primary" numberOfLines={1}>
                {organization.websiteUrl}
              </ThemedText>
            </TouchableOpacity>
          )}
          {!!organization.description && (
            <ThemedText className="text-muted-foreground">
              {organization.description}
            </ThemedText>
          )}
        </View>
      ) : (
        <View className="mx-6 mb-6 gap-3">
          <View className="flex-row items-center gap-2">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-5 w-48" />
          </View>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-2/3" />
        </View>
      )}

      <View className="mb-6 gap-2 px-6">
        <ThemedText className="text-2xl font-semibold">
          <FormattedMessage defaultMessage="Members" />
          {organization && (
            <ThemedText className="font-medium text-muted-foreground">
              {"  "}
              {organization.members.length}
            </ThemedText>
          )}
        </ThemedText>
        {isPending && !organization && (
          <View className="py-4">
            <ActivityIndicator />
          </View>
        )}
        {organization && organization.members.length === 0 && (
          <ThemedText className="text-muted-foreground">
            <FormattedMessage defaultMessage="No members yet." />
          </ThemedText>
        )}
        {organization?.members.map((member) => (
          <Link
            key={member.id}
            href={{ pathname: "/user/[user]", params: { user: member.id } }}
            asChild
          >
            <PersonRow
              person={{
                firstName: member.firstName,
                lastName: member.lastName,
                imageUrl: member.imageUrl,
              }}
              avatarSize="xs"
            />
          </Link>
        ))}
      </View>
    </ParallaxScrollView>
  );
}
