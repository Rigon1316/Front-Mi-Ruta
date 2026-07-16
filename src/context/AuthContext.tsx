import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Escuchar cambios de estado en Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session) {
          // Fetch custom profile data if available
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: profile?.name || session.user.user_metadata?.name || 'Usuario',
            role: profile?.role || 'athlete',
            profilePhoto: profile?.profilePhoto,
            avatar_url: profile?.profilePhoto,
            nickname: profile?.nickname,
            bio: profile?.bio,
          });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn("Error in onAuthStateChange", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function login(email: string, password: string) {
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (e: any) {
      setError(e.message || "No se pudo iniciar sesión");
      throw e;
    }
  }

  async function register(name: string, email: string, password: string) {
    setError(null);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          }
        }
      });
      if (error) throw error;
    } catch (e: any) {
      setError(e.message || "No se pudo registrar el usuario");
      throw e;
    }
  }

  async function refreshProfile() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      setUser({
        id: session.user.id,
        email: session.user.email!,
        name: profile?.name || session.user.user_metadata?.name || 'Usuario',
        role: profile?.role || 'athlete',
        profilePhoto: profile?.profilePhoto,
        avatar_url: profile?.profilePhoto,
        nickname: profile?.nickname,
        bio: profile?.bio,
      });
    }
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
