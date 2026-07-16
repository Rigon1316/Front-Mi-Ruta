/**
 * Supabase Realtime wrapper (replaces the old socket.io approach)
 * Returns a channel object with a minimal on/off API for backward compat.
 */
import { supabase } from "./supabase";

export type RealtimeHandler = (payload: any) => void;

const listeners = new Map<string, Set<RealtimeHandler>>();
let channel: ReturnType<typeof supabase.channel> | null = null;

function emitToListeners(event: string, payload: any) {
  listeners.get(event)?.forEach(fn => fn(payload));
}

const channelApi = {
  on(event: string, handler: RealtimeHandler) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(handler);
  },
  off(event: string, handler: RealtimeHandler) {
    listeners.get(event)?.delete(handler);
  },
};

export async function connectSocket() {
  if (channel) return channelApi;

  channel = supabase
    .channel("public-feed")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "publications" }, payload => {
      emitToListeners("route:new", payload.new);
    })
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "likes" }, payload => {
      emitToListeners("like:new", payload.new);
    })
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "likes" }, payload => {
      emitToListeners("like:delete", payload.old);
    })
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments" }, payload => {
      emitToListeners("comment:new", payload.new);
    })
    .subscribe();

  return channelApi;
}

export function getSocket() {
  return channelApi;
}

export function disconnectSocket() {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
    listeners.clear();
  }
}
