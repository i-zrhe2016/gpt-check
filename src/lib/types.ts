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

export type ReportOutcome =
  | "match"
  | "suspected_downgrade"
  | "mismatch"
  | "baseline_missing"
  | "inconclusive"
  | "insufficient_data"
  | "failed";

export type ReportSummary = {
  outcome: ReportOutcome;
  validSamples: number;
  sampleCount: number;
  requestedModel?: string;
  matchedModel?: string;
  matchedDisplayName?: string;
  topScore?: number;
  scoreGap?: number;
  verdict: string;
  explanation: string;
  recommendation?: string;
};

export type ChartBuckets = {
  labels: string[];
  series: Array<{
    label: string;
    values: number[];
  }>;
};
