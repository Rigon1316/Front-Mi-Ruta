import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image,
  Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faCamera } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../src/context/AuthContext";
import { UsersAPI, UploadAPI } from "../src/services/api";
import { C } from "../src/theme";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [nickname, setNickname] = useState(user?.nickname || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [profilePhoto, setProfilePhoto] = useState(user?.avatar_url || user?.profilePhoto || "");
  const [saving, setSaving] = useState(false);

  async function handlePickImage() {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permiso requerido", "Activa el permiso para acceder a tu galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!result.canceled && result.assets[0].uri) {
      setProfilePhoto(result.assets[0].uri);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      let finalPhotoUrl = profilePhoto;
      if (profilePhoto && profilePhoto.startsWith("file://")) {
        const { data } = await UploadAPI.uploadPhoto(profilePhoto);
        finalPhotoUrl = data.url;
      }
      await UsersAPI.updateProfile(user!.id, {
        nickname: nickname.trim(),
        bio: bio.trim(),
        profilePhoto: finalPhotoUrl
      });
      await refreshProfile();
      Alert.alert("¡Listo!", "Perfil actualizado correctamente.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message || "No se pudo actualizar el perfil.");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesomeIcon icon={faArrowLeft} size={18} color={C.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} style={{ backgroundColor: C.BG }}>
        {/* Photo Picker */}
        <View style={styles.photoSection}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: profilePhoto || `https://ui-avatars.com/api/?size=128&name=${name}&background=4A5C3F&color=fff` }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.cameraOverlay} onPress={handlePickImage}>
              <FontAwesomeIcon icon={faCamera} size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.changePhotoText}>Toca para cambiar la foto</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={name}
              editable={false}
            />
            <Text style={styles.hint}>El nombre no se puede cambiar.</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nickname (Usuario)</Text>
            <TextInput
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
              placeholder="@tunickname"
              placeholderTextColor={C.TEXT_LIGHT}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Biografía</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Cuéntanos algo sobre ti..."
              placeholderTextColor={C.TEXT_LIGHT}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Guardar Cambios</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    backgroundColor: C.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: C.BORDER,
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: C.TEXT },
  container: { padding: 24, flexGrow: 1 },
  photoSection: { alignItems: "center", marginBottom: 32, marginTop: 8 },
  avatarWrapper: { position: "relative", marginBottom: 10 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: C.PRIMARY },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: C.PRIMARY,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: C.SURFACE,
  },
  changePhotoText: { color: C.PRIMARY_LIGHT, fontWeight: "600", fontSize: 13 },
  form: { gap: 4, marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "700", color: C.PRIMARY, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    borderColor: C.BORDER,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    backgroundColor: C.SURFACE,
    color: C.TEXT,
  },
  inputDisabled: { backgroundColor: "#F0F0EC", color: C.TEXT_MUTED },
  bioInput: { height: 110, textAlignVertical: "top" },
  hint: { fontSize: 11, color: C.TEXT_LIGHT, marginTop: 4, marginLeft: 4 },
  saveBtn: {
    backgroundColor: C.PRIMARY,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: C.PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
