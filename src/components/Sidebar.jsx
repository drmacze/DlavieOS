import { Menu, MessageSquarePlus, PanelLeftClose, Trash2, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { compactDate, downloadText } from '../utils/format';

export default function Sidebar({ sessions, activeId, collapsed, mobileOpen, onToggle, onNew, onSelect, onDelete, onClear }) {
  const exportAll = () => downloadText('dlavieos-chat-export.txt', sessions.map((session) => `# ${session.title}\n${session.messages.map((m) => `[${m.role}] ${m.content}`).join('\n\n')}`).join('\n\n---\n\n'));
  return <aside className={`sidebar glass ${mobileOpen ? 'mobile-open' : ''}`} aria-label="Riwayat percakapan">
    <div className="sidebar-head"><div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}><div className="logo">D</div>{!collapsed && <b>DlavieOS</b>}</div><button className="icon-btn" onClick={onToggle} aria-label="Collapse sidebar">{collapsed ? <Menu /> : <PanelLeftClose />}</button></div>
    <div className="sidebar-head" style={{ border: 0 }}><button className="icon-btn" onClick={onNew} title="Percakapan baru"><MessageSquarePlus /></button>{!collapsed && <><button className="icon-btn" onClick={exportAll} title="Export TXT"><Download /></button><button className="icon-btn" onClick={onClear} title="Hapus semua"><Trash2 /></button></>}</div>
    <div className="session-list">{sessions.length === 0 && !collapsed && <div className="plan">Belum ada riwayat. Mulai prompt pertama Anda.</div>}{sessions.map((session) => <motion.button drag="x" dragConstraints={{ left: -90, right: 0 }} onDragEnd={(_, info) => { if (info.offset.x < -60) onDelete(session.id); }} className={`session-card ${session.id === activeId ? 'active' : ''}`} key={session.id} onClick={() => onSelect(session.id)} title="Geser kiri untuk hapus di mobile"><b>{collapsed ? '💬' : session.title}</b>{!collapsed && <small style={{ display: 'block', color: 'var(--muted)', marginTop: 6 }}>{compactDate(session.created_at)}</small>}</motion.button>)}</div>
  </aside>;
}
