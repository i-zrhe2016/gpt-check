export type AppLocale = "zh-CN" | "en";

export const DEFAULT_LOCALE: AppLocale = "zh-CN";

export function normalizeLocale(value: string | null | undefined): AppLocale {
  return value === "en" ? "en" : DEFAULT_LOCALE;
}

export function getLocalePrefix(locale: AppLocale) {
  return locale === "en" ? "/en" : "";
}

export function localizePath(locale: AppLocale, pathname: string) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const prefix = getLocalePrefix(locale);

  if (!prefix) {
    return normalizedPath;
  }

  return normalizedPath === "/" ? prefix : `${prefix}${normalizedPath}`;
}
