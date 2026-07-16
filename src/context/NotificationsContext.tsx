import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { NotificationsAPI } from "../services/api";
import { connectSocket, disconnectSocket } from "../services/socket";
import { AppNotification } from "../types";
import { useAuth } from "./AuthContext";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const socketRef = useRef<any>(null);

  async function refresh() {
    try {
      const { data } = await NotificationsAPI.list();
      setNotifications(data.notifications ?? []);
    } catch {
      // silencioso: se reintenta en el siguiente refresh
    }
  }

  function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    NotificationsAPI.markRead(id).catch(() => {});
  }

  // Registro del token push (solo funciona en dispositivo físico con Expo Go)
  async function registerForPush() {
    if (!Device.isDevice) return;
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    try {
      if (process.env.EXPO_PUBLIC_EAS_PROJECT_ID) {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
        });
        await NotificationsAPI.registerPushToken(tokenData.data);
      }
    } catch (e) {
      console.warn("No se pudo obtener el token Push. Si usas Expo Go, las notificaciones remotas no están soportadas.");
    }
  }

  useEffect(() => {
    if (!user) return;
    refresh();
    registerForPush();

    (async () => {
      const channel = await connectSocket();
      socketRef.current = channel;
      // Realtime logic for notifications can be wired up here
    })();

    return () => {
      disconnectSocket();
    };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAsRead, refresh }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications debe usarse dentro de <NotificationsProvider>");
  return ctx;
}
