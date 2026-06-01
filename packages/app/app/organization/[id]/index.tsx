import { Link, Redirect, useLocalSearchParams } from "expo-router";
import { Link as LinkIcon } from "lucide-react-native";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Linking,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";

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
import {
  ActionRow,
  ErrorState,
  ImagePreviewModal,
  PersonRow,
  useImagePreview,
} from "@/components/ui/molecules";
import ParallaxScrollView from "@/components/ui/organisms/parallax-scroll-view";
import { useOrganizationOneGet } from "@/domains/organization/organization.api";

// Split a list into `rows` parallel buckets in round-robin order so the
// resulting columns each hold `ceil(n/rows)` items. Drives the photo grid's
// "fill across, then down" layout: with 5 photos and 2 rows the columns are
// [[p0,p1],[p2,p3],[p4]], rendering as two rows that scroll horizontally
// together.
const chunkInto = <T,>(items: T[], rowsPerColumn: number): T[][] => {
  const columns: T[][] = [];
  for (let i = 0; i < items.length; i += rowsPerColumn) {
    columns.push(items.slice(i, i + rowsPerColumn));
  }
  return columns;
};

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
  const { previewImage, isPreviewOpen, openPreview, closePreview } =
    useImagePreview();
  const { width: windowWidth } = useWindowDimensions();

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
  // Translators see "Open Instagram", "Open TikTok", etc. — proper nouns
  // stay verbatim, but the verb is localised so VoiceOver/TalkBack reads
  // the button in the user's locale.
  const openLabel = (network: string) =>
    intl.formatMessage(
      { defaultMessage: "Open {network}" },
      { network },
    );
  // Networks section: website + each social. Each network keeps its own
  // colour-coded SVG (already self-rendering, hence `iconOverride`); the
  // ActionRow's circle background uses the muted intent so the icon — not
  // the chip — carries the brand colour. Filtered to only the platforms the
  // org actually filled in.
  const networks = organization
    ? [
        {
          key: "website",
          url: organization.websiteUrl,
          name: organization.websiteUrl
            ? organization.websiteUrl.replace(/^https?:\/\//, "")
            : null,
          renderIcon: () => <LucideIcon icon={LinkIcon} size={18} />,
          accessibility: intl.formatMessage({
            defaultMessage: "Open organization website",
          }),
        },
        {
          key: "instagram",
          url: organization.instagramUrl,
          name: "Instagram",
          renderIcon: () => <InstagramIcon size={20} />,
          accessibility: openLabel("Instagram"),
        },
        {
          key: "tiktok",
          url: organization.tiktokUrl,
          name: "TikTok",
          renderIcon: () => <TikTokIcon size={20} />,
          accessibility: openLabel("TikTok"),
        },
        {
          key: "whatsapp",
          url: organization.whatsappUrl,
          name: "WhatsApp",
          renderIcon: () => <WhatsAppIcon size={20} />,
          accessibility: openLabel("WhatsApp"),
        },
        {
          key: "youtube",
          url: organization.youtubeUrl,
          name: "YouTube",
          renderIcon: () => <YouTubeIcon size={20} />,
          accessibility: openLabel("YouTube"),
        },
        {
          key: "strava",
          url: organization.stravaUrl,
          name: "Strava",
          renderIcon: () => <StravaIcon size={20} />,
          accessibility: openLabel("Strava"),
        },
      ].filter((n) => !!n.url)
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
        <>
          {!!organization.description && (
            <View className="mx-6 mb-6">
              <ThemedText className="text-muted-foreground">
                {organization.description}
              </ThemedText>
            </View>
          )}
          {networks.length > 0 && (
            <View className="mb-6 gap-2 px-6">
              <ThemedText className="text-2xl font-semibold">
                <FormattedMessage defaultMessage="Networks" />
              </ThemedText>
              {networks.map((n) => (
                <ActionRow
                  key={n.key}
                  onPress={() => openUrl(n.url)}
                  icon={LinkIcon}
                  iconOverride={n.renderIcon()}
                  intent="foreground"
                  size="sm"
                  accessibilityLabel={n.accessibility}
                >
                  {n.name}
                </ActionRow>
              ))}
            </View>
          )}
        </>
      ) : (
        <View className="mx-6 mb-6 gap-3">
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

      {/*
       * Showcase gallery. Renders only when the org has at least one
       * photo (orgs without uploads keep the page bottom flush with the
       * Members section). Photos are laid out as two side-by-side rows
       * that scroll horizontally together — admins can upload up to 10,
       * so a single row would either need tiny thumbs or overflow with
       * an awkward scroll distance. Tap opens the existing image-preview
       * modal (pinch/zoom/double-tap to dismiss).
       */}
      {organization && organization.photoUrls.length > 0 && (
        <PhotoGallery
          urls={organization.photoUrls}
          windowWidth={windowWidth}
          onPress={(uri) => openPreview({ uri })}
          openLabel={intl.formatMessage({ defaultMessage: "Open photo" })}
        />
      )}

      <ImagePreviewModal
        visible={isPreviewOpen}
        imageSource={previewImage}
        onClose={closePreview}
      />
    </ParallaxScrollView>
  );
}

// Horizontal-scroll 2-row gallery whose tiles scale to fit the visible row
// when there's room. With ≤8 photos (≤4 columns at 2 rows per column) the
// grid sizes itself to the screen width and the row reads as a wall, not a
// strip with a half-empty trailing column. With 9–10 photos the tile width
// hits MIN_TILE and the gallery becomes horizontally scrollable. Tile is
// always square so the 2-row stack stays balanced.
const GALLERY_GAP = 8; // px — matches `gap-2` (Tailwind 2 = 8px)
const GALLERY_PAD = 24; // px on each side — matches `pl-6` / `pr-6`
const MIN_TILE = 110; // floor for big galleries; smaller becomes thumbnail-ish
const MAX_TILE = 200; // ceiling so single-photo galleries don't span the whole screen

function PhotoGallery({
  urls,
  windowWidth,
  onPress,
  openLabel,
}: {
  urls: string[];
  windowWidth: number;
  onPress: (uri: string) => void;
  openLabel: string;
}) {
  const columns = chunkInto(urls, 2);
  const columnCount = columns.length;
  // Available width = window minus left and right padding. Subtracting one
  // gap per column-gap (columnCount - 1) gives the raw pixels for tiles.
  const available =
    windowWidth - GALLERY_PAD * 2 - GALLERY_GAP * Math.max(0, columnCount - 1);
  const idealTile = Math.floor(available / columnCount);
  const tileSize = Math.min(MAX_TILE, Math.max(MIN_TILE, idealTile));
  return (
    <View className="mb-6 gap-3 pl-6">
      <ThemedText className="text-2xl font-semibold">
        <FormattedMessage defaultMessage="Photos" />
      </ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: GALLERY_GAP,
          paddingRight: GALLERY_PAD,
        }}
      >
        {columns.map((column, colIdx) => (
          <View key={colIdx} style={{ gap: GALLERY_GAP }}>
            {column.map((url) => (
              <Pressable
                key={url}
                onPress={() => onPress(url)}
                accessibilityRole="imagebutton"
                accessibilityLabel={openLabel}
              >
                <Image
                  source={{ uri: url, cache: "force-cache" }}
                  style={{ width: tileSize, height: tileSize }}
                  className="rounded-md bg-border"
                  resizeMode="cover"
                />
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
