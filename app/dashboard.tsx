import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft, faLock, faRoute, faStopwatch, faBolt } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../src/context/AuthContext";
import { UsersAPI } from "../src/services/api";
import { supabase } from "../src/services/supabase";
import { C } from "../src/theme";

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState({ averageDuration: 0, averageSpeed: 0, totalRoutes: 0 });
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTimeLeft(prev => {
        if (prev === null || prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (user) {
        const { data } = await UsersAPI.getStats(user.id);
        setStats(data);
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.expires_at) {
        const now = Math.floor(Date.now() / 1000);
        setSessionTimeLeft(Math.max(0, session.expires_at - now));
      }
    } catch (e) {
      console.error(e);
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesomeIcon icon={faArrowLeft} size={18} color={C.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.title}>Dashboard</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Session Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBadge, { backgroundColor: C.ACCENT_BG }]}>
              <FontAwesomeIcon icon={faLock} size={16} color={C.PRIMARY} />
            </View>
            <Text style={styles.cardTitle}>Sesión Activa</Text>
          </View>
          <Text style={styles.cardSubtitle}>Tiempo restante del Token</Text>
          <Text style={styles.tokenText}>
            {sessionTimeLeft !== null ? formatDuration(sessionTimeLeft) : "—"}
          </Text>
        </View>

        {/* Stats Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBadge, { backgroundColor: C.ACCENT_BG }]}>
              <FontAwesomeIcon icon={faRoute} size={16} color={C.PRIMARY} />
            </View>
            <Text style={styles.cardTitle}>Estadísticas</Text>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statLeft}>
              <FontAwesomeIcon icon={faRoute} size={14} color={C.PRIMARY_LIGHT} />
              <Text style={styles.statLabel}>Total de Rutas</Text>
            </View>
            <Text style={styles.statValue}>{stats.totalRoutes}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statRow}>
            <View style={styles.statLeft}>
              <FontAwesomeIcon icon={faStopwatch} size={14} color={C.PRIMARY_LIGHT} />
              <Text style={styles.statLabel}>Tiempo Promedio / Ruta</Text>
            </View>
            <Text style={styles.statValue}>{formatDuration(stats.averageDuration)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statRow}>
            <View style={styles.statLeft}>
              <FontAwesomeIcon icon={faBolt} size={14} color={C.PRIMARY_LIGHT} />
              <Text style={styles.statLabel}>Velocidad Promedio</Text>
            </View>
            <Text style={styles.statValue}>{(stats.averageSpeed * 3.6).toFixed(2)} km/h</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.BG },
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
  title: { fontSize: 18, fontWeight: "800", color: C.TEXT },
  content: { padding: 16, gap: 14 },
  card: {
    backgroundColor: C.SURFACE,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: C.BORDER,
    shadowColor: C.SHADOW,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  iconBadge: { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  cardTitle: { fontSize: 17, fontWeight: "800", color: C.TEXT },
  cardSubtitle: { fontSize: 13, color: C.TEXT_MUTED, marginBottom: 8 },
  tokenText: { fontSize: 32, fontWeight: "800", color: C.PRIMARY, letterSpacing: 1 },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  statLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  statLabel: { fontSize: 14, color: C.TEXT_MUTED },
  statValue: { fontSize: 15, fontWeight: "700", color: C.TEXT },
  divider: { height: 1, backgroundColor: C.BORDER },
});
