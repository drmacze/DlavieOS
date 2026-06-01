import { useCallback, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';

const LIMIT = 10;

export const useRateLimit = (user, tier = 'free') => {
  const userId = user?.id;
  const [used, setUsed] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId || tier !== 'free') { setUsed(0); return; }
    setLoading(true);
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    if (!isSupabaseConfigured) {
      const logs = JSON.parse(localStorage.getItem('dlavieos-usage-logs') || '[]').filter((x) => x.user_id === userId && x.created_at >= since);
      setUsed(logs.length);
      setLoading(false);
      return;
    }
    const { count, error } = await supabase.from('usage_logs').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', since);
    if (!error) setUsed(count || 0);
    setLoading(false);
  }, [userId, tier]);

  const logUsage = useCallback(async () => {
    if (!userId || tier !== 'free') return;
    if (!isSupabaseConfigured) {
      const logs = JSON.parse(localStorage.getItem('dlavieos-usage-logs') || '[]');
      logs.push({ id: crypto.randomUUID(), user_id: userId, created_at: new Date().toISOString() });
      localStorage.setItem('dlavieos-usage-logs', JSON.stringify(logs));
      setUsed((value) => value + 1);
      return;
    }
    await supabase.from('usage_logs').insert({ user_id: userId });
    await refresh();
  }, [refresh, tier, userId]);

  useEffect(() => { const start = setTimeout(refresh, 0); const id = setInterval(refresh, 30000); return () => { clearTimeout(start); clearInterval(id); }; }, [refresh]);

  return useMemo(() => ({ used, limit: LIMIT, remaining: Math.max(0, LIMIT - used), exceeded: tier === 'free' && used >= LIMIT, loading, refresh, logUsage, progress: Math.min(100, (used / LIMIT) * 100) }), [loading, logUsage, refresh, tier, used]);
};
