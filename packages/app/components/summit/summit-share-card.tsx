import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { forwardRef } from "react";
import { Image, StyleSheet, View } from "react-native";

import { Avatar, ThemedText } from "@/components/ui/atoms";
import { Colors } from "@/constants/colors";
import { formatUsersLine, getFullName } from "@/domains/user/user.utils";
import { getInitials } from "@/lib/strings";

const CARD_W = 360;
const CARD_H = 640;

type User = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
};

type Props = {
  mountainName: string;
  mountainHeight: string;
  mountainEssential: boolean;
  summitImageUrl?: string | null;
  summitedAt: string;
  users: User[];
};

// Styles are inline rather than NativeWind classes because react-native-view-shot
// doesn't reliably serialize className-based styles into the captured image.
export const SummitShareCard = forwardRef<View, Props>(
  (
    {
      mountainName,
      mountainHeight,
      mountainEssential,
      summitImageUrl,
      summitedAt,
      users,
    },
    ref,
  ) => {
    const visibleUsers = users.slice(0, 3);

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
        {summitImageUrl && (
          <Image
            source={{ uri: summitImageUrl }}
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
              fontSize: 34,
              fontWeight: "800",
              letterSpacing: -0.5,
              lineHeight: 38,
            }}
          >
            {mountainName}
          </ThemedText>

          <View
            style={{
              marginTop: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <ThemedText
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              {mountainHeight}m
            </ThemedText>
            <View
              style={{
                width: 3,
                height: 3,
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.6)",
              }}
            />
            <ThemedText
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              {format(new Date(summitedAt), "dd MMM yyyy")}
            </ThemedText>
            {mountainEssential && (
              <>
                <View
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: 999,
                    backgroundColor: "rgba(255,255,255,0.6)",
                  }}
                />
                <ThemedText
                  style={{
                    color: "white",
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  Essential
                </ThemedText>
              </>
            )}
          </View>

          {users.length > 0 && (
            <View
              style={{
                marginTop: 18,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View style={{ flexDirection: "row" }}>
                {visibleUsers.map((u, i) => (
                  <View
                    key={u.userId}
                    style={{
                      marginLeft: i === 0 ? 0 : -10,
                      borderWidth: 2,
                      borderColor: "rgba(0,0,0,0.8)",
                      borderRadius: 999,
                    }}
                  >
                    <Avatar
                      size="xs"
                      imageUrl={u.imageUrl}
                      initials={getInitials(getFullName(u))}
                    />
                  </View>
                ))}
              </View>
              <ThemedText
                numberOfLines={1}
                style={{
                  marginLeft: 10,
                  color: "white",
                  fontSize: 14,
                  fontWeight: "600",
                  flex: 1,
                }}
              >
                {formatUsersLine(users)}
              </ThemedText>
            </View>
          )}
        </View>

      </View>
    );
  },
);

SummitShareCard.displayName = "SummitShareCard";
