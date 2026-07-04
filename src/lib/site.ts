const DEFAULT_SITE_URL = "http://127.0.0.1:3000";

export const siteName = "HLWY 模型检查台";
export const siteTitle = "大模型掺水检测工具";
export const siteDescription =
  "用于检测 API 声称的 GPT 模型是否存在掺水、降配或错配，帮助核验第三方 OpenAI 兼容接口实际返回的模型能力。";

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
