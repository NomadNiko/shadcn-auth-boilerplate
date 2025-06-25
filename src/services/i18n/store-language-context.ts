"use client";

import { createContext } from "react";
import { languages } from "./config";

export type Language = (typeof languages)[number];

export type StoreLanguageContextType = {
  language: Language;
};

export type StoreLanguageActionsContextType = {
  setLanguage: (language: Language) => void;
};

export const StoreLanguageContext = createContext<StoreLanguageContextType>({
  language: "en",
});

export const StoreLanguageActionsContext = createContext<StoreLanguageActionsContextType>({
  setLanguage: () => {},
});