import { useMemo } from "react";
import { FormattedMessage } from "react-intl";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from "react-native-maps";

import { Icon, ThemedText } from "@/components/ui/atoms";

interface Mountain {
  id: string;
  latitude: string;
  longitude: string;
  name: string;
  height: string;
  location: string;
  essential: boolean;
  slug: string;
  imageUrl: string | null;
}

interface MountainsMapProps {
  mountains: Mountain[];
  summitedSlugs: string[];
  userLocation?: { coords: { latitude: number; longitude: number } } | null;
  onMountainPress: (slug: string) => void;
  showUserLocation?: boolean;
  showMyLocationButton?: boolean;
  isLoading?: boolean;
}

interface MountainMarkerProps {
  marker: {
    id: string;
    coordinate: { latitude: number; longitude: number };
    title: string;
    height: string;
    location: string;
    essential: boolean;
    slug: string;
    imageUrl: string | null;
    isSummited: boolean;
  };
  onMountainPress: (slug: string) => void;
}

function MountainMarker({ marker, onMountainPress }: MountainMarkerProps) {
  // Determine pin color: green for summited, red for essential, gray for non-essential
  const pinColor = marker.isSummited
    ? "#10b981"
    : marker.essential
      ? "#f43f5e"
      : "#6b7280";

  return (
    <Marker key={marker.id} coordinate={marker.coordinate} pinColor={pinColor}>
      <Callout style={styles.callout} tooltip onPress={() => onMountainPress(marker.slug)}>
        <View className="max-w-lg w-full rounded-xl overflow-hidden bg-background">
          <View className="flex-1 pb-4">
            {marker.imageUrl && (
              <Image
                source={{ uri: marker.imageUrl }}
                className="w-[250px] h-[140px] rounded-t-xl mb-4"
                resizeMode="cover"
              />
            )}
            <ThemedText className="font-semibold text-base px-4">
              {marker.title}
            </ThemedText>
            <ThemedText className="text-sm text-muted-foreground mb-2 px-4">
              {marker.height}m - {marker.location}
            </ThemedText>
            {marker.essential && (
              <View className="flex-row items-center gap-2 mt-1 px-4">
                <View className="size-3 rounded-full bg-primary" />
                <ThemedText className="text-sm font-medium text-primary">
                  <FormattedMessage defaultMessage="Essential" />
                </ThemedText>
              </View>
            )}
            {marker.isSummited && (
              <View className="flex-row items-center gap-1 mt-1 px-4">
                <Icon name="checkmark.seal.fill" size={14} color="#10b981" />
                <ThemedText className="text-sm" style={{ color: "#10b981" }}>
                  Summited
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </Callout>
    </Marker>
  );
}

export function MountainsMap({
  mountains,
  summitedSlugs,
  userLocation,
  onMountainPress,
  showUserLocation = true,
  showMyLocationButton = true,
  isLoading = false,
}: MountainsMapProps) {
  const colorScheme = useColorScheme();

  // Transform mountains to markers with summit status
  const markers = useMemo(() => {
    return mountains.map((mountain) => {
      const isSummited = summitedSlugs.includes(mountain.slug);

      return {
        id: mountain.id,
        coordinate: {
          latitude: parseFloat(mountain.latitude),
          longitude: parseFloat(mountain.longitude),
        },
        title: mountain.name,
        height: mountain.height,
        location: mountain.location,
        essential: mountain.essential,
        slug: mountain.slug,
        imageUrl: mountain.imageUrl,
        isSummited,
      };
    });
  }, [mountains, summitedSlugs]);

  // Calculate initial region based on markers or user location
  const initialRegion = useMemo(() => {
    if (markers.length > 0) {
      // Calculate the center of all mountains
      const latitudes = markers.map((m) => m.coordinate.latitude);
      const longitudes = markers.map((m) => m.coordinate.longitude);

      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);

      return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: (maxLat - minLat) * 0.75 || 0.25,
        longitudeDelta: (maxLng - minLng) * 0.75 || 0.25,
      };
    }

    // Fallback to user location or default
    if (userLocation) {
      return {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.25,
        longitudeDelta: 0.25,
      };
    }

    // Default to Catalonia
    return {
      latitude: 41.8,
      longitude: 1.8,
      latitudeDelta: 1,
      longitudeDelta: 1,
    };
  }, [markers, userLocation]);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={showMyLocationButton}
        provider={PROVIDER_GOOGLE}
        customMapStyle={colorScheme === "dark" ? darkMapStyle : []}
      >
        {markers.map((marker) => (
          <MountainMarker
            key={marker.id}
            marker={marker}
            onMountainPress={onMountainPress}
          />
        ))}
      </MapView>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <View className="bg-background/80 rounded-full p-3 shadow-lg">
            <ActivityIndicator size="small" />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
  },
  callout: {
    width: 250,
    borderRadius: 16,
  },
});

// Dark mode map style
const darkMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#242f3e" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#746855" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#242f3e" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];
