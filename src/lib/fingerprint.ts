import type { BaselineRecord, ChartBuckets, Distribution, MatchResult, NumericStats, Similarity } from "./types";

export const FINGERPRINT_MIN = 1;
export const FINGERPRINT_MAX = 355;

export function extractNumber(text: string): number | null {
  const match = text.match(/\d+/);
  if (!match) {
    return null;
  }

  const value = Number.parseInt(match[0], 10);
  if (!Number.isFinite(value) || value < FINGERPRINT_MIN || value > FINGERPRINT_MAX) {
    return null;
  }

  return value;
}

export function calculateDistribution(numbers: number[]): Distribution {
  const counts = new Array(FINGERPRINT_MAX).fill(0);

  for (const number of numbers) {
    if (number >= FINGERPRINT_MIN && number <= FINGERPRINT_MAX) {
      counts[number - 1] += 1;
    }
  }

  const total = numbers.length;
  if (total === 0) {
    return counts;
  }

  return counts.map((count) => count / total);
}

export function calculateStats(numbers: number[]): NumericStats {
  if (numbers.length === 0) {
    throw new Error("Cannot calculate stats without numbers");
  }

  const sorted = [...numbers].sort((left, right) => left - right);
  const mean = numbers.reduce((sum, number) => sum + number, 0) / numbers.length;
  const variance = numbers.reduce((sum, number) => sum + Math.pow(number - mean, 2), 0) / numbers.length;
  const frequencies = new Map<number, number>();
  let mode = sorted[0];
  let modeCount = 0;

  for (const number of numbers) {
    const next = (frequencies.get(number) ?? 0) + 1;
    frequencies.set(number, next);
    if (next > modeCount) {
      modeCount = next;
      mode = number;
    }
  }

  return {
    mean,
    median: sorted[Math.floor(sorted.length / 2)],
    stdDev: Math.sqrt(variance),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    unique: frequencies.size,
    mode,
    modeCount,
  };
}

export function calculateSimilarity(
  distributionA: Distribution,
  distributionB: Distribution,
  statsA: NumericStats,
  statsB: NumericStats,
): Similarity {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < distributionA.length; index += 1) {
    dotProduct += distributionA[index] * distributionB[index];
    normA += distributionA[index] * distributionA[index];
    normB += distributionB[index] * distributionB[index];
  }

  const cosineSimilarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  const epsilon = 1e-10;
  let jsDivergence = 0;

  for (let index = 0; index < distributionA.length; index += 1) {
    const left = distributionA[index] + epsilon;
    const right = distributionB[index] + epsilon;
    const middle = (left + right) / 2;
    jsDivergence += (left * Math.log(left / middle) + right * Math.log(right / middle)) / 2;
  }

  const distributionScore = cosineSimilarity * Math.exp(-jsDivergence);
  const modeScore =
    statsA.mode === statsB.mode ? 1 : Math.max(0, 1 - Math.abs(statsA.mode - statsB.mode) / 50);
  const overallScore = modeScore * 0.5 + distributionScore * 0.5;

  return {
    cosineSimilarity,
    jsDivergence,
    modeScore,
    overallScore,
  };
}

export function matchBaselines(
  distribution: Distribution,
  stats: NumericStats,
  baselines: Array<BaselineRecord & { id: string }>,
): MatchResult[] {
  return baselines
    .map((baseline) => {
      const similarity = calculateSimilarity(distribution, baseline.distribution, stats, baseline.stats);
      return {
        baselineId: baseline.id,
        slug: baseline.slug,
        displayName: baseline.displayName,
        vendor: baseline.vendor,
        model: baseline.model,
        similarity,
        baselineStats: baseline.stats,
        score: similarity.overallScore,
      };
    })
    .sort((left, right) => right.score - left.score);
}

export function bucketizeDistribution(
  distribution: Distribution,
  bucketSize: number,
  label: string,
): ChartBuckets["series"][number] {
  const bucketCount = Math.ceil(distribution.length / bucketSize);
  const values = new Array(bucketCount).fill(0);

  distribution.forEach((value, index) => {
    values[Math.floor(index / bucketSize)] += value;
  });

  return { label, values };
}

export function createBucketLabels(bucketSize: number): string[] {
  const bucketCount = Math.ceil(FINGERPRINT_MAX / bucketSize);

  return Array.from({ length: bucketCount }, (_, index) => {
    const start = index * bucketSize + 1;
    const end = Math.min((index + 1) * bucketSize, FINGERPRINT_MAX);
    return `${start}-${end}`;
  });
}

export function createComparisonChart(
  testDistribution: Distribution,
  baselineDistribution: Distribution,
  testLabel: string,
  baselineLabel: string,
): ChartBuckets {
  const bucketSize = 10;

  return {
    labels: createBucketLabels(bucketSize),
    series: [
      bucketizeDistribution(testDistribution, bucketSize, testLabel),
      bucketizeDistribution(baselineDistribution, bucketSize, baselineLabel),
    ],
  };
}

export function percentileScore(score: number): number {
  return Number((score * 100).toFixed(2));
}
