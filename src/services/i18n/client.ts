"use client";

import i18next from "i18next";
import { useEffect } from "react";
import {
  initReactI18next,
  useTranslation as useTranslationOriginal,
} from "react-i18next";
import resourcesToBackend from "i18next-resources-to-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { getOptions, languages } from "./config";
import useStoreLanguage from "./use-store-language";

const runsOnServerSide = typeof window === "undefined";

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`./locales/${language}/${namespace}.json`)
    )
  )
  .init({
    ...getOptions(),
    lng: undefined, // Let detect the language on client side
    detection: {
      order: ["cookie", "htmlTag", "navigator"],
      caches: ["cookie"],
    },
    preload: runsOnServerSide ? languages : [],
  });

export function useTranslation(namespace: string, options?: object) {
  const { language: cookieLanguage } = useStoreLanguage();
  const originalInstance = useTranslationOriginal(namespace, options);
  const { i18n } = originalInstance;
  
  useEffect(() => {
    if (cookieLanguage && i18n.resolvedLanguage !== cookieLanguage) {
      i18n.changeLanguage(cookieLanguage);
    }
  }, [cookieLanguage, i18n]);

  return originalInstance;
}