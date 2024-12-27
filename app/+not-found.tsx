import { Link, Stack } from "expo-router";

import { ThemedText } from "@/components/ui/atoms/themed-text";
import { ThemedView } from "@/components/ui/atoms/themed-view";
import { Fragment } from "react";

export default function NotFoundScreen() {
  return (
    <Fragment>
      <Stack.Screen options={{ title: "Oops!" }} />
      <ThemedView className="p-5 flex-1 items-center justify-center">
        <ThemedText>This screen doesn't exist.</ThemedText>
        <Link href="/" className="my-4">
          <ThemedText className="underline">Go to home screen</ThemedText>
        </Link>
      </ThemedView>
    </Fragment>
  );
}
