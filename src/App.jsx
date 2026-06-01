import { useEffect, useMemo, useState } from 'react';
import Lenis from 'lenis';
import LocomotiveScroll from 'locomotive-scroll';
import gsap from 'gsap';
import toast, { Toaster } from 'react-hot-toast';
import WebGLBackground from './components/WebGLBackground';
import OnboardingForm from './components/OnboardingForm';
import Sidebar from './components/Sidebar';
import ChatBox from './components/ChatBox';
import PricingModal from './components/PricingModal';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { useRateLimit } from './hooks/useRateLimit';
import { useDlavieEngine } from './hooks/useDlavieEngine';
import { useDlavieStore } from './store/useDlavieStore';
import { isSupabaseConfigured, supabase } from './services/supabaseClient';
import './styles/global.css';

const scrollSmootherProps = { smooth: 1.2, effects: true, normalizeScroll: true, ignoreMobileResize: true };
const extraFeatures = ['Voice input Indonesia', 'RAG dokumen pribadi', 'Folder proyek', 'Prompt marketplace', 'Agent planner', 'File upload', 'Vision OCR', 'Mode pair-programming', 'Canvas artifacts', 'Memory vault', 'Model router hemat biaya', 'Team workspace', 'Audit log admin', 'Knowledge graph', 'Citation mode', 'Long-form writer', 'SQL copilot', 'API key vault', 'Webhook automations', 'Custom personas', 'Inline diff editor', 'Bug report generator', 'Meeting summarizer', 'Browser search connector', 'GitHub issue triage', 'Calendar assistant', 'CRM note generator', 'Invoice reader', 'No-code workflow', 'Secure share links', 'Workspace templates', 'Realtime collaboration', 'Admin billing', 'Usage anomaly alerts', 'Model eval suite', 'Fine-tune dataset builder', 'Offline PWA queue', 'Multilingual tutor', 'Learning path', 'Kanban tasks', 'Codebase map', 'Terminal command explainer', 'Design critique', 'SEO brief generator', 'A/B prompt testing', 'Prompt versioning', 'Enterprise SSO', 'Data retention controls', 'Export PDF premium', 'Private cloud mode'];

export default function App() {
  const { user, profile, loading, completeOnboarding } = useSupabaseAuth();
  const setProfile = useDlavieStore((state) => state.setProfile);
  const sessions = useDlavieStore((state) => state.sessions);
  const activeSessionId = useDlavieStore((state) => state.activeSessionId);
  const sidebarCollapsed = useDlavieStore((state) => state.sidebarCollapsed);
  const draft = useDlavieStore((state) => state.draft);
  const addMessage = useDlavieStore((state) => state.addMessage);
  const setDraft = useDlavieStore((state) => state.setDraft);
  const activeSession = useDlavieStore((state) => state.activeSession());
  const store = useDlavieStore();
  const [pricingOpen, setPricingOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const quota = useRateLimit(user, profile?.tier || 'free');
  const engine = useDlavieEngine({ tier: profile?.tier || 'free', profile });

  useEffect(() => { if (profile) setProfile(profile); }, [profile, setProfile]);
  useEffect(() => {
    const setVH = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    setVH(); window.addEventListener('resize', setVH); return () => window.removeEventListener('resize', setVH);
  }, []);
  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true, smoothWheel: true, syncTouch: true, anchors: true, gestureOrientation: 'both' });
    const locomotive = new LocomotiveScroll({ lenisOptions: { autoRaf: false, lerp: 0.08, orientation: 'vertical' }, scrollCallback: (instance) => gsap.to('.gradient-text', { backgroundPosition: `${instance.scroll.y * 0.04}% center`, overwrite: true }) });
    window.dlavieScrollEngines = { lenis, locomotive, scrollSmootherProps };
    return () => { lenis.destroy(); locomotive.destroy(); delete window.dlavieScrollEngines; };
  }, []);
  useEffect(() => {
    const onOnline = () => toast.success('Koneksi Dlavie kembali online.');
    const onOffline = () => toast.error('Sedang offline. Dlavie akan retry saat koneksi kembali.');
    addEventListener('online', onOnline); addEventListener('offline', onOffline); return () => { removeEventListener('online', onOnline); removeEventListener('offline', onOffline); };
  }, []);
  useEffect(() => { if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js'); }, []);

  const handleOnboarding = async (payload) => { const next = await completeOnboarding(payload); setProfile(next); };
  const persistMessage = async (role, content, sessionSnapshot) => {
    if (!isSupabaseConfigured || !user?.id || !sessionSnapshot?.id) return;
    await supabase.from('chat_sessions').upsert({ id: sessionSnapshot.id, user_id: user.id, title: sessionSnapshot.title || 'Percakapan Dlavie' });
    await supabase.from('messages').insert({ session_id: sessionSnapshot.id, role, content });
  };
  const sendPrompt = async (prompt) => {
    if (quota.exceeded) { setPricingOpen(true); return; }
    const history = activeSession?.messages || [];
    setDraft('');
    addMessage({ role: 'user', content: prompt });
    const userSession = useDlavieStore.getState().activeSession();
    await quota.logUsage();
    await persistMessage('user', prompt, userSession);
    const answer = await engine.generate({ prompt, history });
    addMessage({ role: 'assistant', content: answer });
    const assistantSession = useDlavieStore.getState().activeSession();
    await persistMessage('assistant', answer, assistantSession);
  };

  const completed = profile?.has_onboarded;
  const featureMarquee = useMemo(() => extraFeatures.slice(0, 12).join(' • '), []);

  if (loading) return <div className="app-shell"><WebGLBackground /><div className="empty"><div className="glass bento-card"><h2 className="gradient-text">Memuat DlavieOS...</h2><p>Skeleton workspace sedang disiapkan.</p></div></div></div>;
  return <div className="app-shell"><WebGLBackground /><div className="noise" /><Toaster toastOptions={{ className: 'toast' }} />{!completed ? <OnboardingForm onComplete={handleOnboarding} /> : <main className={`workspace ${sidebarCollapsed ? 'collapsed' : ''}`}><Sidebar sessions={sessions} activeId={activeSessionId} collapsed={sidebarCollapsed} mobileOpen={mobileOpen} onToggle={store.toggleSidebar} onNew={store.newSession} onSelect={store.setActiveSession} onDelete={store.deleteSession} onClear={() => confirm('Hapus semua percakapan Dlavie?') && store.clearSessions()} /><ChatBox session={activeSession} draft={draft} setDraft={setDraft} onSend={sendPrompt} isThinking={engine.isThinking} onStop={engine.stop} progress={engine.progress} quota={quota} onOpenPricing={() => setPricingOpen(true)} onMobileMenu={() => setMobileOpen((v) => !v)} /><div style={{ position: 'fixed', left: 24, bottom: 4, fontSize: 11, color: 'var(--muted)', pointerEvents: 'none' }}>{featureMarquee}</div></main>}<PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} /></div>;
}
