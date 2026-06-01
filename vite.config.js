import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@mlc-ai/web-llm')) return 'ai';
          if (id.includes('framer-motion') || id.includes('gsap') || id.includes('lenis') || id.includes('locomotive-scroll')) return 'motion';
          if (id.includes('react-markdown') || id.includes('react-syntax-highlighter') || id.includes('remark-gfm')) return 'markdown';
          if (id.includes('@supabase/supabase-js')) return 'supabase';
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm'],
  },
});
