import { useGlobalSearchParams, useRouter } from "expo-router";
import { Camera, Send, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

import {
  LucideIcon,
  ThemedText,
  ThemedTextInput,
  ThemedView,
} from "@/components/ui/atoms";
import {
  ActionRow,
  BlurredScreenHeader,
  BLURRED_SCREEN_HEADER_HEIGHT,
  MountainRowMinimal,
} from "@/components/ui/molecules";
import { useMountainOne } from "@/domains/mountain/mountain.api";
import {
  useCreateMountainComment,
  useMountainComments,
  useUpdateMountainComment,
} from "@/domains/mountain-comments/mountain-comments.api";
import { getFullName } from "@/domains/user/user.utils";
import { pickAndOptimizeImages } from "@/lib/images";

const MAX_IMAGES = 5;

export default function MountainCommentScreen() {
  const intl = useIntl();
  const router = useRouter();
  // useGlobalSearchParams (not useLocalSearchParams) for the same reason as
  // the sibling tab screens — see comment in ../summit.tsx. The parent
  // [slug] dynamic isn't always populated on useLocalSearchParams when the
  // screen mounts inside a NativeTabs > Stack tree.
  const { slug, parentCommentId, editCommentId } = useGlobalSearchParams<{
    slug: string;
    parentCommentId?: string;
    editCommentId?: string;
  }>();

  const { data: mountain } = useMountainOne({ mountainSlug: slug });
  const { data: commentsData } = useMountainComments(mountain?.id);
  const create = useCreateMountainComment(mountain?.id ?? "");
  const update = useUpdateMountainComment(mountain?.id ?? "");

  const comments = useMemo(
    () => (commentsData?.pages ?? []).flatMap((page) => page.items),
    [commentsData],
  );
  const parent = useMemo(
    () => comments.find((c) => c.id === parentCommentId) ?? null,
    [comments, parentCommentId],
  );
  const editing = useMemo(
    () => comments.find((c) => c.id === editCommentId) ?? null,
    [comments, editCommentId],
  );

  const [body, setBody] = useState(editing?.body ?? "");
  // `uri` drives the local <Image> preview; `value` is what gets sent on
  // submit — an existing image URL (kept verbatim by the server) or the
  // base64 of a freshly-picked image (uploaded server-side). Treating both
  // shapes the same way is what lets edit reuse the create UI.
  const [images, setImages] = useState<{ uri: string; value: string }[]>([]);
  // Seed body + images once the editing row loads. One-shot — subsequent
  // edits to either field stay local.
  const [seeded, setSeeded] = useState(!editCommentId);
  if (!seeded && editing) {
    setBody(editing.body);
    setImages(
      (editing.images ?? []).map((i) => ({ uri: i.url, value: i.url })),
    );
    setSeeded(true);
  }

  const [isPickingImage, setIsPickingImage] = useState(false);
  const canAddImages = images.length < MAX_IMAGES;

  const onPickImage = async () => {
    if (!canAddImages || isPickingImage) return;
    setIsPickingImage(true);
    try {
      const remaining = MAX_IMAGES - images.length;
      const results = await pickAndOptimizeImages({
        selectionLimit: remaining,
      });
      if (!results) return;
      const next = results
        .filter((r) => r.optimized.base64)
        .map((r) => ({ uri: r.picked.uri, value: r.optimized.base64! }));
      if (next.length === 0) return;
      setImages((prev) => [...prev, ...next].slice(0, MAX_IMAGES));
    } catch {
      Alert.alert(
        intl.formatMessage({
          defaultMessage: "Could not load image, try another one.",
        }),
      );
    } finally {
      setIsPickingImage(false);
    }
  };

  const onRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const title = editCommentId
    ? intl.formatMessage({ defaultMessage: "Edit comment" })
    : parentCommentId
      ? intl.formatMessage({ defaultMessage: "Reply to a comment" })
      : intl.formatMessage({ defaultMessage: "Add comment" });

  const isPending = create.isPending || update.isPending;
  const canSubmit =
    body.trim().length > 0 && body.length <= 2000 && !isPending && !!mountain;

  const onSubmit = () => {
    if (!canSubmit || !mountain) return;
    const trimmed = body.trim();
    if (editCommentId) {
      update.mutate(
        {
          id: editCommentId,
          body: trimmed,
          // Send the whole array (URLs + base64) so the server can both
          // honour removals (URL absent) and pick up new uploads (base64).
          images: images.map((i) => i.value),
        },
        {
          onSuccess: () => router.back(),
          onError: () =>
            Alert.alert(
              intl.formatMessage({
                defaultMessage: "Could not update comment",
              }),
            ),
        },
      );
    } else {
      create.mutate(
        {
          body: trimmed,
          parentCommentId,
          images:
            images.length > 0 ? images.map((i) => i.value) : undefined,
        },
        {
          onSuccess: () => router.back(),
          onError: () =>
            Alert.alert(
              parentCommentId
                ? intl.formatMessage({
                    defaultMessage: "Could not post reply",
                  })
                : intl.formatMessage({
                    defaultMessage: "Could not post comment",
                  }),
            ),
        },
      );
    }
  };

  const submitLabel = isPending
    ? intl.formatMessage({ defaultMessage: "Posting…" })
    : editCommentId
      ? intl.formatMessage({ defaultMessage: "Save" })
      : parentCommentId
        ? intl.formatMessage({ defaultMessage: "Reply" })
        : intl.formatMessage({ defaultMessage: "Post" });

  return (
    <ThemedView className="flex-1">
      <BlurredScreenHeader>
        <ThemedText numberOfLines={1} className="max-w-56 text-lg font-medium">
          {title}
        </ThemedText>
      </BlurredScreenHeader>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: BLURRED_SCREEN_HEADER_HEIGHT,
          paddingHorizontal: 24,
          paddingBottom: 40,
          gap: 16,
        }}
      >
        {mountain && (
          <MountainRowMinimal
            slug={mountain.slug}
            name={mountain.name}
            height={mountain.height}
            essential={mountain.essential}
            imageUrl={mountain.imageUrl}
          />
        )}

        {parent && (
          <View className="rounded border border-border bg-muted/30 p-3">
            <ThemedText className="text-xs text-muted-foreground">
              <FormattedMessage
                defaultMessage="Replying to {name}"
                values={{ name: getFullName(parent.user) }}
              />
            </ThemedText>
            <ThemedText numberOfLines={4} className="mt-1">
              {parent.body}
            </ThemedText>
          </View>
        )}

        <ThemedTextInput
          value={body}
          onChangeText={setBody}
          placeholder={
            parentCommentId
              ? intl.formatMessage({ defaultMessage: "Write a reply…" })
              : intl.formatMessage({ defaultMessage: "Write a comment…" })
          }
          multiline
          maxLength={2000}
          autoFocus
          inputClassName="py-3 px-3 min-h-[200px]"
        />

        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row flex-wrap gap-2">
            {images.map((img, idx) => (
              <View key={img.uri} className="relative">
                <Image
                  source={{ uri: img.uri }}
                  className="size-16 rounded bg-muted"
                />
                <TouchableOpacity
                  accessibilityLabel={intl.formatMessage({
                    defaultMessage: "Remove photo",
                  })}
                  hitSlop={8}
                  onPress={() => onRemoveImage(idx)}
                  className="absolute -right-1 -top-1 size-5 items-center justify-center rounded-full bg-background"
                >
                  <LucideIcon icon={X} size={14} />
                </TouchableOpacity>
              </View>
            ))}
            {canAddImages && (
              <TouchableOpacity
                accessibilityLabel={intl.formatMessage({
                  defaultMessage: "Add photo",
                })}
                disabled={isPickingImage}
                onPress={onPickImage}
                className="size-16 items-center justify-center gap-0.5 rounded border-2 border-dashed border-border bg-muted/30"
              >
                {isPickingImage ? (
                  <ActivityIndicator />
                ) : (
                  <>
                    <LucideIcon icon={Camera} muted />
                    <ThemedText className="text-xs text-muted-foreground">
                      {images.length}/{MAX_IMAGES}
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
          <View className="shrink-0">
            <ActionRow
              icon={Send}
              intent="blue"
              size="sm"
              disabled={!canSubmit}
              onPress={onSubmit}
            >
              {submitLabel}
            </ActionRow>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}
