import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type AppRole = "admin" | "user" | "organizer" | "musician";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<{ error: Error | null; session: Session | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; user: User | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);
  const syncRunRef = useRef(0);

  const withTimeout = useCallback(async <T,>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
    try {
      return await Promise.race([
        promise,
        new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
      ]);
    } catch {
      return fallback;
    }
  }, []);

  const normalizeRole = (value: unknown): AppRole | null => {
    if (value === "admin" || value === "user" || value === "organizer" || value === "musician") {
      return value;
    }
    return null;
  };

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (error) throw error;
      return data;
    } catch {
      return null;
    }
  };

  const fetchRoles = async (userId: string, fallbackRole?: AppRole | null): Promise<AppRole[]> => {
    const queryRoles = async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      if (error) throw error;
      return (data?.map((r) => normalizeRole(r.role)).filter((role): role is AppRole => role !== null) ?? []);
    };

    try {
      const dbRoles = await queryRoles();

      if (dbRoles.length > 0) {
        return dbRoles;
      }
    } catch {
      try {
        await new Promise((resolve) => setTimeout(resolve, 150));
        const retryRoles = await queryRoles();
        if (retryRoles.length > 0) {
          return retryRoles;
        }
      } catch {
        // fall back to metadata role below
      }
    }

    if (fallbackRole && fallbackRole !== "admin") {
      return [fallbackRole];
    }

    return [];
  };

  const syncAuthState = useCallback(async (nextSession: Session | null, options?: { skipBlockingLoader?: boolean }) => {
    const runId = ++syncRunRef.current;
    const shouldShowBlockingLoader = !options?.skipBlockingLoader;

    if (shouldShowBlockingLoader) {
      setLoading(true);
    }

    setSession(nextSession);
    const nextUser = nextSession?.user ?? null;
    setUser(nextUser);

    if (nextUser) {
      const fallbackRole = normalizeRole(nextUser.user_metadata?.role ?? nextUser.app_metadata?.role);
      const [nextProfile, nextRoles] = await Promise.all([
        withTimeout(fetchProfile(nextUser.id), 5000, null),
        withTimeout(fetchRoles(nextUser.id, fallbackRole), 5000, fallbackRole && fallbackRole !== "admin" ? [fallbackRole] : []),
      ]);

      if (runId !== syncRunRef.current) return;
      setProfile(nextProfile);
      setRoles(nextRoles);
    } else {
      if (runId !== syncRunRef.current) return;
      setProfile(null);
      setRoles([]);
    }

    if (runId !== syncRunRef.current) return;
    if (shouldShowBlockingLoader) {
      setLoading(false);
    }
  }, [withTimeout]);

  useEffect(() => {
    // 1. Set up listener FIRST (but skip until initialized)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (initializedRef.current) {
          if (event === "TOKEN_REFRESHED") {
            setSession(session);
            setUser(session?.user ?? null);
            return;
          }

          void syncAuthState(session);
        }
      }
    );

    // 2. Then restore session from storage
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await syncAuthState(session);
      initializedRef.current = true;
    });

    return () => subscription.unsubscribe();
  }, [syncAuthState]);

  const signUp = async (email: string, password: string, fullName: string, role: AppRole) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null, session: data.session ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    return { error: error as Error | null, user: data.user ?? null };
  };

  const signOut = async () => {
    syncRunRef.current += 1;
    setProfile(null);
    setRoles([]);
    setUser(null);
    setSession(null);
    setLoading(false);

    await Promise.race([
      supabase.auth.signOut({ scope: "local" }),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error as Error | null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, roles, loading, signUp, signIn, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
