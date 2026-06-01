import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { formatRupiah } from '../utils/format';

const plans = [
  { name: 'Free', price: 0, features: ['10 pesan/jam', 'Dlavie Core-Lite WebLLM', 'Riwayat 30 hari'] },
  { name: 'Pro', price: 149000, features: ['Dlavie Ultra-Vision Gemini', 'Kuota prioritas', 'Analitik cepat'] },
  { name: 'Max', price: 299000, features: ['Dlavie Thought-Pro Deep OpenAI', 'Penalaran kompleks', 'Mode arsitek AI'] },
];

export default function PricingModal({ open, onClose }) {
  if (!open) return null;
  return <motion.div className="pricing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label="Upgrade Dlavie">
    <motion.div className="pricing-card glass" initial={{ y: 30, scale: .96 }} animate={{ y: 0, scale: 1 }}>
      <div className="chat-header" style={{ padding: 0, border: 0, marginBottom: 16 }}><div><b className="shimmer">Dlavie Premium</b><h2 style={{ margin: '6px 0' }}>Buka kapasitas AI lebih tinggi</h2></div><button className="icon-btn" onClick={onClose} aria-label="Tutup pricing"><X /></button></div>
      <div className="plans">{plans.map((plan) => <div className="plan" key={plan.name}><h3>{plan.name}</h3><h2>{formatRupiah(plan.price)}</h2><ul>{plan.features.map((f) => <li key={f}>{f}</li>)}</ul><button className="send" style={{ width: '100%' }}>Pilih {plan.name}</button></div>)}</div>
      <p style={{ color: 'var(--muted)' }}>Gateway pembayaran siap dihubungkan ke Midtrans/Xendit melalui endpoint Vercel pilihan Anda.</p>
    </motion.div>
  </motion.div>;
}
