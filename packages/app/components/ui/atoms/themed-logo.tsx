import { useColorScheme } from "nativewind";
import { Image, ImageProps } from "react-native";

type Props = Omit<ImageProps, "source">;

export const ThemedLogo = (props: Props) => {
  const { colorScheme } = useColorScheme();
  return (
    <Image
      source={
        colorScheme === "dark"
          ? require("@/assets/images/logo-light.png")
          : require("@/assets/images/logo-dark.png")
      }
      {...props}
    />
  );
};
