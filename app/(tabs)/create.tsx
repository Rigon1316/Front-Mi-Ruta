import React, { useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, Alert, ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform
} from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Video, ResizeMode } from "expo-av";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
  faPlay, faCamera, faImage, faTimes,
  faPersonRunning, faBicycle, faShoePrints, faMountainSun, faPersonSwimming,
  faLocationArrow, faStop, faFloppyDisk, faRuler, faStopwatch, faBolt, faDumbbell
} from "@fortawesome/free-solid-svg-icons";
import { useLocationTracking } from "../../src/hooks/useLocationTracking";
import { RoutesAPI, UploadAPI } from "../../src/services/api";
import { Sport } from "../../src/types";
import { C } from "../../src/theme";

const { width } = Dimensions.get("window");

export function getSportIcon(sportName: string) {
  if (!sportName) return faDumbbell;
  const s = sportName.toLowerCase();
  if (s.includes("run") || s.includes("correr") || s.includes("trote") || s.includes("maraton")) return faPersonRunning;
  if (s.includes("bici") || s.includes("ciclismo") || s.includes("cycle") || s.includes("bike")) return faBicycle;
  if (s.includes("camin") || s.includes("walk") || s.includes("paseo")) return faShoePrints;
  if (s.includes("sender") || s.includes("hik") || s.includes("montaña") || s.includes("trek")) return faMountainSun;
  if (s.includes("nadar") || s.includes("swim") || s.includes("piscina") || s.includes("agua")) return faPersonSwimming;
  return faDumbbell;
}

export default function CreateRouteScreen() {
  const router = useRouter();
  const { isTracking, points, distance, duration, averageSpeed, error, start, stop, reset } =
    useLocationTracking();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sport, setSport] = useState<Sport>("running");
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function handlePickMedia() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permiso requerido", "Activa el permiso para acceder a tu galería."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.6 });
    if (!result.canceled && result.assets[0].uri) setPhotos(prev => [...prev, result.assets[0].uri]);
  }

  async function handleOpenCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permiso requerido", "Activa el permiso de cámara."); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.6 });
    if (!result.canceled && result.assets[0].uri) setPhotos(prev => [...prev, result.assets[0].uri]);
  }

  async function handleSave() {
    if (!title.trim()) { Alert.alert("Falta el título", "Ponle un nombre a tu ruta."); return; }
    if (points.length === 0) { Alert.alert("Sin puntos GPS", "Inicia el seguimiento y graba al menos un tramo."); return; }
    setSaving(true);
    try {
      const uploadedUrls: string[] = [];
      for (const uri of photos) {
        try { const { data } = await UploadAPI.uploadPhoto(uri); uploadedUrls.push(data.url); } catch {}
      }
      await RoutesAPI.create({
        title: title.trim(), description: description.trim(), sport, distance, duration,
        average_speed: averageSpeed, route_points: points, photos: uploadedUrls,
      });
      Alert.alert("¡Ruta guardada!", "Tu actividad se publicó correctamente.");
      setTitle(""); setDescription(""); setSport("running"); setPhotos([]); reset();
      router.replace("/(tabs)/feed");
    } catch (e: any) {
      Alert.alert("Error", e.message || "No se pudo guardar la ruta.");
    } finally {
      setSaving(false);
    }
  }

  const hrs = Math.floor(duration / 3600);
  const mins = Math.floor((duration % 3600) / 60);
  const secs = duration % 60;
  const durStr = hrs > 0
    ? `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${mins}:${String(secs).padStart(2, "0")}`;

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: C.BG }} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView style={{ backgroundColor: C.BG }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.h1}>Nueva Ruta</Text>
          <Text style={styles.h1Sub}>Graba tu actividad GPS</Text>
        </View>

        {/* Mapa */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: points[0]?.latitude ?? -0.1807,
              longitude: points[0]?.longitude ?? -78.4678,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            mapType="standard"
          >
            {points.length > 1 && (
              <Polyline
                coordinates={points.map(p => ({ latitude: p.latitude, longitude: p.longitude }))}
                strokeColor={C.PRIMARY}
                strokeWidth={5}
                lineJoin="round"
              />
            )}
            {points.length > 0 && (
              <Marker coordinate={{ latitude: points[points.length - 1].latitude, longitude: points[points.length - 1].longitude }} />
            )}
          </MapView>

          {/* Indicador de grabación */}
          {isTracking && (
            <View style={styles.recordingBadge}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Grabando</Text>
            </View>
          )}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {/* Stats */}
        <View style={styles.statsCard}>
          <StatBadge icon={faRuler} label="Distancia" value={`${(distance / 1000).toFixed(2)} km`} />
          <View style={styles.statDivider} />
          <StatBadge icon={faStopwatch} label="Tiempo" value={durStr} />
          <View style={styles.statDivider} />
          <StatBadge icon={faBolt} label="Vel. media" value={`${(averageSpeed * 3.6).toFixed(1)} km/h`} />
        </View>

        {/* Botón GPS */}
        <TouchableOpacity
          style={[styles.trackBtn, { backgroundColor: isTracking ? "#D94040" : C.PRIMARY }]}
          onPress={isTracking ? stop : start}
          activeOpacity={0.85}
        >
          <FontAwesomeIcon icon={isTracking ? faStop : faLocationArrow} size={18} color="#fff" />
          <Text style={styles.trackBtnText}>{isTracking ? "Detener grabación" : "Iniciar grabación GPS"}</Text>
        </TouchableOpacity>

        {/* Formulario */}
        <View style={styles.formSection}>
          <Text style={styles.fieldLabel}>Título de la ruta</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Carrera mañanera en el parque"
            placeholderTextColor={C.TEXT_LIGHT}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.fieldLabel}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Cuéntanos cómo fue tu actividad..."
            placeholderTextColor={C.TEXT_LIGHT}
            multiline
            value={description}
            onChangeText={setDescription}
          />

          {/* Deportes */}
          <Text style={styles.fieldLabel}>Tipo de actividad</Text>
          <View style={styles.sportInputContainer}>
            <View style={styles.sportInputIcon}>
              <FontAwesomeIcon icon={getSportIcon(sport)} size={16} color={C.PRIMARY} />
            </View>
            <TextInput
              style={styles.sportInput}
              placeholder="Ej. Tenis, Yoga, Escalada..."
              placeholderTextColor={C.TEXT_LIGHT}
              value={sport}
              onChangeText={setSport}
            />
          </View>

          {/* Multimedia */}
          <Text style={styles.fieldLabel}>Fotos y videos</Text>
          <View style={styles.mediaButtons}>
            <TouchableOpacity style={styles.mediaBtn} onPress={handleOpenCamera}>
              <FontAwesomeIcon icon={faCamera} size={16} color={C.PRIMARY} />
              <Text style={styles.mediaBtnText}>Cámara</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaBtn} onPress={handlePickMedia}>
              <FontAwesomeIcon icon={faImage} size={16} color={C.PRIMARY} />
              <Text style={styles.mediaBtnText}>Galería</Text>
            </TouchableOpacity>
          </View>

          {/* Thumbnails */}
          {photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {photos.map((uri, idx) => {
                const isVideo = uri.toLowerCase().endsWith(".mp4") || uri.toLowerCase().endsWith(".mov");
                return (
                  <View key={uri} style={styles.thumbWrapper}>
                    {isVideo ? (
                      <View style={styles.videoThumb}>
                        <Video source={{ uri }} style={StyleSheet.absoluteFill} resizeMode={ResizeMode.COVER} shouldPlay={false} />
                        <View style={styles.playOverlay}>
                          <FontAwesomeIcon icon={faPlay} size={18} color="#fff" />
                        </View>
                      </View>
                    ) : (
                      <Image source={{ uri }} style={styles.thumb} />
                    )}
                    <TouchableOpacity style={styles.removeBtn} onPress={() => setPhotos(prev => prev.filter((_, i) => i !== idx))}>
                      <FontAwesomeIcon icon={faTimes} size={10} color="#fff" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Guardar */}
        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <FontAwesomeIcon icon={faFloppyDisk} size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Guardar y publicar ruta</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function StatBadge({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <View style={styles.statIconBadge}>
        <FontAwesomeIcon icon={icon} size={13} color={C.PRIMARY} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 50 },
  pageHeader: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: C.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: C.BORDER,
  },
  h1: { fontSize: 26, fontWeight: "900", color: C.TEXT },
  h1Sub: { fontSize: 14, color: C.TEXT_MUTED, marginTop: 2 },
  mapContainer: {
    width: "100%",
    height: 240,
    backgroundColor: C.BORDER,
    position: "relative",
  },
  map: { width: "100%", height: "100%" },
  recordingBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(217,64,64,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  recordingText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  error: { color: "#D94040", marginHorizontal: 16, marginTop: 8 },
  statsCard: {
    flexDirection: "row",
    backgroundColor: C.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: C.BORDER,
    paddingVertical: 16,
  },
  statItem: { flex: 1, alignItems: "center" },
  statIconBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.ACCENT_BG, justifyContent: "center", alignItems: "center", marginBottom: 6 },
  statValue: { fontSize: 15, fontWeight: "800", color: C.TEXT },
  statLabel: { fontSize: 11, fontWeight: "600", color: C.TEXT_MUTED },
  statDivider: { width: 1, backgroundColor: C.BORDER },
  trackBtn: {
    flexDirection: "row",
    margin: 16,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: C.PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  trackBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  formSection: { paddingHorizontal: 16 },
  fieldLabel: { fontSize: 12, fontWeight: "700", color: C.PRIMARY, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginTop: 14 },
  input: {
    borderWidth: 1, borderColor: C.BORDER, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15,
    backgroundColor: C.SURFACE, color: C.TEXT, marginBottom: 4,
  },
  textarea: { height: 90, textAlignVertical: "top" },
  sportInputContainer: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: C.BORDER, borderRadius: 12,
    backgroundColor: C.SURFACE, marginBottom: 4,
    paddingHorizontal: 14,
  },
  sportInputIcon: { marginRight: 10, width: 24, alignItems: "center" },
  sportInput: { flex: 1, paddingVertical: 13, fontSize: 15, color: C.TEXT },
  mediaButtons: { flexDirection: "row", gap: 10, marginBottom: 12 },
  mediaBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderWidth: 1, borderColor: C.ACCENT, borderRadius: 12,
    paddingVertical: 12, backgroundColor: C.SURFACE,
  },
  mediaBtnText: { fontWeight: "700", color: C.PRIMARY, fontSize: 14 },
  thumbWrapper: { position: "relative", marginRight: 10 },
  thumb: { width: 88, height: 88, borderRadius: 12 },
  videoThumb: { width: 88, height: 88, borderRadius: 12, overflow: "hidden", backgroundColor: "#000" },
  playOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: "center", alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  removeBtn: {
    position: "absolute", top: 4, right: 4, backgroundColor: "rgba(0,0,0,0.6)",
    width: 20, height: 20, borderRadius: 10, justifyContent: "center", alignItems: "center",
  },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, backgroundColor: C.PRIMARY, marginHorizontal: 16,
    marginTop: 20, paddingVertical: 16, borderRadius: 14,
    shadowColor: C.PRIMARY, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
