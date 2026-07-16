import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import MapView, { Polyline, Marker } from "react-native-maps";
import { Video, ResizeMode } from "expo-av";
import { SportRoute } from "../types";

const SPORT_LABELS: Record<string, string> = {
  running: "🏃 Running",
  cycling: "🚴 Ciclismo",
  walking: "🚶 Caminata",
  hiking: "🥾 Senderismo",
  swimming: "🏊 Natación",
};

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

export default function RouteCard({ route }: { route: SportRoute }) {
  const router = useRouter();

  const points = route.route_points || route.points || [];
  
  // Basic check for video by extension
  const videos = (route.photos || []).filter(uri => uri.toLowerCase().endsWith('.mp4') || uri.toLowerCase().endsWith('.mov'));
  const photos = (route.photos || []).filter(uri => !uri.toLowerCase().endsWith('.mp4') && !uri.toLowerCase().endsWith('.mov'));

  return (
    <View style={styles.card}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push(`/route/${route.id}`)}
      >
        {/* MAPA */}
        {points.length > 0 && (
          <View style={styles.mapContainer} pointerEvents="none">
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: points[0].latitude,
                longitude: points[0].longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              {points.length > 1 && (
                <Polyline
                  coordinates={points.map(p => ({ latitude: p.latitude, longitude: p.longitude }))}
                  strokeColor="#2f6fed"
                  strokeWidth={4}
                />
              )}
              <Marker
                coordinate={{
                  latitude: points[points.length - 1].latitude,
                  longitude: points[points.length - 1].longitude,
                }}
              />
            </MapView>
          </View>
        )}

        {/* VIDEOS */}
        {videos.map((uri, i) => (
          <Video
            key={`vid-${i}`}
            source={{ uri }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.COVER}
            isLooping
          />
        ))}

        {/* FOTOS */}
        {photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
            {photos.map((uri, i) => (
              <Image key={`img-${i}`} source={{ uri }} style={styles.photo} />
            ))}
          </ScrollView>
        )}

        <View style={styles.body}>
          <Text style={styles.title}>{route.title}</Text>
          <Text style={styles.sport}>{SPORT_LABELS[route.sport || ""] ?? route.sport}</Text>
          <View style={styles.statsRow}>
            <Text style={styles.stat}>{(route.distance / 1000).toFixed(2)} km</Text>
            <Text style={styles.stat}>{formatDuration(route.duration)}</Text>
            <Text style={styles.stat}>{((route.average_speed || 0) * 3.6).toFixed(1)} km/h</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 14,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  mapContainer: {
    width: "100%",
    height: 180,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  video: {
    width: "100%",
    height: 220,
    backgroundColor: "#000",
  },
  photosScroll: {
    padding: 10,
    backgroundColor: "#fafafa"
  },
  photo: { 
    width: 120, 
    height: 120, 
    borderRadius: 8,
    marginRight: 10 
  },
  body: { padding: 12 },
  title: { fontSize: 16, fontWeight: "700", color: "#111" },
  sport: { fontSize: 13, color: "#666", marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 16, marginTop: 8 },
  stat: { fontSize: 13, fontWeight: "600", color: "#2f6fed" },
});
