import { CloudOff } from "lucide-react-native";
import { useState } from "react";
import { FormattedMessage } from "react-intl";
import { View } from "react-native";

import {
  Button,
  LucideIcon,
  ThemedText,
  ThemedView,
} from "@/components/ui/atoms";
import { reportErrorToDiscord } from "@/lib/report-error";

type ErrorStateProps = {
  context: string;
  error: unknown;
  onReload: () => void;
};

export const ErrorState = ({ context, error, onReload }: ErrorStateProps) => {
  const [reportStatus, setReportStatus] = useState<
    "idle" | "reporting" | "reported"
  >("idle");

  const handleReport = async () => {
    setReportStatus("reporting");
    await reportErrorToDiscord({ context, error });
    setReportStatus("reported");
  };

  return (
    <ThemedView className="flex-1 items-center justify-center gap-4 px-8">
      <LucideIcon icon={CloudOff} size={48} muted />
      <ThemedText className="text-center text-2xl font-bold">
        <FormattedMessage defaultMessage="Something went wrong" />
      </ThemedText>
      <ThemedText className="text-center text-muted-foreground">
        <FormattedMessage defaultMessage="We couldn't load the page. Please try again." />
      </ThemedText>
      <View className="mt-2 w-full flex-row gap-2">
        <Button className="flex-1" onPress={onReload}>
          <FormattedMessage defaultMessage="Reload" />
        </Button>
        <Button
          className="flex-1"
          intent="outline"
          onPress={handleReport}
          disabled={reportStatus !== "idle"}
        >
          {reportStatus === "reported" ? (
            <FormattedMessage defaultMessage="Thanks — we got it" />
          ) : (
            <FormattedMessage defaultMessage="Report" />
          )}
        </Button>
      </View>
    </ThemedView>
  );
};
