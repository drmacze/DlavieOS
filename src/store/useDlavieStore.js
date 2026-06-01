import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { makeSessionTitle } from '../utils/format';

const createSession = (prompt = '') => ({ id: crypto.randomUUID(), title: makeSessionTitle(prompt), created_at: new Date().toISOString(), messages: [] });

export const useDlavieStore = create(persist((set, get) => ({
  profile: null,
  tier: 'free',
  sessions: [],
  activeSessionId: null,
  draft: '',
  sidebarCollapsed: false,
  setProfile: (profile) => set({ profile, tier: profile?.tier || 'free' }),
  setDraft: (draft) => set({ draft }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  hydrateSessions: (sessions) => set({ sessions, activeSessionId: sessions[0]?.id || null }),
  newSession: () => set((state) => { const session = createSession(); return { sessions: [session, ...state.sessions], activeSessionId: session.id }; }),
  setActiveSession: (id) => set({ activeSessionId: id }),
  deleteSession: (id) => set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id), activeSessionId: state.activeSessionId === id ? state.sessions.find((s) => s.id !== id)?.id || null : state.activeSessionId })),
  clearSessions: () => set({ sessions: [], activeSessionId: null }),
  addMessage: (message) => set((state) => {
    let sessions = state.sessions;
    let activeSessionId = state.activeSessionId;
    if (!activeSessionId) {
      const session = createSession(message.content);
      sessions = [session, ...sessions];
      activeSessionId = session.id;
    }
    sessions = sessions.map((session) => session.id === activeSessionId ? { ...session, title: session.messages.length ? session.title : makeSessionTitle(message.content), messages: [...session.messages, { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...message }] } : session);
    return { sessions, activeSessionId };
  }),
  updateLastAssistant: (content) => set((state) => ({ sessions: state.sessions.map((session) => session.id === state.activeSessionId ? { ...session, messages: session.messages.map((m, i, arr) => i === arr.length - 1 && m.role === 'assistant' ? { ...m, content } : m) } : session) })),
  activeSession: () => get().sessions.find((s) => s.id === get().activeSessionId) || null,
}), { name: 'dlavieos-workspace-v1', partialize: (state) => ({ sessions: state.sessions, activeSessionId: state.activeSessionId, draft: state.draft, sidebarCollapsed: state.sidebarCollapsed }) }));
