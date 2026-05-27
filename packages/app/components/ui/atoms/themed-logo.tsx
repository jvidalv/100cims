import { useColorScheme } from "nativewind";
import { type ComponentProps } from "react";

import { Image } from "@/components/ui/atoms/image";

type Props = Omit<ComponentProps<typeof Image>, "source">;

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
