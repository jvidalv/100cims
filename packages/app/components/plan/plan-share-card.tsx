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
  title: string;
  totalHeight: number;
  summitCount: number;
  date: string;
  images: (string | null)[];
  users: User[];
};

const Slot = ({ uri, style }: { uri: string | null; style: object }) => {
  if (!uri) {
    return (
      <View style={[style, { backgroundColor: Colors.light.primary }]} />
    );
  }
  return <Image source={{ uri }} style={style} resizeMode="cover" />;
};

const PhotoGrid = ({ images }: { images: (string | null)[] }) => {
  const filled = images.slice(0, 4);
  if (filled.length === 0) {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: Colors.light.primary },
        ]}
      />
    );
  }
  if (filled.length === 1) {
    return <Slot uri={filled[0]} style={StyleSheet.absoluteFill} />;
  }
  if (filled.length === 2) {
    return (
      <View style={StyleSheet.absoluteFill}>
        <Slot uri={filled[0]} style={{ width: "100%", height: "50%" }} />
        <Slot uri={filled[1]} style={{ width: "100%", height: "50%" }} />
      </View>
    );
  }
  if (filled.length === 3) {
    return (
      <View style={StyleSheet.absoluteFill}>
        <Slot uri={filled[0]} style={{ width: "100%", height: "50%" }} />
        <View style={{ flexDirection: "row", height: "50%" }}>
          <Slot uri={filled[1]} style={{ width: "50%", height: "100%" }} />
          <Slot uri={filled[2]} style={{ width: "50%", height: "100%" }} />
        </View>
      </View>
    );
  }
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={{ flexDirection: "row", height: "50%" }}>
        <Slot uri={filled[0]} style={{ width: "50%", height: "100%" }} />
        <Slot uri={filled[1]} style={{ width: "50%", height: "100%" }} />
      </View>
      <View style={{ flexDirection: "row", height: "50%" }}>
        <Slot uri={filled[2]} style={{ width: "50%", height: "100%" }} />
        <Slot uri={filled[3]} style={{ width: "50%", height: "100%" }} />
      </View>
    </View>
  );
};

// Styles are inline rather than NativeWind classes because react-native-view-shot
// doesn't reliably serialize className-based styles into the captured image.
export const PlanShareCard = forwardRef<View, Props>(
  ({ title, totalHeight, summitCount, date, images, users }, ref) => {
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
        <PhotoGrid images={images} />

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
            {title}
          </ThemedText>

          <View
            style={{
              marginTop: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {totalHeight > 0 && (
              <ThemedText
                style={{
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                {totalHeight}m
              </ThemedText>
            )}
            {totalHeight > 0 && (
              <View
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: 999,
                  backgroundColor: "rgba(255,255,255,0.6)",
                }}
              />
            )}
            <ThemedText
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              {format(new Date(date), "dd MMM yyyy")}
            </ThemedText>
            {summitCount > 0 && (
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
                  {summitCount} cims
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

PlanShareCard.displayName = "PlanShareCard";
