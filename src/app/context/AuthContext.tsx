import { createContext, useContext, useEffect, useState } from "react";
import { getSupabaseClient } from "@/utils/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, inviteToken?: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signUp: async () => ({}),
  signIn: async () => ({}),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Get existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, inviteToken?: string) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };

    const userId = data.user?.id;
    if (!userId) return { error: "Signup succeeded but no user ID returned" };

    // Create user_profile row
    const { error: profileError } = await supabase.from("user_profiles").insert({
      id: userId,
      full_name: fullName,
      auth_method: "email",
      status: "active",
    });
    if (profileError) console.error("Profile creation failed:", profileError);

    if (inviteToken) {
      // Invite flow: join existing org instead of creating a new one
      const { data: invitation, error: inviteError } = await supabase
        .from("invitations")
        .select("id, organization_id, role")
        .eq("token", inviteToken)
        .eq("status", "pending")
        .single();

      if (inviteError || !invitation) {
        console.error("Invitation lookup failed:", inviteError);
        return { error: "Invalid or expired invitation" };
      }

      // Create membership in the inviting org
      const { error: memberError } = await supabase.from("memberships").insert({
        user_id: userId,
        organization_id: invitation.organization_id,
        role: invitation.role || "member",
        status: "active",
      });
      if (memberError) console.error("Membership creation failed:", memberError);

      // Mark invitation as accepted
      await supabase
        .from("invitations")
        .update({
          status: "accepted",
          accepted_by: userId,
          accepted_at: new Date().toISOString(),
        })
        .eq("id", invitation.id);
    } else {
      // Normal flow: create new organization
      const slug = email.split("@")[0] + "-" + Date.now();
      const orgId = crypto.randomUUID();
      const { error: orgError } = await supabase
        .from("organizations")
        .insert({
          id: orgId,
          name: fullName + "'s Organization",
          slug,
          subscription_status: "trial",
        });
      if (orgError) console.error("Org creation failed:", orgError);

      // Create membership linking user to org
      if (!orgError) {
        const { error: memberError } = await supabase.from("memberships").insert({
          user_id: userId,
          organization_id: orgId,
          role: "admin",
          status: "active",
        });
        if (memberError) console.error("Membership creation failed:", memberError);
      }
    }

    return {};
  };

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
