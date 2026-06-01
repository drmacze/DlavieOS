# DlavieOS AI Workspace

DlavieOS adalah aplikasi web AI SaaS berbasis Vite + React + Supabase + WebLLM dengan UI hologram glassmorphism, smooth scrolling Lenis, integrasi Locomotive Scroll, dan konfigurasi GSAP ScrollSmoother.

## Fitur utama

- Split-pane workspace, sidebar collapsible, sticky date, floating prompt bar, auto-resize textarea, markdown + syntax highlighting, copy-to-clipboard, toast, dark/light auto-detect, PWA, service worker caching.
- WebGL ambient aura Indigo/Violet, Framer Motion page/message transitions, thinking accordion, typing indicator, haptic feedback, custom scrollbar, mobile viewport fix.
- Hybrid AI router: Free `@mlc-ai/web-llm` + OpenRouter fallback, Pro Gemini API, Max OpenAI API, system prompt Dlavie, context window 5 pesan terakhir, dynamic temperature, token estimation.
- Supabase anonymous auth, RLS schema, profiles, chat sessions, messages, usage logs, server-side free tier rate limit trigger, local fallback saat env belum diisi.
- Pricing modal IDR: Free, Pro Rp149.000, Max Rp299.000.

## Jalankan lokal

```bash
npm install
cp .env.example .env
npm run dev
```

Jalankan `supabase_setup.sql` di Supabase SQL Editor, lalu isi variabel `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_OPENROUTER_API_KEY`, `VITE_GEMINI_API_KEY`, dan `VITE_OPENAI_API_KEY` sesuai tier yang ingin diaktifkan.

## Catatan Vercel

Tidak ada konfigurasi Replit deploy. Deploy langsung ke Vercel dengan environment variables di atas.
