import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { MessagesAPI } from "../../src/services/api";
import { connectSocket } from "../../src/services/socket";
import { useAuth } from "../../src/context/AuthContext";
import { Message } from "../../src/types";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    (async () => {
      const { data } = await MessagesAPI.history(id);
      setMessages(data.messages ?? []);
    })();

    let unsub: (() => void) | undefined;
    (async () => {
      const socket = await connectSocket();
      socket.emit("chat:join", { conversationId: id });
      const handler = (msg: Message) => {
        if (msg.conversation_id === id) {
          setMessages((prev) => [...prev, msg]);
        }
      };
      socket.on("message:new", handler);
      unsub = () => socket.off("message:new", handler);
    })();

    return () => unsub?.();
  }, [id]);

  async function handleSend() {
    const content = text.trim();
    if (!content) return;
    setText("");
    try {
      const { data } = await MessagesAPI.send(id, content);
      setMessages((prev) => [...prev, data.message]);
      listRef.current?.scrollToEnd({ animated: true });
    } catch {
      // si falla el envío, se podría reintentar o marcar el mensaje como no enviado
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f5f6fa" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 14 }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.sender_id === user?.id ? styles.mine : styles.theirs,
            ]}
          >
            <Text style={item.sender_id === user?.id ? { color: "#fff" } : {}}>{item.content}</Text>
          </View>
        )}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bubble: { padding: 10, borderRadius: 12, marginBottom: 8, maxWidth: "75%" },
  mine: { backgroundColor: "#2f6fed", alignSelf: "flex-end" },
  theirs: { backgroundColor: "#fff", alignSelf: "flex-start" },
  inputRow: { flexDirection: "row", padding: 10, backgroundColor: "#fff", gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  sendBtn: { backgroundColor: "#2f6fed", borderRadius: 20, paddingHorizontal: 16, justifyContent: "center" },
});
