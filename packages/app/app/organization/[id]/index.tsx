import { Link, Redirect, useLocalSearchParams } from "expo-router";
import { Link as LinkIcon } from "lucide-react-native";
import { FormattedMessage, useIntl } from "react-intl";
import { Linking, TouchableOpacity, View } from "react-native";

import { useAuth } from "@/components/providers/auth-provider";
import {
  ActivityIndicator,
  InstagramIcon,
  LucideIcon,
  Skeleton,
  StravaIcon,
  ThemedText,
  TikTokIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from "@/components/ui/atoms";
import { Image } from "@/components/ui/atoms/image";
import { ErrorState, PersonRow } from "@/components/ui/molecules";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import { useOrganizationOneGet } from "@/domains/organization/organization.api";

export default function OrganizationScreen() {
  const intl = useIntl();
  const { isAuthenticated } = useAuth();
  // useGlobalSearchParams lies about type during NativeTabs' eager-mount
  // window — treat it as possibly-undefined; the enabled-guard inside the
  // hook is the real safety net. See `feedback_react_query_enabled_guards`.
  const { id } = useLocalSearchParams<{ id?: string }>();
  const {
    data: organization,
    isPending,
    isError,
    error,
    refetch,
  } = useOrganizationOneGet({ id });

  if (!isAuthenticated) {
    return <Redirect href="/join" />;
  }

  // Without this, a deep-link to a deleted or non-existent org id leaves the
  // screen on the skeleton forever (isPending flips false on a 404 but
  // `organization` stays undefined).
  if (isError) {
    return (
      <ErrorState context="organization" error={error} onReload={refetch} />
    );
  }

  const openUrl = async (url: string | null | undefined) => {
    if (!url) return;
    // Admins paste `instagram.com/foo` or `wa.me/...` without a scheme more
    // often than they remember `https://`. Prefix one if missing so
    // `canOpenURL` doesn't bounce the tap silently.
    const normalized = /^[a-z]+:\/\//i.test(url) ? url : `https://${url}`;
    // `canOpenURL` rejects malformed URLs cleanly. Without this, Android
    // returns a rejected promise from `openURL` with no ACTION_VIEW
    // handler — fires an unhandled-rejection warning the first time an
    // admin pastes a non-URL into the org form.
    const canOpen = await Linking.canOpenURL(normalized).catch(() => false);
    if (canOpen) {
      void Linking.openURL(normalized);
    }
  };
  const handleOpenWebsite = () => openUrl(organization?.websiteUrl);

  // Translators see "Open Instagram", "Open TikTok", etc. — proper nouns
  // stay verbatim, but the verb is localised so VoiceOver/TalkBack reads
  // the button in the user's locale.
  const openLabel = (network: string) =>
    intl.formatMessage(
      { defaultMessage: "Open {network}" },
      { network },
    );
  const socials = organization
    ? [
        {
          url: organization.instagramUrl,
          Icon: InstagramIcon,
          label: openLabel("Instagram"),
        },
        {
          url: organization.tiktokUrl,
          Icon: TikTokIcon,
          label: openLabel("TikTok"),
        },
        {
          url: organization.whatsappUrl,
          Icon: WhatsAppIcon,
          label: openLabel("WhatsApp"),
        },
        {
          url: organization.youtubeUrl,
          Icon: YouTubeIcon,
          label: openLabel("YouTube"),
        },
        {
          url: organization.stravaUrl,
          Icon: StravaIcon,
          label: openLabel("Strava"),
        },
      ].filter((s) => !!s.url)
    : [];

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
          {socials.length > 0 && (
            <View className="mt-2 flex-row items-center gap-5">
              {socials.map(({ url, Icon, label }) => (
                <TouchableOpacity
                  key={label}
                  onPress={() => openUrl(url)}
                  accessibilityLabel={label}
                  hitSlop={8}
                >
                  <Icon size={28} />
                </TouchableOpacity>
              ))}
            </View>
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
