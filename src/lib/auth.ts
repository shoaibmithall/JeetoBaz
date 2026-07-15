import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

export type AuthUser = User;
export type AuthSession = Session;

export interface AuthState {
  session: AuthSession | null;
  user: AuthUser | null;
  loading: boolean;
}

/**
 * Sign up with email and password.
 * After success, user receives confirmation email.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  options?: { data?: Record<string, unknown> }
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: options?.data,
    },
  });

  return { data, error };
}

/**
 * Sign in with email and password.
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

/**
 * Sign out.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Send password reset email.
 */
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  return { data, error };
}

/**
 * Update password (after reset).
 */
export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return { data, error };
}

/**
 * Exchange code for session (deep link callback).
 */
export async function exchangeCodeForSession(code: string) {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  return { data, error };
}

/**
 * Get current session.
 */
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  return { data, error };
}

/**
 * Get current user.
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return { data, error };
}

/**
 * Listen to auth state changes.
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * Check if email is verified.
 */
export function isEmailVerified(user: User | null): boolean {
  if (!user) return false;
  return user.email_confirmed_at !== null;
}

/**
 * Check if migration is enabled.
 */
export async function getMigrationFlag(): Promise<string> {
  const { data } = await supabase
    .from('auth_migration_config' as never)
    .select('value')
    .single();

  return (data as unknown as { value?: string })?.value ?? 'false';
}

/**
 * Create user profile via RPC (server-side validation).
 */
export async function createUserProfile(name: string, phone: string) {
  const { error } = await supabase.rpc('create_user_profile' as never, {
    p_name: name,
    p_phone: phone,
  } as never);

  return { error };
}

/**
 * Update user profile via RPC (restricted fields only).
 */
export async function updateUserProfile(
  name?: string,
  avatarUrl?: string,
  phone?: string
) {
  const { error } = await supabase.rpc('update_my_profile' as never, {
    p_name: name,
    p_avatar_url: avatarUrl,
    p_phone: phone,
  } as never);

  return { error };
}
