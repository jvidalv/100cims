import { useEffect, useState } from "react";
import { Image, ScrollView, useWindowDimensions } from "react-native";

import { Skeleton } from "@/components/ui/atoms/skeleton";

export const DynamicImage = ({ uri }: { uri: string }) => {
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null,
  );
  const { width: screenWidth } = useWindowDimensions();

  useEffect(() => {
    Image.getSize(
      uri,
      (width, height) => {
        setSize({ width, height });
      },
      (error) => {
        console.warn("Failed to get image size", error);
      },
    );
  }, [uri]);

  if (!size) return <Skeleton className="size-full min-h-[500px]" />;

  const aspectRatio = size.width / size.height;
  const displayHeight = screenWidth / aspectRatio;

  return (
    <ScrollView
      key={uri}
      horizontal={false}
      maximumZoomScale={3}
      minimumZoomScale={1}
      contentContainerStyle={{ alignItems: "center", justifyContent: "center" }}
      centerContent
    >
      <Image
        source={{ uri }}
        style={{
          width: screenWidth,
          height: displayHeight,
          resizeMode: "contain",
        }}
      />
    </ScrollView>
  );
};
