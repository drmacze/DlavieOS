import { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { generateDlavieResponse } from '../services/aiOrchestrator';

export const useDlavieEngine = ({ tier, profile }) => {
  const [isThinking, setThinking] = useState(false);
  const [progress, setProgress] = useState('Menyiapkan Dlavie Core...');
  const abortRef = useRef(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setThinking(false);
    toast('Generasi dihentikan.');
  }, []);

  const generate = useCallback(async ({ prompt, history }) => {
    abortRef.current = new AbortController();
    setThinking(true);
    setProgress('Dlavie AI sedang menganalisis prompt Anda...');
    try {
      const answer = await generateDlavieResponse({ tier, profile, prompt, history, signal: abortRef.current.signal, onProgress: (report) => setProgress(report?.text || 'Memuat model Dlavie Core-Lite...') });
      return answer;
    } catch (error) {
      if (error.name === 'AbortError') return 'Generasi jawaban dihentikan oleh pengguna.';
      toast.error(error.message);
      return `Maaf, Dlavie AI mengalami kendala elegan: ${error.message}. Periksa konfigurasi API atau coba lagi beberapa saat lagi.`;
    } finally {
      setThinking(false);
    }
  }, [profile, tier]);

  return { generate, stop, isThinking, progress };
};
