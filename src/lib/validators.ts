import { z } from "zod";

export const createTestRunSchema = z.object({
  baseUrl: z.string().trim().min(1).url(),
  apiKey: z.string().trim().min(1),
  model: z.string().trim().min(1),
  sampleCount: z.coerce.number().int().min(50).max(100),
  concurrency: z.coerce.number().int().min(1).max(5),
});

export const shareReportSchema = z.object({
  runId: z.string().min(1),
});
