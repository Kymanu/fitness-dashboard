export function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}

export function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function typeTag(type) {
  const map = { Push: 'tag-push', Pull: 'tag-pull', Legs: 'tag-legs', Rest: 'tag-rest' };
  return map[type] || 'tag-custom';
}

export function formatTime(s) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function getTodayIdx() {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

export const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
