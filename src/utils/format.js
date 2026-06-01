export const formatRupiah = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

export const estimateTokens = (text = '') => Math.max(1, Math.ceil(String(text).trim().split(/\s+/).filter(Boolean).length * 1.35));

export const compactDate = (date = new Date()) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));

export const dayLabel = (date = new Date()) => new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(date));

export const sanitizeInput = (value = '') => String(value).replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '').replace(/javascript:/gi, '').trim().slice(0, 12000);

export const makeSessionTitle = (prompt = 'Percakapan Baru') => {
  const cleaned = sanitizeInput(prompt).replace(/[\n#*_`>]/g, ' ');
  return cleaned.length > 54 ? `${cleaned.slice(0, 54)}…` : cleaned || 'Percakapan Baru';
};

export const downloadText = (filename, content) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};
