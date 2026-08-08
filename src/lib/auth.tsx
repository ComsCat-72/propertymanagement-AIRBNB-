import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "agent" | "admin";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  agency_name: string | null;
  bio: string | null;
  profile_photo_url: string | null;
  status: "active" | "suspended";
  plan: "free" | "tier1" | "tier2";
  plan_expires_at: string | null;
  is_verified: boolean;
  verified_expires_at: string | null;
  cancel_at_period_end: boolean;
}

interface AuthCtx {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const [{ data: p }, { data: r }, { data: contacts }] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, full_name, phone, agency_name, bio, profile_photo_url, photo_public_id, status, achievements, plan, plan_expires_at, is_verified, verified_expires_at, cancel_at_period_end",
        )
        .eq("id", uid)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
      // email/address are owner/admin-only and come from a protected lookup
      supabase.rpc("profile_contacts"),
    ]);
    const own = (contacts as { id: string; email: string | null; address: string | null }[] | null)?.find(
      (c) => c.id === uid,
    );
    setProfile(p ? ({ ...(p as object), email: own?.email ?? "", address: own?.address ?? "" } as Profile) : null);
    setRoles((r ?? []).map((x: { role: AppRole }) => x.role));
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => loadProfile(s.user.id), 0);
      } else {
        setProfile(null);
        setRoles([]);
      }
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthCtx = {
    user: session?.user ?? null,
    session,
    profile,
    roles,
    loading,
    isAdmin: roles.includes("admin"),
    isAgent: roles.includes("agent"),
    signOut: async () => {
      await supabase.auth.signOut();
    },
    refresh: async () => {
      if (session?.user) await loadProfile(session.user.id);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}