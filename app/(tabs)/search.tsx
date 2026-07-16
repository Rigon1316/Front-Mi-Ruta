import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faMagnifyingGlass, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { UsersAPI } from "../../src/services/api";
import { User } from "../../src/types";
import { C } from "../../src/theme";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length > 1) {
        performSearch(query.trim());
      } else {
        setResults([]);
      }
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const performSearch = async (text: string) => {
    setLoading(true);
    try {
      const { data } = await UsersAPI.search(text);
      setResults(data as User[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity style={styles.userCard} onPress={() => router.push(`/user/${item.id}` as any)}>
      <Image
        source={{ uri: item.avatar_url || item.profilePhoto || `https://ui-avatars.com/api/?size=128&name=${item.name}&background=4A5C3F&color=fff` }}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.name}>{item.nickname || item.name}</Text>
        {item.nickname ? <Text style={styles.realName}>{item.name}</Text> : null}
      </View>
      <FontAwesomeIcon icon={faChevronRight} size={14} color={C.TEXT_LIGHT} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBarContainer}>
        <FontAwesomeIcon icon={faMagnifyingGlass} size={16} color={C.TEXT_MUTED} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nickname o nombre..."
          placeholderTextColor={C.TEXT_LIGHT}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={C.PRIMARY} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {query.trim().length > 1
                ? "No se encontraron usuarios con ese nombre."
                : "Escribe al menos 2 letras para buscar."}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.BG },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.SURFACE,
    margin: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.BORDER,
    gap: 10,
    shadowColor: C.SHADOW,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: { flex: 1, paddingVertical: 13, fontSize: 15, color: C.TEXT },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.SURFACE,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
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
  userInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: "700", color: C.TEXT },
  realName: { fontSize: 12, color: C.TEXT_MUTED, marginTop: 2 },
  emptyText: { textAlign: "center", color: C.TEXT_MUTED, marginTop: 48, fontSize: 15, lineHeight: 22, paddingHorizontal: 30 },
});
