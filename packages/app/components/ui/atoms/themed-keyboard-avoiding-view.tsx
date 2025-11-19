import {
  KeyboardAvoidingView,
  KeyboardAvoidingViewProps,
  Platform,
} from "react-native";

export const ThemedKeyboardAvoidingView = (
  props: KeyboardAvoidingViewProps,
) => (
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : undefined}
    className="flex-1 bg-background"
    {...props}
  />
);
