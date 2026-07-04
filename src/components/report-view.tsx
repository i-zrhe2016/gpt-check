import type { SerializedRun } from "@/lib/serializers";
import { formatRunOutcome, formatRunStatus } from "@/lib/run-presenters";

type ReportViewProps = {
  heading: string;
  description: string;
  run: SerializedRun;
  shareUrl: string | null;
  readonly?: boolean;
};

function formatPercent(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "暂无";
  }

  return `${(value * 100).toFixed(2)}%`;
}

export function ReportView({ heading, description, run, shareUrl, readonly = false }: ReportViewProps) {
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
      }
    | null;

  return (
    <section className="reportCard">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">{heading}</p>
          <h2>检测报告</h2>
          <p className="muted">{description}</p>
        </div>
        {!readonly && shareUrl ? (
          <a className="secondaryButton" href={shareUrl}>
            打开访问页
          </a>
        ) : null}
      </div>

      <div className="reportGrid">
        <div className="metricCard">
          <span>运行状态</span>
          <strong>{formatRunStatus(run.status)}</strong>
          {summary?.outcome ? <small>{formatRunOutcome(summary.outcome)}</small> : null}
          <p>{summary?.explanation ?? "检测完成后，这里会显示结果摘要。"}</p>
        </div>
        <div className="metricCard">
          <span>有效样本</span>
          <strong>
            {run.validSampleCount} / {run.sampleCount}
          </strong>
          <p>当前已处理 {run.processedCount} 次请求。</p>
        </div>
        <div className="metricCard">
          <span>请求失败</span>
          <strong>{run.errorCount}</strong>
          <p>{run.errorSummary ?? "当前没有记录到请求失败。"}</p>
        </div>
      </div>

      <div className="reportBody">
        <div className="matchesCard">
          <h3>相似度排名</h3>
          {topMatches.length === 0 ? <p className="muted">当前还没有可展示的排名结果。</p> : null}
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
                  <h4>{String(match.displayName ?? "未知基线")}</h4>
                  <p className="muted">
                    {String(match.vendor ?? "")} / {String(match.model ?? "")}
                  </p>
                </div>
                <div className="matchStats">
                  <span>综合 {formatPercent(typeof match.score === "number" ? match.score : undefined)}</span>
                  <span>众数 {formatPercent(similarity?.modeScore)}</span>
                  <span>余弦 {formatPercent(similarity?.cosineSimilarity)}</span>
                </div>
              </article>
            );
          })}
        </div>

        <div className="chartCard">
          <h3>分桶分布对比</h3>
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
            <p className="muted">收集到足够样本后，这里会显示分布图。</p>
          )}
        </div>
      </div>
    </section>
  );
}
