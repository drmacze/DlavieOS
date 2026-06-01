import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Brain, CheckCircle2, Sparkles } from 'lucide-react';
import { fadeUp } from '../styles/variants';

export default function OnboardingForm({ onComplete }) {
  const [form, setForm] = useState({ purpose: 'Membangun produk AI', source: 'GitHub', profession: '' });
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try { await onComplete(form); navigator.vibrate?.(30); toast.success('Profil Dlavie tersimpan. Workspace dibuka.'); } catch (error) { toast.error(error.message); } finally { setSaving(false); }
  };
  return <main className="onboarding">
    <motion.section className="bento" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: .08 } } }}>
      <motion.div className="bento-card glass" variants={fadeUp}>
        <div className="logo"><Brain /></div><h1 className="gradient-text">DlavieOS AI</h1>
        <p style={{ fontSize: 'clamp(1rem, 2vw, 1.35rem)', color: 'var(--muted)', maxWidth: 760 }}>Workspace hologram glassmorphism dengan hybrid engine: WebLLM lokal, OpenRouter fallback, Gemini Pro, dan OpenAI Max.</p>
        <div className="plans" style={{ marginTop: 24 }}><div className="plan"><Sparkles /> Bento onboarding</div><div className="plan"><CheckCircle2 /> Supabase Auth + RLS</div><div className="plan"><Brain /> Thinking workspace</div></div>
      </motion.div>
      <motion.form className="bento-card glass form-grid" variants={fadeUp} onSubmit={submit}>
        <h2>Personalisasi Dlavie AI</h2>
        <label className="field">Tujuan menggunakan Dlavie?<select value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}><option>Membangun produk AI</option><option>Belajar dan riset</option><option>Otomasi bisnis</option><option>Menulis kode produksi</option></select></label>
        <label className="field">Tahu dari mana?<input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="GitHub, TikTok, teman, komunitas..." /></label>
        <label className="field">Profesi?<input required value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} placeholder="Founder, developer, pelajar, desainer..." /></label>
        <button className="send" disabled={saving}>{saving ? 'Menyimpan...' : 'Masuk ke Workspace'}</button>
      </motion.form>
    </motion.section>
  </main>;
}
