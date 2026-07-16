import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import MapView, { Polyline } from "react-native-maps";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faHeart, faRuler, faStopwatch } from "@fortawesome/free-solid-svg-icons";
import { faComment } from "@fortawesome/free-regular-svg-icons";
import { FeedPost } from "../types";
import { C } from "../theme";

const SPORT_LABEL: Record<string, string> = {
  running: "Running", cycling: "Ciclismo", walking: "Caminata",
  hiking: "Senderismo", swimming: "Natación",
};

export default function ProfilePostCard({ post }: { post: FeedPost }) {
  const router = useRouter();
  const handlePress = () => router.push(`/route/${post.route?.id}`);

  const { route, likes_count, comments_count } = post;

  if (!route) return null;

  const dist = ((route.distance ?? 0) / 1000).toFixed(2);
  const totalSec = route.duration ?? 0;
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

  const hasPhotos = route.photos && route.photos.length > 0;
  const firstPhoto = hasPhotos ? route.photos![0] : null;
  const isVideo = firstPhoto
    ? firstPhoto.toLowerCase().endsWith(".mp4") || firstPhoto.toLowerCase().endsWith(".mov")
    : false;

  const points = route.route_points || [];
  const hasPoints = points.length > 0;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.75} onPress={handlePress}>
      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {hasPhotos && !isVideo ? (
          <Image source={{ uri: firstPhoto! }} style={styles.thumbnail} />
        ) : hasPoints ? (
          <View style={styles.thumbnail} pointerEvents="none">
            <MapView
              style={StyleSheet.absoluteFill}
              initialRegion={{ latitude: points[0].latitude, longitude: points[0].longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
              scrollEnabled={false} zoomEnabled={false} pitchEnabled={false} rotateEnabled={false} liteMode={true}
            >
              {points.length > 1 && (
                <Polyline coordinates={points.map(p => ({ latitude: p.latitude, longitude: p.longitude }))} strokeColor={C.PRIMARY} strokeWidth={3} />
              )}
            </MapView>
          </View>
        ) : (
          <View style={[styles.thumbnail, styles.noThumb]}>
            <Text style={{ fontSize: 26 }}>🗺️</Text>
          </View>
        )}
      </View>

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>{route.title}</Text>
          {route.sport && (
            <View style={styles.sportChip}>
              <Text style={styles.sportChipText}>{SPORT_LABEL[route.sport] ?? route.sport}</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <FontAwesomeIcon icon={faRuler} size={11} color={C.PRIMARY_LIGHT} />
            <Text style={styles.statText}>{dist} km</Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesomeIcon icon={faStopwatch} size={11} color={C.PRIMARY_LIGHT} />
            <Text style={styles.statText}>{timeStr}</Text>
          </View>
        </View>

        <View style={styles.socialRow}>
          <View style={styles.socialItem}>
            <FontAwesomeIcon icon={faHeart} size={12} color={C.LIKE} />
            <Text style={styles.socialText}>{likes_count ?? 0}</Text>
          </View>
          <View style={styles.socialItem}>
            <FontAwesomeIcon icon={faComment} size={12} color={C.TEXT_MUTED} />
            <Text style={styles.socialText}>{comments_count ?? 0}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: C.CARD,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 10,
    shadowColor: C.SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  thumbnailContainer: {
    width: 82,
    height: 82,
    borderRadius: 10,
    overflow: "hidden",
    marginRight: 12,
    backgroundColor: C.ACCENT_BG,
  },
  thumbnail: { width: "100%", height: "100%" },
  noThumb: { justifyContent: "center", alignItems: "center" },
  details: { flex: 1, justifyContent: "space-between" },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 15, fontWeight: "700", flex: 1, marginRight: 8, color: C.TEXT },
  sportChip: {
    backgroundColor: C.ACCENT_BG,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sportChipText: { fontSize: 10, fontWeight: "700", color: C.PRIMARY, textTransform: "capitalize" },
  statsRow: { flexDirection: "row", gap: 14, marginTop: 6 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 12, fontWeight: "600", color: C.TEXT_MUTED },
  socialRow: { flexDirection: "row", gap: 12, marginTop: 6 },
  socialItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  socialText: { fontSize: 12, color: C.TEXT_MUTED },
});
