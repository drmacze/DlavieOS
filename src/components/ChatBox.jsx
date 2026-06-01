import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import toast from 'react-hot-toast';
import { Bot, Clipboard, Menu, Send, Square, ThumbsDown, ThumbsUp, UserRound, WandSparkles } from 'lucide-react';
import { dayLabel, sanitizeInput } from '../utils/format';
import { springPop } from '../styles/variants';

const prompts = ['Rancang SaaS AI 30 hari', 'Audit kode React saya', 'Buatkan pitch deck startup', 'Jelaskan konsep RAG + agent'];

const Markdown = ({ content }) => <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
  code({ inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || '');
    const code = String(children).replace(/\n$/, '');
    if (inline) return <code {...props}>{children}</code>;
    return <div><button className="icon-btn" style={{ float: 'right', margin: 8 }} onClick={() => navigator.clipboard.writeText(code).then(() => toast.success('Kode disalin'))}><Clipboard size={16} /></button><SyntaxHighlighter style={oneDark} language={match?.[1] || 'text'} PreTag="div">{code}</SyntaxHighlighter></div>;
  },
}}>{content}</ReactMarkdown>;

export default function ChatBox({ session, draft, setDraft, onSend, isThinking, onStop, progress, quota, onOpenPricing, onMobileMenu }) {
  const [showThinking, setShowThinking] = useState(true);
  const scrollRef = useRef(null);
  const textRef = useRef(null);
  const messages = useMemo(() => session?.messages || [], [session?.messages]);
  const disabled = isThinking || quota.exceeded;
  const canSend = draft.trim() && !disabled;
  const submit = useCallback(() => { if (canSend) { navigator.vibrate?.(20); onSend(sanitizeInput(draft)); } else if (quota.exceeded) { onOpenPricing(); } }, [canSend, draft, onOpenPricing, onSend, quota.exceeded]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages.length, isThinking]);
  useEffect(() => { const el = textRef.current; if (!el) return; el.style.height = '0px'; el.style.height = `${Math.min(el.scrollHeight, 180)}px`; }, [draft]);
  useEffect(() => { const keys = (event) => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') submit(); if (event.key === '/' && document.activeElement?.tagName !== 'TEXTAREA') { event.preventDefault(); textRef.current?.focus(); } }; window.addEventListener('keydown', keys); return () => window.removeEventListener('keydown', keys); }, [submit]);
  const quotaText = quota.exceeded ? 'Batas 10 pesan/jam habis. Tunggu atau upgrade ke Dlavie Pro (Rp 149.000) / Max (Rp 299.000).' : `${quota.used}/${quota.limit} kuota free tier terpakai`;
  const grouped = useMemo(() => messages.reduce((acc, message) => { const key = dayLabel(message.created_at); acc[key] = [...(acc[key] || []), message]; return acc; }, {}), [messages]);
  return <section className="chat glass" aria-label="Dlavie AI Chat">
    <header className="chat-header"><button className="icon-btn" onClick={onMobileMenu} aria-label="Buka sidebar"><Menu /></button><div><b className="gradient-text">Dlavie AI Workspace</b><div style={{ color: 'var(--muted)', fontSize: '.9rem' }}>Hybrid WebLLM • Gemini • OpenAI • Supabase</div></div><div className="quota"><div className="ring" style={{ '--progress': quota.progress }}>{quota.remaining}</div><span>{quotaText}</span></div></header>
    <div className="chat-scroll" ref={scrollRef} data-scroll-container>
      <div className="messages">{messages.length === 0 && <div className="empty" style={{ minHeight: '55vh' }}><div className="glass bento-card" style={{ maxWidth: 760 }}><h2 className="gradient-text">Mulai membangun dengan DlavieOS</h2><p style={{ color: 'var(--muted)' }}>Pilih prompt cepat atau tulis kebutuhan Anda. Dlavie akan mengatur konteks 5 pesan terakhir, menghitung token, dan memilih engine sesuai tier.</p><div className="plans">{prompts.map((p) => <button key={p} className="session-card" onClick={() => setDraft(p)}>{p}</button>)}</div></div></div>}
        {Object.entries(grouped).map(([date, items]) => <div key={date}><div style={{ position: 'sticky', top: 0, zIndex: 1, textAlign: 'center', color: 'var(--muted)', margin: '10px 0' }}>{date}</div>{items.map((message) => <motion.article key={message.id} className={`message ${message.role}`} variants={springPop} initial="hidden" animate="visible"><div className="avatar">{message.role === 'user' ? <UserRound /> : <Bot />}</div><div className="bubble">{message.role === 'assistant' && <details className="thinking" open={showThinking} onToggle={(e) => setShowThinking(e.currentTarget.open)}><summary><WandSparkles size={16} /> Thinking Process</summary><div>Dlavie memilih konteks relevan, menjaga keamanan prompt, lalu menyusun jawaban final tanpa membocorkan chain-of-thought internal.</div></details>}<Markdown content={message.content} /><div className="copy-row"><button className="icon-btn" onClick={() => navigator.clipboard.writeText(message.content).then(() => toast.success('Jawaban disalin'))}><Clipboard size={16} /></button>{message.role === 'assistant' && <><button className="icon-btn" aria-label="Feedback bagus"><ThumbsUp size={16} /></button><button className="icon-btn" aria-label="Feedback buruk"><ThumbsDown size={16} /></button></>}</div></div></motion.article>)}</div>)}
        {isThinking && <div className="message assistant"><div className="avatar"><Bot /></div><div className="bubble"><b>{progress}</b> <span className="dots"><span /><span /><span /></span></div></div>}
      </div>
    </div>
    <div className="fab glass"><AnimatePresence>{quota.exceeded && <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ color: 'var(--danger)', fontWeight: 700 }}>{quotaText}</motion.div>}</AnimatePresence><div className="prompt-row"><textarea ref={textRef} className="prompt" disabled={disabled} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Tulis prompt untuk Dlavie AI..." aria-label="Prompt Dlavie AI" /><button className="send" onClick={isThinking ? onStop : submit} disabled={!draft.trim() && !isThinking}>{isThinking ? <Square /> : <Send />}</button></div></div>
  </section>;
}
