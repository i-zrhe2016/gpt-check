export type Distribution = number[];

export type NumericStats = {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  unique: number;
  mode: number;
  modeCount: number;
};

export type Similarity = {
  cosineSimilarity: number;
  jsDivergence: number;
  modeScore: number;
  overallScore: number;
};

export type BaselineRecord = {
  slug: string;
  displayName: string;
  vendor: string;
  model: string;
  sampleCount: number;
  distribution: Distribution;
  stats: NumericStats;
  version: number;
  active: boolean;
};

export type MatchResult = {
  baselineId: string;
  slug: string;
  displayName: string;
  vendor: string;
  model: string;
  similarity: Similarity;
  baselineStats: NumericStats;
  score: number;
};

export type ReportSummary = {
  outcome: "matched" | "insufficient_data" | "failed";
  validSamples: number;
  sampleCount: number;
  topScore?: number;
  explanation: string;
};

export type ChartBuckets = {
  labels: string[];
  series: Array<{
    label: string;
    values: number[];
  }>;
};
