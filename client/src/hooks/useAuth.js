import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase.js';

export default function useAuth() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session) { setProfile(null); setProfileLoading(false); return; }
    let cancelled = false;
    setProfileLoading(true);
    supabase
      .from('profiles')
      .select('id, username, wins, losses, games_played')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setProfile(data ?? null);
        setProfileLoading(false);
      });
    return () => { cancelled = true; };
  }, [session]);

  // Username consolidado: profile (DB) é a fonte da verdade; cai para
  // user_metadata.username (preenchido no signUp) enquanto o profile carrega
  // ou se a query da tabela profiles falhar.
  const username =
    profile?.username ||
    session?.user?.user_metadata?.username ||
    null;

  const signUp = useCallback(async (email, password, username) => {
    if (!supabase) return { error: { message: 'Supabase não configurado.' } };

    const uname = username.trim();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(uname)) {
      return { error: { message: 'Username: 3-20 caracteres, letras/números/underline.' } };
    }

    const { data: existing } = await supabase
      .from('profiles').select('id').eq('username', uname).maybeSingle();
    if (existing) {
      return { error: { message: 'Nome de usuário já está em uso.' } };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: uname },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { error };

    // Quando confirmação de email está habilitada, o Supabase retorna o user
    // sem sessão. Se identities estiver vazio, o email já está cadastrado.
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return { error: { message: 'Este email já está cadastrado.' } };
    }
    const needsEmailConfirmation = !data?.session;
    return { error: null, needsEmailConfirmation, email };
  }, []);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) return { error: { message: 'Supabase não configurado.' } };
    return supabase.auth.signInWithPassword({ email, password });
  }, []);

  const resendConfirmation = useCallback(async (email) => {
    if (!supabase) return { error: { message: 'Supabase não configurado.' } };
    if (!email) return { error: { message: 'Informe seu email.' } };
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const getAccessToken = useCallback(() => session?.access_token ?? null, [session]);

  return {
    session,
    profile,
    username,
    loading,
    profileLoading,
    signUp,
    signIn,
    signOut,
    resendConfirmation,
    getAccessToken,
    isAuthed: !!session,
    hasSupabase: !!supabase,
  };
}
