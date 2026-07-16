import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, FlatList, Text, StyleSheet, RefreshControl, ActivityIndicator } from "react-native";
import { supabase } from "../../src/services/supabase";
import { FeedAPI } from "../../src/services/api";
import { FeedPost } from "../../src/types";
import PostCard from "../../src/components/PostCard";
import { C } from "../../src/theme";

export default function FeedScreen() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await FeedAPI.list();
      setPosts((data as any) ?? []);
      setError(null);
    } catch (e: any) {
      setError(e.message || "No se pudo cargar el feed.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const updateLikes = useCallback(async (publicationId: string) => {
    const count = await FeedAPI.getLikesCount(publicationId);
    setPosts(prev => prev.map(p => p.id === publicationId ? { ...p, likes_count: count } : p));
  }, []);

  const updateComments = useCallback(async (publicationId: string) => {
    const count = await FeedAPI.getCommentsCount(publicationId);
    setPosts(prev => prev.map(p => p.id === publicationId ? { ...p, comments_count: count } : p));
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("feed-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "publications" }, () => load())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "likes" }, payload => updateLikes(payload.new.publicationId))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "likes" }, payload => { if (payload.old?.publicationId) updateLikes(payload.old.publicationId); })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments" }, payload => updateComments(payload.new.publicationId))
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [load, updateLikes, updateComments]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.PRIMARY} />
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.list}
      style={{ backgroundColor: C.BG }}
      renderItem={({ item }) => <PostCard post={item} />}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={C.PRIMARY}
          colors={[C.PRIMARY]}
        />
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.empty}>
            {error ?? "Aún no hay publicaciones. ¡Crea tu primera ruta!"}
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 14, paddingTop: 10 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  empty: { color: C.TEXT_MUTED, textAlign: "center", paddingHorizontal: 30, lineHeight: 22 },
});
