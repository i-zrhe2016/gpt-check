import type { BaselineRecord, Distribution, NumericStats } from "./types";

function buildCurve(seed: number, peaks: Array<[number, number, number]>): Distribution {
  const values = Array.from({ length: 355 }, (_, index) => {
    const x = index + 1;
    const wave = 0.2 + Math.abs(Math.sin((x + seed) / 11)) * 0.04;
    const peakWeight = peaks.reduce((sum, [center, spread, strength]) => {
      const distance = x - center;
      return sum + strength * Math.exp(-(distance * distance) / (2 * spread * spread));
    }, 0);

    return wave + peakWeight;
  });

  const total = values.reduce((sum, value) => sum + value, 0);
  return values.map((value) => value / total);
}

function statsFromDistribution(distribution: Distribution): NumericStats {
  const pairs = distribution.map((value, index) => ({ value, number: index + 1 }));
  const totalWeight = pairs.reduce((sum, pair) => sum + pair.value, 0);
  const mean = pairs.reduce((sum, pair) => sum + pair.number * pair.value, 0) / totalWeight;
  const variance =
    pairs.reduce((sum, pair) => sum + Math.pow(pair.number - mean, 2) * pair.value, 0) / totalWeight;
  let cumulative = 0;
  let median = 1;
  let mode = 1;
  let modeCount = 0;

  for (const pair of pairs) {
    cumulative += pair.value;
    if (cumulative >= 0.5 && median === 1) {
      median = pair.number;
    }
    if (pair.value > modeCount) {
      modeCount = pair.value;
      mode = pair.number;
    }
  }

  return {
    mean,
    median,
    stdDev: Math.sqrt(variance),
    min: 1,
    max: 355,
    unique: 355,
    mode,
    modeCount: Math.round(modeCount * 1000),
  };
}

function makeBaseline(
  slug: string,
  displayName: string,
  vendor: string,
  model: string,
  seed: number,
  peaks: Array<[number, number, number]>,
): BaselineRecord {
  const distribution = buildCurve(seed, peaks);

  return {
    slug,
    displayName,
    vendor,
    model,
    sampleCount: 120,
    distribution,
    stats: statsFromDistribution(distribution),
    version: 1,
    active: true,
  };
}

export const DEMO_BASELINES: BaselineRecord[] = [
  makeBaseline("openai-gpt-5.5", "GPT-5.5 Official", "OpenAI", "gpt-5.5", 7, [
    [42, 10, 0.35],
    [173, 18, 0.28],
    [289, 9, 0.42],
  ]),
  makeBaseline("openai-gpt-5.4", "GPT-5.4 Official", "OpenAI", "gpt-5.4", 19, [
    [63, 15, 0.32],
    [201, 11, 0.36],
    [317, 14, 0.33],
  ]),
  makeBaseline("openai-gpt-5.4-mini", "GPT-5.4 mini Official", "OpenAI", "gpt-5.4-mini", 31, [
    [28, 8, 0.37],
    [144, 16, 0.27],
    [250, 13, 0.31],
  ]),
  makeBaseline("openai-gpt-5.4-nano", "GPT-5.4 nano Official", "OpenAI", "gpt-5.4-nano", 43, [
    [17, 6, 0.36],
    [119, 14, 0.24],
    [331, 12, 0.35],
  ]),
];
