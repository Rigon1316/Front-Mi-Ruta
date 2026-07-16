import React, { useState, useCallback } from "react";
import {
  View, Text, Image, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, RefreshControl, Alert
} from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { FeedAPI } from "../../src/services/api";
import { FeedPost } from "../../src/types";
import ProfilePostCard from "../../src/components/ProfilePostCard";
import { useFocusEffect, Tabs, useRouter } from "expo-router";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import { C } from "../../src/theme";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchPosts = async () => {
    if (!user) return;
    try {
      const { data } = await FeedAPI.listByUser(user.id);
      setPosts(data as FeedPost[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchPosts(); }, [user]));

  const onRefresh = () => { setRefreshing(true); fetchPosts(); };

  const handleOptions = () => {
    Alert.alert("Opciones", "¿Qué deseas hacer?", [
      { text: "Editar perfil", onPress: () => router.push("/edit-profile") },
      { text: "Dashboard", onPress: () => router.push("/dashboard") },
      { text: "Cerrar sesión", onPress: logout, style: "destructive" },
      { text: "Cancelar", style: "cancel" }
    ]);
  };

  if (!user) return null;

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.avatarWrapper}>
        <Image
          source={{ uri: user.avatar_url || `https://ui-avatars.com/api/?size=128&name=${user.name}&background=4A5C3F&color=fff` }}
          style={styles.avatar}
        />
      </View>
      <Text style={styles.name}>{user.nickname || user.name}</Text>
      {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
      <Text style={styles.email}>{user.email}</Text>

      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Mis Rutas  ·  {posts.length}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Tabs.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={handleOptions} style={styles.gearBtn}>
              <FontAwesomeIcon icon={faGear} size={20} color={C.PRIMARY} />
            </TouchableOpacity>
          ),
        }}
      />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProfilePostCard post={item} />}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.PRIMARY} colors={[C.PRIMARY]} />}
          ListEmptyComponent={<Text style={styles.emptyText}>Aún no tienes rutas publicadas. ¡Empieza hoy!</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.BG },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  gearBtn: { marginRight: 16, padding: 4 },
  headerContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 20,
    backgroundColor: C.SURFACE,
    marginBottom: 10,
  },
  avatarWrapper: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: C.PRIMARY,
    marginBottom: 14,
    overflow: "hidden",
  },
  avatar: { width: "100%", height: "100%" },
  name: { fontSize: 22, fontWeight: "800", color: C.TEXT, marginBottom: 4 },
  bio: { textAlign: "center", color: C.TEXT_MUTED, marginBottom: 6, lineHeight: 20 },
  email: { color: C.TEXT_LIGHT, fontSize: 13 },
  divider: { height: 1, backgroundColor: C.BORDER, width: "100%", marginTop: 20, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: C.PRIMARY, alignSelf: "flex-start", marginLeft: 4 },
  emptyText: { textAlign: "center", color: C.TEXT_MUTED, marginTop: 48, paddingHorizontal: 30, lineHeight: 22 },
});
