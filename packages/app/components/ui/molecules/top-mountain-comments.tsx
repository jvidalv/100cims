import { useRouter } from "expo-router";
import { FormattedMessage } from "react-intl";
import { View } from "react-native";

import { ThemedText } from "@/components/ui/atoms";
import { CommentRow } from "@/components/ui/molecules/comment-row";
import {
  useTopMountainComments,
  useUpvoteMountainComment,
} from "@/domains/mountain-comments/mountain-comments.api";
import { useUserMe } from "@/domains/user/user.api";

type Props = {
  mountainId: string;
  isAuthenticated: boolean;
};

export function TopMountainComments({ mountainId, isAuthenticated }: Props) {
  const router = useRouter();
  const { data: me } = useUserMe();
  const { data } = useTopMountainComments(mountainId);
  const upvote = useUpvoteMountainComment(mountainId);

  const comments = data?.items ?? [];
  if (comments.length === 0) return null;

  return (
    <View className="gap-4">
      <ThemedText className="text-2xl font-semibold">
        <FormattedMessage defaultMessage="Top comments" />
      </ThemedText>
      <View className="gap-4">
        {comments.map((c) => (
          <CommentRow
            key={c.id}
            comment={{
              id: c.id,
              parentCommentId: c.parentCommentId,
              body: c.body,
              images: c.images,
              upvoteCount: c.upvoteCount,
              viewerHasUpvoted: c.viewerHasUpvoted,
              createdAt: String(c.createdAt),
              user: c.user,
            }}
            viewerId={me?.id ?? null}
            onUpvote={() => {
              if (!isAuthenticated) {
                router.push("/join");
                return;
              }
              upvote.mutate(c.id);
            }}
          />
        ))}
      </View>
    </View>
  );
}
