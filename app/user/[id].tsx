import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faRoute } from "@fortawesome/free-solid-svg-icons";
import { UsersAPI, FeedAPI } from "../../src/services/api";
import { FeedPost, User } from "../../src/types";
import ProfilePostCard from "../../src/components/ProfilePostCard";
import { C } from "../../src/theme";

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, postsRes] = await Promise.all([
        UsersAPI.getProfile(id as string),
        FeedAPI.listByUser(id as string)
      ]);
      setProfile(profileRes.data as User);
      setPosts(postsRes.data as FeedPost[]);
    } catch (e) {
      console.error("Error cargando perfil público", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={C.PRIMARY} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={styles.emptyText}>Usuario no encontrado.</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.avatarWrapper}>
        <Image
          source={{ uri: profile.avatar_url || profile.profilePhoto || `https://ui-avatars.com/api/?size=128&name=${profile.name}&background=4A5C3F&color=fff` }}
          style={styles.avatar}
        />
      </View>
      <Text style={styles.name}>{profile.nickname || profile.name}</Text>
      {profile.nickname ? <Text style={styles.realName}>{profile.name}</Text> : null}
      {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

      <View style={styles.divider} />
      <View style={styles.sectionHeader}>
        <FontAwesomeIcon icon={faRoute} size={14} color={C.PRIMARY} />
        <Text style={styles.sectionTitle}>Rutas  ·  {posts.length}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Back button overlay */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <FontAwesomeIcon icon={faArrowLeft} size={18} color={C.PRIMARY} />
      </TouchableOpacity>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProfilePostCard post={item} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={<Text style={styles.emptyText}>Este usuario aún no tiene rutas publicadas.</Text>}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.BG },
  backBtn: {
    position: "absolute",
    top: Platform?.OS === "ios" ? 54 : 24,
    left: 16,
    zIndex: 10,
    backgroundColor: C.SURFACE,
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.BORDER,
    shadowColor: C.SHADOW,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 90,
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
  name: { fontSize: 22, fontWeight: "800", color: C.TEXT },
  realName: { fontSize: 14, color: C.TEXT_MUTED, marginTop: 2 },
  bio: { textAlign: "center", color: C.TEXT_MUTED, marginTop: 10, lineHeight: 20 },
  divider: { height: 1, backgroundColor: C.BORDER, width: "100%", marginTop: 20, marginBottom: 14 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", marginLeft: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: C.PRIMARY },
  emptyText: { textAlign: "center", color: C.TEXT_MUTED, marginTop: 48, paddingHorizontal: 30, lineHeight: 22 },
});
