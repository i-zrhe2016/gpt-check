import { createHash, randomBytes } from "node:crypto";

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function createOpaqueToken(): string {
  return randomBytes(24).toString("hex");
}

export function last4(value: string): string {
  return value.slice(-4);
}
