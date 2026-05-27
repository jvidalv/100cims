import { LinearGradient } from "expo-linear-gradient";
import { forwardRef } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ui/atoms";
import { Image } from "@/components/ui/atoms/image";
import { Colors } from "@/constants/colors";

const CARD_W = 360;
const CARD_H = 640;

type Props = {
  fullName: string;
  profileImageUrl: string | null;
  topSummits: { imageUrl: string | null }[];
  remainingCount: number;
};

// Styles are inline rather than NativeWind classes because react-native-view-shot
// doesn't reliably serialize className-based styles into the captured image.
export const UserShareCard = forwardRef<View, Props>(
  ({ fullName, profileImageUrl, topSummits, remainingCount }, ref) => {
    const hasSummits = topSummits.length > 0;

    return (
      <View
        ref={ref}
        collapsable={false}
        style={{
          width: CARD_W,
          height: CARD_H,
          overflow: "hidden",
          backgroundColor: Colors.light.primary,
        }}
      >
        {profileImageUrl && (
          <Image
            source={{ uri: profileImageUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        )}

        <LinearGradient
          colors={["rgba(0,0,0,0.35)", "rgba(0,0,0,0)", "rgba(0,0,0,0.85)"]}
          locations={[0, 0.35, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            right: 20,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Image
            source={require("@/assets/images/logo-light.png")}
            style={{ width: 72, height: 40, resizeMode: "contain" }}
          />
        </View>

        <View
          style={{
            position: "absolute",
            bottom: 28,
            left: 24,
            right: 24,
          }}
        >
          <ThemedText
            numberOfLines={2}
            style={{
              color: "white",
              fontSize: 28,
              fontWeight: "800",
              letterSpacing: -0.5,
              lineHeight: 32,
            }}
          >
            {fullName}
          </ThemedText>

          {hasSummits && (
            <View style={{ marginTop: 10, gap: 8 }}>
              {[0, 1].map((row) => {
                const rowSlots = Array.from({ length: 5 }, (_, col) => {
                  const slotIndex = row * 5 + col;
                  // Slot 9 (the last one) becomes +N when there's overflow.
                  if (slotIndex === 9 && remainingCount > 0) {
                    return { kind: "more" as const };
                  }
                  const summit = topSummits[slotIndex];
                  if (!summit) return null;
                  return { kind: "photo" as const, imageUrl: summit.imageUrl };
                });
                if (rowSlots.every((s) => s === null)) return null;
                return (
                  <View
                    key={row}
                    style={{ flexDirection: "row", gap: 8 }}
                  >
                    {rowSlots.map((slot, col) => (
                      <View
                        key={col}
                        style={{
                          flex: 1,
                          aspectRatio: 1,
                          borderRadius: 6,
                          overflow: "hidden",
                          backgroundColor:
                            slot?.kind === "more"
                              ? "rgba(0,0,0,0.5)"
                              : "transparent",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: slot ? 1 : 0,
                        }}
                      >
                        {slot?.kind === "photo" && slot.imageUrl && (
                          <Image
                            source={{ uri: slot.imageUrl }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                        )}
                        {slot?.kind === "more" && (
                          <ThemedText
                            style={{
                              color: "white",
                              fontSize: 18,
                              fontWeight: "800",
                            }}
                          >
                            +{remainingCount}
                          </ThemedText>
                        )}
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    );
  },
);

UserShareCard.displayName = "UserShareCard";
