import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Dimensions, FlatList,
} from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import { Video, ResizeMode } from "expo-av";
import { useRouter } from "expo-router";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faHeart as faHeartSolid, faLocationDot, faStopwatch, faBolt } from "@fortawesome/free-solid-svg-icons";
import { faHeart, faComment } from "@fortawesome/free-regular-svg-icons";
import { FeedPost } from "../types";
import { FeedAPI } from "../services/api";
import { C } from "../theme";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = SCREEN_W - 28;

const SPORT_LABEL: Record<string, string> = {
  running: "Running", cycling: "Ciclismo", walking: "Caminata",
  hiking: "Senderismo", swimming: "Natación",
};

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}:${String(s).padStart(2, "0")}`;
}

export default function PostCard({ post }: { post: FeedPost }) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likes, setLikes] = useState(post.likes_count ?? 0);
  const [comments] = useState(post.comments_count ?? 0);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const route = post.route;
  const points: any[] = route?.route_points ?? [];

  const carouselItems: { type: "map" | "photo" | "video"; uri?: string }[] = [];
  if (points.length > 0) carouselItems.push({ type: "map" });
  (route?.photos ?? []).forEach((uri: string) => {
    if (uri.toLowerCase().endsWith(".mp4") || uri.toLowerCase().endsWith(".mov")) {
      carouselItems.push({ type: "video", uri });
    } else {
      carouselItems.push({ type: "photo", uri });
    }
  });

  async function toggleLike() {
    const next = !liked;
    setLiked(next);
    setLikes((l: number) => l + (next ? 1 : -1));
    try {
      await FeedAPI.toggleLike(post.id, next);
    } catch {
      setLiked(!next);
      setLikes((l: number) => l + (next ? -1 : 1));
    }
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: post.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user?.name ?? "U")}&background=4A5C3F&color=fff` }}
          style={styles.avatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.username}>{post.user?.name ?? "Usuario"}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
            {route?.sport && (
              <View style={styles.sportChip}>
                <Text style={styles.sportChipText}>{SPORT_LABEL[route.sport] ?? route.sport}</Text>
              </View>
            )}
            <Text style={styles.date}>
              {new Date(post.createdAt).toLocaleDateString("es", { day: "2-digit", month: "short" })}
            </Text>
          </View>
        </View>
      </View>

      {/* Carousel */}
      {carouselItems.length > 0 && (
        <View>
          <FlatList
            data={carouselItems}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_: any, i: number) => String(i)}
            onMomentumScrollEnd={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / CARD_W);
              setCarouselIndex(idx);
            }}
            renderItem={({ item, index }) => {
              if (item.type === "map") {
                return (
                  <TouchableOpacity style={styles.slide} activeOpacity={0.9} onPress={() => router.push(`/route/${route?.id}`)}>
                    <View style={styles.mapHint} pointerEvents="none">
                      <FontAwesomeIcon icon={faLocationDot} size={10} color="#fff" />
                      <Text style={styles.mapHintText}> Ver ruta</Text>
                    </View>
                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                      <MapView
                        style={StyleSheet.absoluteFill}
                        initialRegion={{ latitude: points[0].latitude, longitude: points[0].longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
                        scrollEnabled={false} zoomEnabled={false} pitchEnabled={false} rotateEnabled={false} liteMode={true}
                      >
                        {points.length > 1 && (
                          <Polyline coordinates={points.map(p => ({ latitude: p.latitude, longitude: p.longitude }))} strokeColor={C.PRIMARY} strokeWidth={4} />
                        )}
                        <Marker coordinate={{ latitude: points[points.length - 1].latitude, longitude: points[points.length - 1].longitude }} />
                      </MapView>
                    </View>
                  </TouchableOpacity>
                );
              }
              if (item.type === "video") {
                const isActive = carouselIndex === index;
                return (
                  <View style={styles.slide}>
                    <Video source={{ uri: item.uri! }} style={StyleSheet.absoluteFill} useNativeControls={false} resizeMode={ResizeMode.COVER} isLooping shouldPlay={isActive} />
                  </View>
                );
              }
              return (
                <View style={styles.slide}>
                  <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                </View>
              );
            }}
          />
          {carouselItems.length > 1 && (
            <View style={styles.dots}>
              {carouselItems.map((_, i) => (
                <View key={i} style={[styles.dot, carouselIndex === i && styles.dotActive]} />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <FontAwesomeIcon icon={faLocationDot} size={12} color={C.PRIMARY} />
          <Text style={styles.statText}>{((route?.distance ?? 0) / 1000).toFixed(2)} km</Text>
        </View>
        <View style={styles.statItem}>
          <FontAwesomeIcon icon={faStopwatch} size={12} color={C.PRIMARY} />
          <Text style={styles.statText}>{formatDuration(route?.duration ?? 0)}</Text>
        </View>
        <View style={styles.statItem}>
          <FontAwesomeIcon icon={faBolt} size={12} color={C.PRIMARY} />
          <Text style={styles.statText}>{((route?.average_speed ?? 0) * 3.6).toFixed(1)} km/h</Text>
        </View>
      </View>

      {/* Title / Desc */}
      {route?.title ? <Text style={styles.title}>{route.title}</Text> : null}
      {post.description ? <Text style={styles.desc}>{post.description}</Text> : null}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={toggleLike} style={styles.actionBtn}>
          <FontAwesomeIcon icon={liked ? faHeartSolid : faHeart} size={18} color={liked ? C.LIKE : C.TEXT_MUTED} />
          <Text style={[styles.actionText, liked && { color: C.LIKE }]}>{likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/post/${post.id}/comments` as any)}>
          <FontAwesomeIcon icon={faComment} size={18} color={C.TEXT_MUTED} />
          <Text style={styles.actionText}>{comments}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.CARD,
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: C.SHADOW,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.ACCENT_BG,
    borderWidth: 2,
    borderColor: C.ACCENT,
  },
  username: { fontWeight: "700", fontSize: 14, color: C.TEXT },
  sportChip: {
    backgroundColor: C.ACCENT_BG,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sportChipText: { fontSize: 11, fontWeight: "600", color: C.PRIMARY },
  date: { fontSize: 12, color: C.TEXT_LIGHT },
  slide: { width: SCREEN_W - 28, height: 230 },
  mapHint: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  mapHintText: { color: "#fff", fontSize: 11 },
  dots: { flexDirection: "row", justifyContent: "center", paddingVertical: 8, gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.BORDER },
  dotActive: { backgroundColor: C.PRIMARY, width: 16, borderRadius: 3 },
  stats: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: C.ACCENT_BG,
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  statText: { fontSize: 12, fontWeight: "600", color: C.PRIMARY },
  title: { fontWeight: "700", fontSize: 15, color: C.TEXT, paddingHorizontal: 14, paddingTop: 10 },
  desc: { fontSize: 13, color: C.TEXT_MUTED, paddingHorizontal: 14, paddingTop: 4, paddingBottom: 6 },
  actions: {
    flexDirection: "row",
    gap: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.BORDER,
  },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionText: { fontSize: 14, color: C.TEXT_MUTED, fontWeight: "600" },
});
