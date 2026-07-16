import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { MessagesAPI } from "../../src/services/api";
import { Conversation } from "../../src/types";
import { C } from "../../src/theme";

export default function MessagesScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await MessagesAPI.conversations();
        setConversations((data as any).conversations ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.PRIMARY} />
      </View>
    );
  }

  return (
    <FlatList
      data={conversations}
      keyExtractor={(item) => item.id}
      style={{ backgroundColor: C.BG }}
      contentContainerStyle={{ padding: 14 }}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.row} onPress={() => router.push(`/chat/${item.id}`)}>
          <Image
            source={{ uri: item.participant.avatar_url || `https://ui-avatars.com/api/?name=${item.participant.name}&background=4A5C3F&color=fff` }}
            style={styles.avatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.participant.name}</Text>
            <Text style={styles.preview} numberOfLines={1}>
              {item.lastMessage?.content ?? "Sin mensajes todavía"}
            </Text>
          </View>
          {item.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={{ color: C.TEXT_MUTED }}>No tienes conversaciones aún.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.SURFACE,
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.BORDER,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.ACCENT_BG,
    borderWidth: 2,
    borderColor: C.ACCENT,
  },
  name: { fontWeight: "700", color: C.TEXT, fontSize: 15 },
  preview: { color: C.TEXT_MUTED, fontSize: 13, marginTop: 2 },
  badge: {
    backgroundColor: C.PRIMARY,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
});
