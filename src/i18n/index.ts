export type Language = 'en' | 'zh';

import { en } from './translations/en';
import { zh } from './translations/zh';

const STORAGE_KEY = 'exp_sup_interviewer_language';

const resources: Record<Language, Record<string, string>> = { en, zh };

let currentLanguage: Language =
  (typeof window !== 'undefined' && (localStorage.getItem(STORAGE_KEY) as Language)) || 'zh';

const listeners = new Set<() => void>();

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lang);
  }
  listeners.forEach((fn) => fn());
}

export function getLanguage(): Language {
  return currentLanguage;
}

export function t(key: string, vars?: Record<string, string | number>): string {
  let value = resources[currentLanguage][key];
  if (value === undefined) value = resources.en[key];
  if (value === undefined) return key;
  if (!vars) return value;
  return value.replace(/\{\{(\w+)\}\}/g, (_, name) => String(vars[name] ?? ''));
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
