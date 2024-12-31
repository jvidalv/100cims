import { Link, Stack } from "expo-router";
import { Fragment } from "react";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";

export default function NotFoundScreen() {
  return (
    <Fragment>
      <Stack.Screen options={{ title: "Oops!" }} />
      <ThemedView className="flex-1 items-center justify-center p-5">
        <ThemedText>This screen doesn't exist.</ThemedText>
        <Link href="/" className="my-4">
          <ThemedText className="underline">Go to home screen</ThemedText>
        </Link>
      </ThemedView>
    </Fragment>
  );
}
