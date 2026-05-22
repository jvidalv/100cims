// NativeWind v5 (via react-native-css) registers `className` by augmenting
// `declare module "react-native"`. React Native 0.85 moved each component's
// prop interface into its own sub-file and only re-exports it from the package
// entry — so a `declare module "react-native"` augmentation no longer merges
// with `ViewProps` et al. This shim re-applies the same props by augmenting the
// sub-modules where the interfaces are actually declared. Remove once
// react-native-css ships RN 0.85 support.

import "react-native";

declare module "react-native/Libraries/Components/View/ViewPropTypes" {
  interface ViewProps {
    className?: string;
  }
}

declare module "react-native/Libraries/Text/Text" {
  interface TextProps {
    className?: string;
  }
}

declare module "react-native/Libraries/Image/Image" {
  interface ImagePropsBase {
    className?: string;
  }
}

declare module "react-native/Libraries/Components/ScrollView/ScrollView" {
  interface ScrollViewProps {
    contentContainerClassName?: string;
  }
}

declare module "react-native/Libraries/Components/Touchable/TouchableOpacity" {
  interface TouchableOpacityProps {
    className?: string;
  }
}

declare module "react-native/Libraries/Components/Touchable/TouchableHighlight" {
  interface TouchableHighlightProps {
    className?: string;
  }
}

declare module "react-native/Libraries/Components/Touchable/TouchableWithoutFeedback" {
  interface TouchableWithoutFeedbackProps {
    className?: string;
  }
}

declare module "react-native/Libraries/Components/Pressable/Pressable" {
  interface PressableProps {
    className?: string;
  }
}
