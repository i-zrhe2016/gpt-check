import { PrismaClient } from "@prisma/client";

import { DEMO_BASELINES } from "../src/lib/demo-baselines";

const LEGACY_OPENAI_BASELINE_SLUGS = ["openai-gpt-4o", "openai-gpt-4.1", "openai-gpt-4.1-mini"] as const;

const prisma = new PrismaClient();

async function main() {
  const currentSlugs = DEMO_BASELINES.map((baseline) => baseline.slug);

  for (const baseline of DEMO_BASELINES) {
    await prisma.baselineProfile.upsert({
      where: { slug: baseline.slug },
      update: {
        displayName: baseline.displayName,
        vendor: baseline.vendor,
        model: baseline.model,
        sampleCount: baseline.sampleCount,
        distribution: baseline.distribution,
        stats: baseline.stats,
        version: baseline.version,
        active: baseline.active,
      },
      create: baseline,
    });
  }

  await prisma.baselineProfile.updateMany({
    where: {
      slug: {
        in: [...LEGACY_OPENAI_BASELINE_SLUGS],
      },
    },
    data: {
      active: false,
    },
  });

  await prisma.baselineProfile.updateMany({
    where: {
      slug: {
        in: currentSlugs,
      },
    },
    data: {
      active: true,
    },
  });
}

main()
  .catch(async (error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
