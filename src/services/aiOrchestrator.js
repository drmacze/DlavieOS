import { estimateTokens, sanitizeInput } from '../utils/format';

export const DLAVIE_SYSTEM_PROMPT = `Kamu adalah Dlavie AI, asisten pintar milik sistem Dlavie. Jawab dalam Bahasa Indonesia yang premium, ringkas saat diminta, teliti untuk tugas teknis, aman, jujur tentang keterbatasan, dan selalu bantu pengguna membangun solusi nyata. Jangan mengklaim memiliki akses rahasia atau menyalin sistem proprietary pihak lain.`;

const WEBLLM_MODEL = import.meta.env.VITE_WEBLLM_MODEL || 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
const contextWindow = (messages = []) => messages.slice(-5).map((message) => ({ role: message.role === 'ai' ? 'assistant' : message.role, content: sanitizeInput(message.content) }));

export const getDynamicTemperature = (prompt = '') => {
  const tokens = estimateTokens(prompt);
  if (/kode|debug|hitung|analisis|arsitektur|sql|api/i.test(prompt)) return 0.25;
  if (tokens > 220) return 0.35;
  return 0.72;
};

let webllmEngine;
const loadWebLLM = async (progressCallback) => {
  if (webllmEngine) return webllmEngine;
  const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
  webllmEngine = await CreateMLCEngine(WEBLLM_MODEL, { initProgressCallback: progressCallback });
  return webllmEngine;
};

const callOpenRouter = async ({ messages, signal, temperature }) => {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!key) throw new Error('OpenRouter fallback belum memiliki API key.');
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST', signal,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'HTTP-Referer': location.origin, 'X-Title': 'DlavieOS AI Workspace' },
    body: JSON.stringify({ model: import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemma-3-4b-it:free', temperature, messages }),
  });
  if (!response.ok) throw new Error(`OpenRouter limit/error: ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Dlavie AI belum menerima respons dari fallback cloud.';
};

const callGemini = async ({ messages, signal, temperature }) => {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) throw new Error('Gemini API key belum dikonfigurasi untuk Dlavie Ultra-Vision.');
  const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: 'POST', signal, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ generationConfig: { temperature }, contents: messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })), systemInstruction: { parts: [{ text: DLAVIE_SYSTEM_PROMPT }] } }),
  });
  if (!response.ok) throw new Error(`Gemini limit/error: ${response.status}`);
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n') || 'Dlavie Ultra-Vision belum menghasilkan jawaban.';
};

const callOpenAI = async ({ messages, signal, temperature }) => {
  const key = import.meta.env.VITE_OPENAI_API_KEY;
  if (!key) throw new Error('OpenAI API key belum dikonfigurasi untuk Dlavie Thought-Pro Deep.');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', signal, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini', temperature, messages }),
  });
  if (!response.ok) throw new Error(`OpenAI limit/error: ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Dlavie Thought-Pro Deep belum menghasilkan jawaban.';
};

export const generateDlavieResponse = async ({ tier = 'free', prompt, history = [], profile, signal, onProgress }) => {
  const safePrompt = sanitizeInput(prompt);
  const messages = [
    { role: 'system', content: `${DLAVIE_SYSTEM_PROMPT}\nProfil pengguna: profesi=${profile?.profession || 'belum diisi'}, tujuan=${profile?.purpose || 'belum diisi'}.` },
    ...contextWindow(history),
    { role: 'user', content: safePrompt },
  ];
  const temperature = getDynamicTemperature(safePrompt);

  try {
    if (tier === 'max') return await callOpenAI({ messages, signal, temperature });
    if (tier === 'pro') return await callGemini({ messages, signal, temperature });
    const engine = await loadWebLLM(onProgress);
    const completion = await engine.chat.completions.create({ messages, temperature, stream: false });
    return completion.choices?.[0]?.message?.content || 'Dlavie Core-Lite belum menghasilkan jawaban.';
  } catch (error) {
    if (signal?.aborted) throw error;
    if (tier === 'free') {
      try { return await callOpenRouter({ messages, signal, temperature }); } catch (fallbackError) { throw new Error(`Dlavie Core-Lite gagal memuat WebLLM dan fallback cloud belum siap: ${fallbackError.message}`, { cause: fallbackError }); }
    }
    throw error;
  }
};
