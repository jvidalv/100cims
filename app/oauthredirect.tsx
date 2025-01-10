import { ActivityIndicator, ThemedView } from "@/components/ui/atoms";

export default function OauthredirectPage() {
  return (
    <ThemedView className="flex h-full items-center justify-center px-4">
      <ActivityIndicator size="lg" />
    </ThemedView>
  );
}
