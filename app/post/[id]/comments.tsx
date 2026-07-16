import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
  Image, KeyboardAvoidingView, Platform, ActivityIndicator
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FeedAPI } from "../../../src/services/api";
import { C } from "../../../src/theme";

export default function CommentsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => { fetchComments(); }, [id]);

  async function fetchComments() {
    try {
      const { data } = await FeedAPI.getComments(id as string);
      setComments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!inputText.trim() || sending) return;
    setSending(true);
    try {
      const { data } = await FeedAPI.addComment(id as string, inputText.trim());
      setComments(prev => [...prev, data]);
      setInputText("");
    } catch (e) {
      console.error(e);
      alert("Error al enviar comentario");
    } finally {
      setSending(false);
    }
  }

  const renderComment = ({ item }: { item: any }) => {
    const user = item.users;
    return (
      <View style={styles.commentRow}>
        <Image
          source={{ uri: user.profilePhoto || `https://ui-avatars.com/api/?size=128&name=${user.name}&background=4A5C3F&color=fff` }}
          style={styles.avatar}
        />
        <View style={styles.bubble}>
          <Text style={styles.username}>{user.nickname || user.name}</Text>
          <Text style={styles.text}>{item.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesomeIcon icon={faArrowLeft} size={18} color={C.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comentarios</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={C.PRIMARY} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay comentarios aún. ¡Sé el primero!</Text>}
        />
      )}

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Añade un comentario..."
          placeholderTextColor={C.TEXT_LIGHT}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!inputText.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          {sending
            ? <ActivityIndicator color="#fff" size="small" />
            : <FontAwesomeIcon icon={faPaperPlane} size={16} color="#fff" />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.BG },
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
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: C.TEXT },
  list: { padding: 16, paddingBottom: 8 },
  emptyText: { textAlign: "center", color: C.TEXT_MUTED, marginTop: 48, lineHeight: 22 },
  commentRow: { flexDirection: "row", marginBottom: 14, gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.ACCENT_BG, borderWidth: 2, borderColor: C.ACCENT },
  bubble: {
    flex: 1,
    backgroundColor: C.SURFACE,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.BORDER,
  },
  username: { fontWeight: "700", color: C.PRIMARY, marginBottom: 3, fontSize: 13 },
  text: { color: C.TEXT, lineHeight: 20, fontSize: 14 },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    paddingBottom: Platform.OS === "ios" ? 30 : 12,
    borderTopWidth: 1,
    borderTopColor: C.BORDER,
    alignItems: "flex-end",
    backgroundColor: C.SURFACE,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: C.BG,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    maxHeight: 100,
    fontSize: 15,
    borderWidth: 1,
    borderColor: C.BORDER,
    color: C.TEXT,
  },
  sendBtn: {
    backgroundColor: C.PRIMARY,
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { opacity: 0.5 },
});
