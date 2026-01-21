import { ReactNode } from "react";
import { useIntl } from "react-intl";
import { View } from "react-native";

import {
  ThemedTextInput,
} from "@/components/ui/atoms";
import { ThemedToggleInput } from "@/components/ui/atoms/themed-toggle-input";
import { EmojiPicker } from "@/components/ui/molecules";

export type ChallengeFormData = {
  name: string;
  country: string;
  emoji: string;
  description: string;
  isPublic: boolean;
};

type ChallengeFormProps = {
  data: ChallengeFormData;
  onChange: (data: ChallengeFormData) => void;
  children?: ReactNode;
};

export function ChallengeForm({ data, onChange, children }: ChallengeFormProps) {
  const intl = useIntl();

  const handleChange = <K extends keyof ChallengeFormData>(
    key: K,
    value: ChallengeFormData[K]
  ) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <View className="gap-4 px-6">
      <ThemedTextInput
        label={intl.formatMessage({ defaultMessage: "Challenge name" })}
        value={data.name}
        maxLength={30}
        onChangeText={(value) => handleChange("name", value)}
      />

      <View className="flex-row items-end gap-3">
        <EmojiPicker
          value={data.emoji}
          onSelect={(value) => handleChange("emoji", value)}
        />
        <View className="flex-1">
          <ThemedTextInput
            label={intl.formatMessage({ defaultMessage: "Country/Region" })}
            value={data.country}
            onChangeText={(value) => handleChange("country", value)}
          />
        </View>
      </View>

      <ThemedTextInput
        label={intl.formatMessage({ defaultMessage: "Description" })}
        multiline
        value={data.description}
        inputClassName="h-[100px]"
        onChangeText={(value) => handleChange("description", value)}
      />

      <View className="mt-4">
        <ThemedToggleInput
          label={intl.formatMessage({ defaultMessage: "Public" })}
          checked={data.isPublic}
          onChecked={(value) => handleChange("isPublic", value)}
        />
      </View>

      {children}
    </View>
  );
}
