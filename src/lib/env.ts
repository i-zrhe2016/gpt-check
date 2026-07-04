function readBoolean(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw == null) {
    return defaultValue;
  }

  return raw.toLowerCase() === "true";
}

export const env = {
  databaseUrl: process.env.DATABASE_URL,
  allowInsecureBaseUrls: readBoolean("ALLOW_INSECURE_BASE_URLS", false),
};
