import dns from "node:dns/promises";
import net from "node:net";

import { env } from "./env";

const PRIVATE_IPV4_RANGES: Array<[number, number]> = [
  [ipToInt("10.0.0.0"), ipToInt("10.255.255.255")],
  [ipToInt("127.0.0.0"), ipToInt("127.255.255.255")],
  [ipToInt("169.254.0.0"), ipToInt("169.254.255.255")],
  [ipToInt("172.16.0.0"), ipToInt("172.31.255.255")],
  [ipToInt("192.168.0.0"), ipToInt("192.168.255.255")],
];

function ipToInt(value: string): number {
  return value
    .split(".")
    .map((part) => Number.parseInt(part, 10))
    .reduce((sum, part) => (sum << 8) + part, 0) >>> 0;
}

function isPrivateIpv4(ip: string): boolean {
  const numeric = ipToInt(ip);
  return PRIVATE_IPV4_RANGES.some(([start, end]) => numeric >= start && numeric <= end);
}

function isUnsafeIpv6(ip: string): boolean {
  return ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80:");
}

export async function assertSafeBaseUrl(input: string): Promise<URL> {
  const url = new URL(input);

  if (url.pathname === "") {
    url.pathname = "/";
  }

  if (!env.allowInsecureBaseUrls && url.protocol !== "https:") {
    throw new Error("Only https Base URL values are allowed");
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost") {
    throw new Error("Localhost is not allowed");
  }

  const addressType = net.isIP(hostname);
  if (addressType === 4 && isPrivateIpv4(hostname)) {
    throw new Error("Private IPv4 addresses are not allowed");
  }
  if (addressType === 6 && isUnsafeIpv6(hostname)) {
    throw new Error("Private IPv6 addresses are not allowed");
  }

  if (addressType === 0) {
    const resolved = await dns.lookup(hostname, { all: true });
    for (const record of resolved) {
      if (record.family === 4 && isPrivateIpv4(record.address)) {
        throw new Error("Base URL resolves to a private IPv4 address");
      }
      if (record.family === 6 && isUnsafeIpv6(record.address)) {
        throw new Error("Base URL resolves to a private IPv6 address");
      }
    }
  }

  return url;
}
