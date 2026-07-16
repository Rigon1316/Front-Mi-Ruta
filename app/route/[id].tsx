import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Image, ActivityIndicator,
  TouchableOpacity, Dimensions, Platform
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import MapView, { Polyline, Marker } from "react-native-maps";
import { Video, ResizeMode } from "expo-av";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faArrowLeft, faRuler, faStopwatch, faBolt, faCalendar,
  faPlay, faImage, faMap,
} from "@fortawesome/free-solid-svg-icons";
import { RoutesAPI } from "../../src/services/api";
import { SportRoute } from "../../src/types";
import { C } from "../../src/theme";

const { width } = Dimensions.get("window");

type RouteWithExtras = SportRoute & { description?: string; photos?: string[] };

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });
}

const SPORT_LABEL: Record<string, string> = {
  running: "Running", cycling: "Ciclismo", walking: "Caminata",
  hiking: "Senderismo", swimming: "Natación",
};

export default function RouteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [route, setRoute] = useState<RouteWithExtras | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await RoutesAPI.get(id);
        setRoute(data.route as any);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: C.BG }]}>
        <ActivityIndicator size="large" color={C.PRIMARY} />
      </View>
    );
  }

  if (!route) {
    return (
      <View style={[styles.center, { backgroundColor: C.BG }]}>
        <Text style={styles.emptyText}>No se encontró la ruta.</Text>
        <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}>
          <Text style={styles.goBackText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const points = route.route_points || [];
  const photos = route.photos ?? [];
  const videos = photos.filter(u => u.toLowerCase().endsWith(".mp4") || u.toLowerCase().endsWith(".mov"));
  const images = photos.filter(u => !u.toLowerCase().endsWith(".mp4") && !u.toLowerCase().endsWith(".mov"));
  const hasMedia = photos.length > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <FontAwesomeIcon icon={faArrowLeft} size={18} color={C.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{route.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Mapa */}
        <View style={styles.mapContainer}>
          {points.length > 0 ? (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: points[0]?.latitude ?? 0,
                longitude: points[0]?.longitude ?? 0,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              mapType="standard"
            >
              <Polyline
                coordinates={points.map(p => ({ latitude: p.latitude, longitude: p.longitude }))}
                strokeColor={C.PRIMARY}
                strokeWidth={5}
                lineJoin="round"
                lineCap="round"
              />
              {points.length > 0 && (
                <Marker coordinate={{ latitude: points[0].latitude, longitude: points[0].longitude }} pinColor={C.ACCENT} />
              )}
              {points.length > 1 && (
                <Marker coordinate={{ latitude: points[points.length - 1].latitude, longitude: points[points.length - 1].longitude }} />
              )}
            </MapView>
          ) : (
            <View style={styles.noMap}>
              <FontAwesomeIcon icon={faMap} size={36} color={C.TEXT_LIGHT} />
              <Text style={{ color: C.TEXT_MUTED, marginTop: 8 }}>Sin datos de ubicación</Text>
            </View>
          )}
        </View>

        {/* Título, deporte y fecha */}
        <View style={styles.infoCard}>
          <View style={styles.infoTop}>
            <Text style={styles.routeTitle}>{route.title}</Text>
            {route.sport && (
              <View style={styles.sportChip}>
                <Text style={styles.sportChipText}>{SPORT_LABEL[route.sport] ?? route.sport}</Text>
              </View>
            )}
          </View>
          {route.description ? (
            <Text style={styles.description}>{route.description}</Text>
          ) : null}
          {route.createdAt && (
            <View style={styles.dateRow}>
              <FontAwesomeIcon icon={faCalendar} size={12} color={C.TEXT_LIGHT} />
              <Text style={styles.dateText}>{formatDate(route.createdAt)}</Text>
            </View>
          )}
        </View>

        {/* Estadísticas */}
        <View style={styles.statsCard}>
          <StatItem icon={faRuler} label="Distancia" value={`${((route.distance ?? 0) / 1000).toFixed(2)} km`} />
          <View style={styles.statDivider} />
          <StatItem icon={faStopwatch} label="Duración" value={formatDuration(route.duration ?? 0)} />
          <View style={styles.statDivider} />
          <StatItem icon={faBolt} label="Vel. media" value={`${((route.average_speed ?? 0) * 3.6).toFixed(1)} km/h`} />
        </View>

        {/* Galería de imágenes */}
        {images.length > 0 && (
          <View style={styles.mediaSection}>
            <View style={styles.sectionHeader}>
              <FontAwesomeIcon icon={faImage} size={15} color={C.PRIMARY} />
              <Text style={styles.sectionTitle}>Fotos ({images.length})</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaScroll}>
              {images.map(uri => (
                <Image key={uri} source={{ uri }} style={styles.mediaItem} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Galería de videos */}
        {videos.length > 0 && (
          <View style={styles.mediaSection}>
            <View style={styles.sectionHeader}>
              <FontAwesomeIcon icon={faPlay} size={14} color={C.PRIMARY} />
              <Text style={styles.sectionTitle}>Videos ({videos.length})</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mediaScroll}>
              {videos.map(uri => (
                <View key={uri} style={styles.videoWrapper}>
                  <Video
                    source={{ uri }}
                    style={StyleSheet.absoluteFill}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={false}
                    isMuted
                  />
                  {/* Overlay de reproducción */}
                  <View style={styles.playOverlay}>
                    <View style={styles.playBtn}>
                      <FontAwesomeIcon icon={faPlay} size={18} color="#fff" />
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

function StatItem({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.statContainer}>
      <View style={styles.statIconBadge}>
        <FontAwesomeIcon icon={icon} size={14} color={C.PRIMARY} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.BG },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 54 : 20,
    paddingBottom: 14,
    backgroundColor: C.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: C.BORDER,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: C.TEXT, flex: 1, textAlign: "center" },
  scrollContent: { paddingBottom: 50 },

  // Mapa
  mapContainer: { width: "100%", height: 280, backgroundColor: C.BORDER },
  map: { width: "100%", height: "100%" },
  noMap: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Info
  infoCard: {
    backgroundColor: C.SURFACE,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.BORDER,
  },
  infoTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  routeTitle: { fontSize: 22, fontWeight: "800", color: C.TEXT, flex: 1, marginRight: 10 },
  sportChip: { backgroundColor: C.ACCENT_BG, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  sportChipText: { fontSize: 11, fontWeight: "700", color: C.PRIMARY },
  description: { color: C.TEXT_MUTED, lineHeight: 22, fontSize: 15, marginBottom: 10 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  dateText: { fontSize: 13, color: C.TEXT_LIGHT },

  // Estadísticas
  statsCard: {
    flexDirection: "row",
    backgroundColor: C.SURFACE,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: C.BORDER,
    shadowColor: C.SHADOW,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statContainer: { flex: 1, alignItems: "center" },
  statIconBadge: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.ACCENT_BG, justifyContent: "center", alignItems: "center", marginBottom: 8,
  },
  statValue: { fontSize: 16, fontWeight: "800", color: C.TEXT, marginBottom: 3 },
  statLabel: { fontSize: 11, fontWeight: "600", color: C.TEXT_MUTED },
  statDivider: { width: 1, backgroundColor: C.BORDER },

  // Media
  mediaSection: { marginTop: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: C.PRIMARY },
  mediaScroll: { paddingHorizontal: 16, gap: 10 },
  mediaItem: { width: width * 0.65, height: 200, borderRadius: 16, backgroundColor: C.ACCENT_BG },
  videoWrapper: {
    width: width * 0.65,
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
    position: "relative",
  },
  playOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "center", alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  playBtn: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.8)",
    justifyContent: "center", alignItems: "center",
  },
  emptyText: { color: C.TEXT_MUTED, marginBottom: 20, fontSize: 16 },
  goBackBtn: { backgroundColor: C.PRIMARY, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  goBackText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
