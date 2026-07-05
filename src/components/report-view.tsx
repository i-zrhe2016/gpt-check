import type { SerializedRun } from "@/lib/serializers";
import type { AppLocale } from "@/lib/locale";
import {
  formatRunErrorSummary,
  formatRunOutcome,
  formatRunStatus,
  formatRunSummaryExplanation,
  formatRunSummaryRecommendation,
  formatRunSummaryVerdict,
} from "@/lib/run-presenters";

type ReportViewProps = {
  heading: string;
  description: string;
  run: SerializedRun;
  shareUrl: string | null;
  locale?: AppLocale;
  readonly?: boolean;
};

function formatPercent(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return `${(value * 100).toFixed(2)}%`;
}

export function ReportView({ heading, description, run, shareUrl, locale = "zh-CN", readonly = false }: ReportViewProps) {
  const topMatches = Array.isArray(run.topMatches) ? (run.topMatches as Array<Record<string, unknown>>) : [];
  const chart = run.chart as
    | {
        labels?: string[];
        series?: Array<{ label?: string; values?: number[] }>;
      }
    | null;
  const summary = run.summary as
    | {
        explanation?: string;
        outcome?: string;
        requestedModel?: string;
        matchedModel?: string;
        matchedDisplayName?: string;
        topScore?: number;
        scoreGap?: number;
        verdict?: string;
        recommendation?: string;
      }
    | null;
  const copy =
    locale === "en"
      ? {
          title: "Detection Report",
          openSharePage: "Open shared view",
          runStatus: "Run status",
          summaryPlaceholder: "A summary will appear here after the check completes.",
          recommendationLabel: "Next step",
          validSamples: "Valid samples",
          processedRequests: `Processed ${run.processedCount} requests so far.`,
          requestFailures: "Request failures",
          noFailures: "No request failures have been recorded.",
          rankingTitle: "Similarity Ranking",
          emptyRanking: "No ranking is available yet.",
          unknownBaseline: "Unknown baseline",
          overall: "Overall",
          mode: "Mode",
          cosine: "Cosine",
          chartTitle: "Bucket Distribution Comparison",
          chartPlaceholder: "The distribution chart will appear after enough samples have been collected.",
          unavailable: "N/A",
        }
      : {
          title: "检测报告",
          openSharePage: "打开访问页",
          runStatus: "运行状态",
          summaryPlaceholder: "检测完成后，这里会显示结果摘要。",
          recommendationLabel: "建议动作",
          validSamples: "有效样本",
          processedRequests: `当前已处理 ${run.processedCount} 次请求。`,
          requestFailures: "请求失败",
          noFailures: "当前没有记录到请求失败。",
          rankingTitle: "相似度排名",
          emptyRanking: "当前还没有可展示的排名结果。",
          unknownBaseline: "未知基线",
          overall: "综合",
          mode: "众数",
          cosine: "余弦",
          chartTitle: "分桶分布对比",
          chartPlaceholder: "收集到足够样本后，这里会显示分布图。",
          unavailable: "暂无",
        };
  const summaryText = formatRunSummaryExplanation(summary, topMatches, locale);
  const summaryVerdict = formatRunSummaryVerdict(summary, locale);
  const summaryRecommendation = formatRunSummaryRecommendation(summary, locale);

  return (
    <section className="reportCard">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">{heading}</p>
          <h2>{copy.title}</h2>
          <p className="muted">{description}</p>
        </div>
        {!readonly && shareUrl ? (
          <a className="secondaryButton" href={shareUrl}>
            {copy.openSharePage}
          </a>
        ) : null}
      </div>

      <div className="reportGrid">
        <div className="metricCard">
          <span>{copy.runStatus}</span>
          <strong>{formatRunStatus(run.status, locale)}</strong>
          {summary?.outcome ? <small>{formatRunOutcome(summary.outcome, locale)}</small> : null}
          {summaryVerdict ? <p><strong>{summaryVerdict}</strong></p> : null}
          <p>{summaryText ?? copy.summaryPlaceholder}</p>
          {summaryRecommendation ? (
            <p>
              <strong>{copy.recommendationLabel}：</strong>
              {summaryRecommendation}
            </p>
          ) : null}
        </div>
        <div className="metricCard">
          <span>{copy.validSamples}</span>
          <strong>
            {run.validSampleCount} / {run.sampleCount}
          </strong>
          <p>{copy.processedRequests}</p>
        </div>
        <div className="metricCard">
          <span>{copy.requestFailures}</span>
          <strong>{run.errorCount}</strong>
          <p>{formatRunErrorSummary(run.errorSummary, locale) ?? copy.noFailures}</p>
        </div>
      </div>

      <div className="reportBody">
        <div className="matchesCard">
          <h3>{copy.rankingTitle}</h3>
          {topMatches.length === 0 ? <p className="muted">{copy.emptyRanking}</p> : null}
          {topMatches.map((match, index) => {
            const similarity = match.similarity as
              | {
                  modeScore?: number;
                  cosineSimilarity?: number;
                }
              | undefined;

            return (
              <article key={`${String(match.slug)}-${index}`} className="matchCard">
                <div className="matchRank">#{index + 1}</div>
                <div>
                  <h4>{String(match.displayName ?? copy.unknownBaseline)}</h4>
                  <p className="muted">
                    {String(match.vendor ?? "")} / {String(match.model ?? "")}
                  </p>
                </div>
                <div className="matchStats">
                  <span>{copy.overall} {formatPercent(typeof match.score === "number" ? match.score : undefined) ?? copy.unavailable}</span>
                  <span>{copy.mode} {formatPercent(similarity?.modeScore) ?? copy.unavailable}</span>
                  <span>{copy.cosine} {formatPercent(similarity?.cosineSimilarity) ?? copy.unavailable}</span>
                </div>
              </article>
            );
          })}
        </div>

        <div className="chartCard">
          <h3>{copy.chartTitle}</h3>
          {chart?.labels && chart.series?.length ? (
            <div className="chartStack">
              {chart.series.map((series, seriesIndex) => (
                <div key={series.label} className="chartSeries">
                  <div className="chartLegend">{series.label}</div>
                  <div className="chartBars">
                    {series.values?.map((value, index) => (
                      <div
                        key={`${series.label}-${chart.labels?.[index]}`}
                        className="chartBarWrap"
                        title={`${series.label} ${chart.labels?.[index]} ${(value * 100).toFixed(2)}%`}
                      >
                        <div
                          className={`chartBar${seriesIndex === 1 ? " isReference" : ""}`}
                          style={{
                            height: `${Math.max(6, value * 480)}px`,
                          }}
                        />
                        <span>{chart.labels?.[index]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">{copy.chartPlaceholder}</p>
          )}
        </div>
      </div>
    </section>
  );
}
