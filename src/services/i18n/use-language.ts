"use client";

import { useParams } from "next/navigation";
import { Language } from "./store-language-context";
import { fallbackLanguage } from "./config";

function useLanguage(): Language {
  const params = useParams();
  return (params?.lang as Language) ?? fallbackLanguage;
}

export default useLanguage;