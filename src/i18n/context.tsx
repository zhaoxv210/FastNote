import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Lang } from "./translations";
import { t as translate } from "./translations";

const LANG_KEY = "fastnote-lang";

function loadLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === "en" || stored === "zh") return stored;
  } catch {}
  return "zh";
}

interface I18nContextValue {
  lang: Lang;
  t: (key: string, params?: Record<string, string | number>) => string;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "zh",
  t: (k, p) => translate("zh", k, p),
  toggleLang: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(loadLang);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(lang, key, params),
    [lang],
  );

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === "zh" ? "en" : "zh";
      try { localStorage.setItem(LANG_KEY, next); } catch {}
      return next;
    });
  }, []);

  return (
    <I18nContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
