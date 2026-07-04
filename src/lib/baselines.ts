import type { BaselineProfile } from "@prisma/client";

import { prisma } from "./prisma";
import type { BaselineRecord } from "./types";

export function normalizeBaseline(baseline: BaselineProfile): BaselineRecord & { id: string } {
  return {
    id: baseline.id,
    slug: baseline.slug,
    displayName: baseline.displayName,
    vendor: baseline.vendor,
    model: baseline.model,
    sampleCount: baseline.sampleCount,
    distribution: baseline.distribution as number[],
    stats: baseline.stats as BaselineRecord["stats"],
    version: baseline.version,
    active: baseline.active,
  };
}

export async function listActiveBaselines() {
  const baselines = await prisma.baselineProfile.findMany({
    where: { active: true },
    orderBy: [{ vendor: "asc" }, { displayName: "asc" }],
  });

  return baselines.map(normalizeBaseline);
}
