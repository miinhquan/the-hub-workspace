'use client';

import {createContext, useContext, useEffect, useState, type ReactNode} from 'react';
import vi from './vi.json';

type Language = 'en' | 'vi';
const translations: Record<string, string> = vi;
const LocaleContext = createContext({
  language: 'en' as Language,
  locale: 'en-GB',
  setLanguage: (_language: Language) => {},
  t: (text: string | number) => String(text),
});

export function LocaleProvider({children}: {children: ReactNode}) {
  const [language, setLanguage] = useState<Language>('en');
  useEffect(() => {
    try { if (localStorage.getItem('hub-workspace-language') === 'vi') setLanguage('vi'); } catch {}
  }, []);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  function changeLanguage(next: Language) {
    setLanguage(next);
    try { localStorage.setItem('hub-workspace-language', next); } catch {}
  }
  // Translate interface labels only. Customer names, messages and saved record values stay unchanged.
  const t = (text: string | number) => language === 'vi'
    ? translations[String(text)] ?? String(text)
    : String(text);
  return <LocaleContext.Provider value={{language, locale: language === 'vi' ? 'vi-VN' : 'en-GB', setLanguage: changeLanguage, t}}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);
export function LanguageSwitch() {
  const {language, setLanguage} = useLocale();
  return <select className="language-switch" aria-label="Language / Ngôn ngữ" value={language} onChange={e => setLanguage(e.target.value as Language)}>
    <option value="en">English</option><option value="vi">Tiếng Việt</option>
  </select>;
}
