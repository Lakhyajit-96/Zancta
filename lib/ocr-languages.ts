export const FREE_OCR_LANGUAGE = "eng" as const;

export const PREMIUM_OCR_LANGUAGES = ["hin", "ben", "tam", "spa", "fra", "deu"] as const;

export type FreeOcrLanguage = typeof FREE_OCR_LANGUAGE;
export type PremiumOcrLanguage = (typeof PREMIUM_OCR_LANGUAGES)[number];
export type OcrLanguage = FreeOcrLanguage | PremiumOcrLanguage;

export type OcrLanguagePack = {
  code: OcrLanguage;
  name: string;
  premium: boolean;
};

export const OCR_LANGUAGE_PACKS: readonly OcrLanguagePack[] = [
  { code: "eng", name: "English", premium: false },
  { code: "hin", name: "Hindi", premium: true },
  { code: "ben", name: "Bengali", premium: true },
  { code: "tam", name: "Tamil", premium: true },
  { code: "spa", name: "Spanish", premium: true },
  { code: "fra", name: "French", premium: true },
  { code: "deu", name: "German", premium: true },
] as const;

export const PREMIUM_LANG_FILE_RE = /^(hin|ben|tam|spa|fra|deu)\.traineddata\.gz$/;

export function isOcrLanguage(value: string): value is OcrLanguage {
  return OCR_LANGUAGE_PACKS.some((language) => language.code === value);
}

export function isPremiumOcrLanguage(value: string): value is PremiumOcrLanguage {
  return (PREMIUM_OCR_LANGUAGES as readonly string[]).includes(value);
}

export function isFreeOcrLanguage(value: string): value is FreeOcrLanguage {
  return value === FREE_OCR_LANGUAGE;
}

export function languagePackFileName(code: PremiumOcrLanguage): string {
  return `${code}.traineddata.gz`;
}

export function parsePremiumLangFile(file: string): PremiumOcrLanguage | null {
  if (!PREMIUM_LANG_FILE_RE.test(file)) return null;
  const code = file.replace(/\.traineddata\.gz$/, "");
  return isPremiumOcrLanguage(code) ? code : null;
}
