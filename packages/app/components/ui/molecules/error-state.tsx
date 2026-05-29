import { useNetworkState } from "expo-network";
import {
  Check,
  CloudOff,
  Download,
  Flag,
  RotateCw,
} from "lucide-react-native";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  LucideIcon,
  ThemedLogo,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import { ActionRow } from "@/components/ui/molecules/action-row";
import { useUserMe } from "@/domains/user/user.api";
import { checkForUpdate } from "@/lib/check-for-update";
import { reportErrorToDiscord } from "@/lib/report-error";

type ErrorStateProps = {
  context: string;
  error: unknown;
  onReload: () => void;
};

export const ErrorState = ({ context, error, onReload }: ErrorStateProps) => {
  const { data: user } = useUserMe();
  const network = useNetworkState();
  const insets = useSafeAreaInsets();
  const isOnline =
    network.isConnected !== false && network.isInternetReachable !== false;
  const [reportStatus, setReportStatus] = useState<
    "idle" | "reporting" | "reported"
  >("idle");

  const handleReport = async () => {
    setReportStatus("reporting");
    await reportErrorToDiscord({ context, error, userId: user?.id });
    setReportStatus("reported");
  };

  const hasReported = reportStatus === "reported";

  return (
    <ThemedView className="flex-1 px-8">
      <View
        className="items-center pb-8"
        style={{ paddingTop: insets.top + 16 }}
      >
        <ThemedLogo style={{ width: 120, height: 40 }} resizeMode="contain" />
      </View>
      <View className="flex-1 justify-center gap-4">
        <LucideIcon icon={CloudOff} size={48} muted />
        <ThemedText className="text-2xl font-bold">
          <FormattedMessage defaultMessage="Something went wrong" />
        </ThemedText>
        <ThemedText className="text-muted-foreground">
          <FormattedMessage defaultMessage="We couldn't load this screen. Please try again." />
        </ThemedText>
        <View className="mt-2 items-start gap-1">
          <ActionRow
            icon={RotateCw}
            intent="primary"
            size="lg"
            onPress={onReload}
          >
            <FormattedMessage defaultMessage="Reload" />
          </ActionRow>
          {isOnline && (
            <ActionRow
              icon={hasReported ? Check : Flag}
              intent={hasReported ? "emerald" : "muted"}
              size="lg"
              onPress={handleReport}
              disabled={reportStatus !== "idle"}
            >
              {hasReported ? (
                <FormattedMessage defaultMessage="Thanks — we got it" />
              ) : (
                <FormattedMessage defaultMessage="Report" />
              )}
            </ActionRow>
          )}
          <ActionRow
            icon={Download}
            intent="muted"
            size="lg"
            onPress={() => void checkForUpdate()}
          >
            <FormattedMessage defaultMessage="Check for updates" />
          </ActionRow>
        </View>
      </View>
    </ThemedView>
  );
};
