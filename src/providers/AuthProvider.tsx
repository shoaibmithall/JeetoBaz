import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isEmailVerified: boolean;
  isBanned: boolean;
  banReason: string | null;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isEmailVerified: false,
  isBanned: false,
  banReason: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    // Don't touch isBanned/banReason on sign-out (user === null) so a suspension notice set just
    // before the forced sign-out below stays visible for the notice component to display.
    if (!user) return () => { active = false; };

    supabase
      .from('users')
      .select('is_banned, ban_reason')
      .or(`auth_user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        if (data?.is_banned) {
          setIsBanned(true);
          setBanReason(data.ban_reason || null);
          supabase.auth.signOut();
        } else {
          setIsBanned(false);
          setBanReason(null);
        }
      });

    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!active) return;
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    }).catch(() => {
      if (active) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        if (!active) return;
        setSession(s);
        setUser(s?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const isEmailVerified = user !== null && user.email_confirmed_at !== null;

  return (
    <AuthContext.Provider value={{ session, user, loading, isEmailVerified, isBanned, banReason }}>
      {children}
    </AuthContext.Provider>
  );
}
