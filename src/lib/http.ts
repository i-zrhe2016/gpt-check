import { headers } from "next/headers";

import { sha256 } from "./crypto";

export async function getClientIpHash(): Promise<string | null> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const realIp = forwarded?.split(",")[0]?.trim() ?? headerList.get("x-real-ip");

  return realIp ? sha256(realIp) : null;
}

export function createAbsoluteUrlFromRequest(request: Request, pathname: string, searchParams?: URLSearchParams) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? new URL(request.url).host;
  const protocol =
    request.headers.get("x-forwarded-proto") ??
    (host.startsWith("127.0.0.1") || host.startsWith("localhost") ? "http" : "https");

  const url = new URL(pathname, `${protocol}://${host}`);
  if (searchParams && searchParams.size > 0) {
    url.search = searchParams.toString();
  }

  return url;
}
