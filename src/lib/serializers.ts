import type { BaselineProfile, SharedReport, TestRun } from "@prisma/client";

import type { BaselineRecord } from "./types";

export type SerializedBaseline = Omit<BaselineRecord, "distribution" | "stats" | "active"> & {
  id: string;
};

export type SerializedRun = {
  id: string;
  baseUrl: string;
  model: string;
  apiKeyLast4: string | null;
  sampleCount: number;
  concurrency: number;
  processedCount: number;
  errorCount: number;
  validSampleCount: number;
  status: string;
  errorSummary: string | null;
  createdAt: string;
  updatedAt: string;
  stats: unknown;
  summary: unknown;
  topMatches: unknown[];
  chart: unknown;
  shareToken: string | null;
};

export function serializeBaseline(baseline: BaselineProfile): SerializedBaseline {
  return {
    id: baseline.id,
    slug: baseline.slug,
    displayName: baseline.displayName,
    vendor: baseline.vendor,
    model: baseline.model,
    sampleCount: baseline.sampleCount,
    version: baseline.version,
  };
}

export function serializeRun(run: TestRun & { sharedReport: SharedReport | null }): SerializedRun {
  const matches = run.matches as
    | {
        topMatches?: unknown[];
        chart?: unknown;
        summary?: unknown;
      }
    | null;

  return {
    id: run.id,
    baseUrl: run.baseUrl,
    model: run.model,
    apiKeyLast4: run.apiKeyLast4,
    sampleCount: run.sampleCount,
    concurrency: run.concurrency,
    processedCount: run.processedCount,
    errorCount: run.errorCount,
    validSampleCount: Array.isArray(run.validResults) ? run.validResults.length : 0,
    status: run.status,
    errorSummary: run.errorSummary,
    createdAt: run.createdAt.toISOString(),
    updatedAt: run.updatedAt.toISOString(),
    stats: run.stats,
    summary: matches?.summary ?? null,
    topMatches: matches?.topMatches ?? [],
    chart: matches?.chart ?? null,
    shareToken: run.sharedReport?.shareToken ?? null,
  };
}
