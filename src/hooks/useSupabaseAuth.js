import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';

const localProfile = { id: 'local-user', tier: 'free', has_onboarded: false, purpose: '', source: '', profession: '' };

export const useSupabaseAuth = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (authUser) => {
    if (!isSupabaseConfigured) {
      const stored = JSON.parse(localStorage.getItem('dlavieos-local-profile') || 'null');
      setProfile(stored || localProfile);
      setLoading(false);
      return stored || localProfile;
    }
    const { data, error } = await supabase.from('users_profile').select('*').eq('id', authUser.id).maybeSingle();
    if (error) throw error;
    if (data) { setProfile(data); return data; }
    const { data: created, error: createError } = await supabase.from('users_profile').insert({ id: authUser.id }).select('*').single();
    if (createError) throw createError;
    setProfile(created);
    return created;
  }, []);

  useEffect(() => {
    let alive = true;
    const boot = async () => {
      try {
        if (!isSupabaseConfigured) {
          const pseudoUser = { id: 'local-user', is_anonymous: true };
          if (alive) setUser(pseudoUser);
          await loadProfile(pseudoUser);
          return;
        }
        const { data: sessionData } = await supabase.auth.getSession();
        let authUser = sessionData.session?.user;
        if (!authUser) {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) throw error;
          authUser = data.user;
        }
        if (alive) setUser(authUser);
        await loadProfile(authUser);
      } catch (error) {
        toast.error(error.message);
      } finally { if (alive) setLoading(false); }
    };
    boot();
    if (!isSupabaseConfigured) return () => { alive = false; };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setUser(session?.user || null); if (session?.user) loadProfile(session.user); });
    return () => { alive = false; subscription.unsubscribe(); };
  }, [loadProfile]);

  const completeOnboarding = useCallback(async (payload) => {
    const next = { ...(profile || localProfile), ...payload, has_onboarded: true };
    if (!isSupabaseConfigured) {
      localStorage.setItem('dlavieos-local-profile', JSON.stringify(next));
      setProfile(next);
      return next;
    }
    const { data, error } = await supabase.from('users_profile').upsert({ id: user.id, ...payload, has_onboarded: true }, { onConflict: 'id' }).select('*').single();
    if (error) throw error;
    setProfile(data);
    return data;
  }, [profile, user]);

  return { user, profile, loading, completeOnboarding, configured: isSupabaseConfigured };
};
