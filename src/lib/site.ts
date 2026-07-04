import type { AppLocale } from "./locale";

const DEFAULT_SITE_URL = "http://127.0.0.1:3000";

export function getSiteName(locale: AppLocale = "zh-CN") {
  return locale === "en" ? "HLWY Model Check" : "HLWY 模型检查台";
}

export function getSiteTitle(locale: AppLocale = "zh-CN") {
  return locale === "en" ? "Model Downgrade Detection" : "大模型掺水检测工具";
}

export function getSiteDescription(locale: AppLocale = "zh-CN") {
  if (locale === "en") {
    return "Checks whether an API that claims to expose a GPT model is serving a diluted, downgraded, or mismatched model behind an OpenAI-compatible endpoint.";
  }

  return "用于检测 API 声称的 GPT 模型是否存在掺水、降配或错配，帮助核验第三方 OpenAI 兼容接口实际返回的模型能力。";
}

export function resolveSiteUrl() {
  const raw = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;

  try {
    return new URL(raw);
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
}

export function resolveAbsoluteUrl(pathname = "/") {
  return new URL(pathname, resolveSiteUrl()).toString();
}
