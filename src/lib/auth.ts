import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

export type AuthUser = User;
export type AuthSession = Session;

export interface AuthState {
  session: AuthSession | null;
  user: AuthUser | null;
  loading: boolean;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  options?: { data?: Record<string, unknown>; captchaToken?: string }
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: 'https://jeetobaz.pk/auth/callback',
      data: options?.data,
      captchaToken: options?.captchaToken,
    },
  });

  return { data, error };
}

export async function signInWithEmail(email: string, password: string, captchaToken?: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: { captchaToken },
  });

  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(email: string, captchaToken?: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://jeetobaz.pk/reset-password',
    captchaToken,
  });

  return { data, error };
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return { data, error };
}

export async function exchangeCodeForSession(code: string) {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  return { data, error };
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  return { data, error };
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return { data, error };
}

export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange(callback);
}

export function isEmailVerified(user: User | null): boolean {
  if (!user) return false;
  return user.email_confirmed_at !== null;
}

export async function getMigrationFlag(): Promise<string> {
  const { data } = await supabase
    .from('auth_migration_config')
    .select('value')
    .single();

  return data?.value ?? 'false';
}

export async function createUserProfile(name: string, phone: string) {
  const { error } = await supabase.rpc('create_user_profile', {
    p_name: name,
    p_phone: phone,
  });

  return { error };
}

export async function updateUserProfile(
  name?: string,
  avatarUrl?: string,
  phone?: string
) {
  const { error } = await supabase.rpc('update_my_profile', {
    p_name: name,
    p_avatar_url: avatarUrl,
    p_phone: phone,
  });

  return { error };
}
