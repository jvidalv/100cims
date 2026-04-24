import { useLocalSearchParams, useRouter } from "expo-router";
import { Send } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { Alert, ScrollView, View } from "react-native";

import {
  ThemedText,
  ThemedTextInput,
  ThemedView,
} from "@/components/ui/atoms";
import {
  ActionRow,
  MountainRowMinimal,
  ScreenHeader,
} from "@/components/ui/molecules";
import { useMountainOne } from "@/domains/mountain/mountain.api";
import {
  useCreateMountainComment,
  useMountainComments,
  useUpdateMountainComment,
} from "@/domains/mountain-comments/mountain-comments.api";
import { getFullName } from "@/domains/user/user.utils";

export default function MountainCommentScreen() {
  const intl = useIntl();
  const router = useRouter();
  const { slug, parentCommentId, editCommentId } = useLocalSearchParams<{
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
  // Seed body once editing row loads.
  const [seeded, setSeeded] = useState(!editCommentId);
  if (!seeded && editing) {
    setBody(editing.body);
    setSeeded(true);
  }

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
        { id: editCommentId, body: trimmed },
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
        { body: trimmed, parentCommentId },
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
      <ScreenHeader />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="gap-4 px-6 pb-10 pt-2"
      >
        <ThemedText className="text-3xl font-bold">{title}</ThemedText>

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

        <ActionRow
          icon={Send}
          intent="blue"
          size="sm"
          disabled={!canSubmit}
          onPress={onSubmit}
        >
          {submitLabel}
        </ActionRow>
      </ScrollView>
    </ThemedView>
  );
}
