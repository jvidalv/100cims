import { Link } from "expo-router";
import {
  ArrowUp,
  Bookmark,
  BookmarkCheck,
  CircleDot,
  Eye,
  Map as MapIcon,
  MessageCircle,
  Mountain as MountainIcon,
  Share as ShareIcon,
  Trophy,
  X,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Alert,
  Image,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { twMerge } from "tailwind-merge";

import { BlurView, LucideIcon, ThemedText } from "@/components/ui/atoms";
import { ActionRow } from "@/components/ui/molecules/action-row";
import { useMountainOne } from "@/domains/mountain/mountain.api";
import { useTopMountainComments } from "@/domains/mountain-comments/mountain-comments.api";
import {
  useIsMountainSaved,
  useSavedAddMutation,
  useSavedRemoveMutation,
} from "@/domains/saved/saved.api";
import { useUserChallengeSummits } from "@/domains/user/user.api";
import { shareDeeplink } from "@/lib/share";

interface MountainPreview {
  /** Slug is the only thing the marker tap reliably gives us — everything
   *  else is fetched via `useMountainOne` so the card always shows fresh
   *  data even if the GeoJSON marker properties drift. */
  slug: string;
  /** Best-effort properties cached from the marker tap. Used to render the
   *  card immediately while `useMountainOne` resolves. */
  fallback?: {
    name: string;
    height: string;
    location: string;
    imageUrl: string | null;
    essential: boolean;
    isSummited: boolean;
  };
}

interface Props {
  preview: MountainPreview | null;
  onClose: () => void;
}

/**
 * Compact floating mountain preview shown when the user taps a marker on the
 * mountains map. Anchored bottom-center over the map, above the native tab
 * bar. Replaces the previous bottom-drawer pattern with a non-blocking
 * translucent card.
 *
 * Renders a 16:9 hero image, condensed details, status pills, and two
 * action rows (primary actions + sub-page links). Dismissed by tapping the
 * close button or outside the card.
 */
export const MountainPreviewCard = ({ preview, onClose }: Props) => {
  const intl = useIntl();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  // BlurView's `tint` decides whether the frosted backdrop reads as dark
  // (light text on top) or light (dark text). Locking it to "dark" makes
  // muted-foreground text disappear in light mode; follow the theme so the
  // text colors that ThemedText already picks for the scheme stay readable.
  const blurTint = colorScheme === "dark" ? "dark" : "light";

  const slug = preview?.slug;
  const fallback = preview?.fallback;

  // `useMountainOne` will return cached data instantly if the user has
  // already visited the detail page for this mountain. Otherwise we render
  // off the marker fallback and live-replace fields as the query resolves.
  const { data: mountain } = useMountainOne({
    mountainSlug: slug ?? "",
  });

  if (!preview || !slug) return null;

  // Resolved fields with fallback. The fetched mountain wins; fallback fills
  // in until the query resolves.
  const name = mountain?.name ?? fallback?.name ?? "";
  const height = mountain?.height ?? fallback?.height ?? "";
  const location = mountain?.location ?? fallback?.location ?? "";
  const imageUrl = mountain?.imageUrl ?? fallback?.imageUrl ?? null;
  const essential = mountain?.essential ?? fallback?.essential ?? false;
  const mountainId = mountain?.id;

  return (
    // No dim/backdrop layer: leaving the map clickable means tapping
    // another marker swaps the card's contents (the marker tap fires
    // `setPreview(...)` on the parent), and tapping empty map doesn't
    // close — that's intentional. Dismissal is explicit via the X.
    <View
      pointerEvents="box-none"
      style={[
        styles.cardWrapper,
        { bottom: insets.bottom + 8 },
      ]}
    >
      <BlurView
        intensity={60}
        tint={blurTint}
        style={styles.card}
        className="overflow-hidden rounded-2xl border border-border/40"
      >
        <CardContents
          slug={slug}
          mountainId={mountainId}
          name={name}
          height={height}
          location={location}
          imageUrl={imageUrl}
          essential={essential}
          latitude={mountain?.latitude ?? null}
          longitude={mountain?.longitude ?? null}
          onClose={onClose}
          intlLocale={intl.locale}
        />
      </BlurView>
    </View>
  );
};

const CardContents = ({
  slug,
  mountainId,
  name,
  height,
  location,
  imageUrl,
  essential,
  latitude,
  longitude,
  onClose,
  intlLocale,
}: {
  slug: string;
  mountainId: string | undefined;
  name: string;
  height: string;
  location: string;
  imageUrl: string | null;
  essential: boolean;
  latitude: string | null;
  longitude: string | null;
  onClose: () => void;
  intlLocale: string;
}) => {
  const intl = useIntl();
  const isSaved = useIsMountainSaved(mountainId);
  const { mutate: addSaved, isPending: isAdding } = useSavedAddMutation();
  const { mutate: removeSaved, isPending: isRemoving } =
    useSavedRemoveMutation();

  // Top comments query fetches the same shape the detail page uses, so the
  // cache stays warm. `items` is just the top-N preview; `total` is the
  // full count we want to surface in the action row.
  const { data: comments } = useTopMountainComments(mountainId);
  const commentsCount = comments?.total ?? 0;
  // Whether the viewer has already summited this mountain — drives the
  // wording of the Summit action row ("Mark as summited" vs "again").
  const { data: userSummits } = useUserChallengeSummits();
  const hasSummited =
    userSummits?.summits.some((s) => s.mountainSlug === slug) ?? false;

  const handleShare = () => {
    void shareDeeplink({
      intl,
      path: `mountain/${slug}`,
      messages: {
        en: `Check out ${name} on Cims!`,
        es: `¡Mira ${name} en Cims!`,
        ca: `Mira ${name} a Cims!`,
      },
    });
  };

  const handleToggleSave = () => {
    if (!mountainId) return;
    if (isSaved) {
      removeSaved({ mountainId });
    } else {
      addSaved({ mountainId });
    }
  };

  const handleOpenWikiloc = () => {
    const subdomain =
      intlLocale === "ca" || intlLocale === "es" ? intlLocale : "en";
    void Linking.openURL(
      `https://${subdomain}.wikiloc.com/wikiloc/map.do?q=${encodeURIComponent(
        `${name}, ${location}`,
      )}&fitMapToTrails=1&page=1`,
    );
  };

  const handleOpenMaps = () => {
    if (!latitude || !longitude) {
      // useMountainOne hasn't resolved yet — surface the wait rather than
      // firing a malformed URL. With a warm cache this branch is unreachable.
      Alert.alert(
        intl.formatMessage({ defaultMessage: "Still loading" }),
        intl.formatMessage({
          defaultMessage: "Hold on a moment, then try again.",
        }),
      );
      return;
    }
    void Linking.openURL(
      `https://www.google.es/maps?q=${latitude},${longitude}`,
    );
  };

  return (
    <View>
      {imageUrl && (
        <Image
          source={{ uri: imageUrl, cache: "force-cache" }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      {/* Floating top-left actions on the image: View (→ detail page) +
          Save + Share. The View button is the primary path to the full
          mountain page; before this, the card had no way to navigate
          there. Mirror the close button on the top-right. */}
      <View style={styles.floatingLeft}>
        <Link
          href={{ pathname: "/mountain/[slug]", params: { slug } }}
          asChild
        >
          <FloatingIconButton
            icon={Eye}
            accessibilityLabel="View mountain"
          />
        </Link>
        <FloatingIconButton
          icon={isSaved ? BookmarkCheck : Bookmark}
          onPress={handleToggleSave}
          disabled={!mountainId || isAdding || isRemoving}
          accessibilityLabel="Save mountain"
          // When saved, swap the chip background AND the icon to the same
          // emerald tone used elsewhere for completion/summit state, so the
          // toggle reads at a glance, not just by glyph swap.
          tinted={isSaved}
        />
        <FloatingIconButton
          icon={ShareIcon}
          onPress={handleShare}
          accessibilityLabel="Share mountain"
        />
      </View>
      <TouchableOpacity
        onPress={onClose}
        style={styles.floatingClose}
        className="bg-background/80"
        hitSlop={8}
        accessibilityLabel="Close"
      >
        <LucideIcon icon={X} size={16} />
      </TouchableOpacity>

      <View className="gap-3 p-4">
        <View className="gap-1">
          <ThemedText className="text-xl font-semibold" numberOfLines={1}>
            {name}
          </ThemedText>
          {/* Height + essential. Location dropped — the map view already
              shows where the mountain is, restating it is noise. */}
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1.5">
              <LucideIcon icon={ArrowUp} size={12} muted />
              <ThemedText className="text-sm text-muted-foreground">
                {height}m
              </ThemedText>
            </View>
            {essential && (
              <View className="flex-row items-center gap-1.5">
                <LucideIcon icon={CircleDot} size={12} primary />
                <ThemedText className="text-sm text-muted-foreground">
                  <FormattedMessage defaultMessage="Essential" />
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Four small ActionRows, gap-2 between them. Order: Mark as
            summited (primary CTA) → Comments → Wikiloc → Maps. Wording on
            the summit row flips once the viewer has already summited this
            peak so they know they're logging a repeat ascent. */}
        <View className="gap-2">
          <Link
            href={{
              pathname: "/mountain/[slug]/summit",
              params: { slug },
            }}
            asChild
          >
            <ActionRow
              icon={Trophy}
              size="sm"
              intent="emerald"
              onPress={onClose}
            >
              {hasSummited ? (
                <FormattedMessage defaultMessage="Mark as summited again" />
              ) : (
                <FormattedMessage defaultMessage="Mark as summited" />
              )}
            </ActionRow>
          </Link>
          <Link
            href={{
              pathname: "/mountain/[slug]/comments",
              params: { slug },
            }}
            asChild
          >
            <ActionRow icon={MessageCircle} size="sm" onPress={onClose}>
              <FormattedMessage
                defaultMessage="Comments ({count})"
                values={{ count: commentsCount }}
              />
            </ActionRow>
          </Link>
          <ActionRow
            icon={MountainIcon}
            size="sm"
            onPress={handleOpenWikiloc}
          >
            <FormattedMessage defaultMessage="Wikiloc" />
          </ActionRow>
          <ActionRow icon={MapIcon} size="sm" onPress={handleOpenMaps}>
            <FormattedMessage defaultMessage="Maps" />
          </ActionRow>
        </View>
      </View>
    </View>
  );
};

const FloatingIconButton = ({
  icon,
  onPress,
  disabled,
  accessibilityLabel,
  tinted = false,
}: {
  icon: typeof Bookmark;
  // Optional so the button can be wrapped in `<Link asChild>` — expo-router
  // injects its own onPress via Radix Slot.
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
  /** When true, paint the chip with an emerald background + icon tint so it
   *  reads as an "active" toggle rather than just a glyph swap. */
  tinted?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled}
    className={twMerge(
      tinted ? "bg-emerald-500/30" : "bg-background/80",
      disabled && "opacity-50",
    )}
    style={styles.floatingIconButton}
    hitSlop={8}
    accessibilityLabel={accessibilityLabel}
  >
    <LucideIcon icon={icon} size={16} color={tinted ? "#10b981" : undefined} />
  </TouchableOpacity>
);


const styles = StyleSheet.create({
  cardWrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    // `bottom` is set inline using safe-area insets so the card clears the
    // NativeTabs tab bar.
    // Bumped above the screen's chip cluster (z-10) so the card paints over
    // it; JSX sibling order isn't enough once another sibling sets zIndex.
    zIndex: 20,
  },
  card: {
    // BlurView intensity is set via prop; rounded corners + overflow hidden
    // are applied via className so they compose with the border.
  },
  image: {
    width: "100%",
    // 30% shorter than the original 16:9 hero, then 15% shorter again per
    // tightened spec. 140 → 119.
    height: 119,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  floatingLeft: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    gap: 8,
  },
  floatingClose: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
