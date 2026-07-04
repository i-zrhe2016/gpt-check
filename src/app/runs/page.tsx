import type { Metadata } from "next";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { formatRunEndpoint, formatRunStatus, formatRunStatusTone, formatRunTime } from "@/lib/run-presenters";
import { serializeRun } from "@/lib/serializers";
import { findWorkspaceFromCookie } from "@/lib/workspace";

export const metadata: Metadata = {
  title: "检测记录",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RunsPage() {
  const workspace = await findWorkspaceFromCookie();
  const runs = workspace
    ? await prisma.testRun.findMany({
        where: {
          workspaceId: workspace.id,
        },
        include: { sharedReport: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      })
    : [];

  const items = runs.map(serializeRun);

  return (
    <main className="shell pageShell">
      <section className="pageHeader">
        <div>
          <p className="eyebrow">运行历史</p>
          <h1>你的检测记录</h1>
          <p className="pageLead">这里只显示当前浏览器保存的最近 100 条检测记录，方便继续查看结果和复用分享链接。</p>
        </div>
        <div className="actionRow">
          <Link className="secondaryButton" href="/" prefetch={false}>
            新建检测
          </Link>
        </div>
      </section>

      {items.length === 0 ? (
        <section className="emptyState">
          <h2>还没有检测记录</h2>
          <p className="muted">先发起一次检测，这里才会出现可回看的结果记录。</p>
          <Link className="primaryButton" href="/" prefetch={false}>
            返回首页
          </Link>
        </section>
      ) : (
        <section className="listPanel">
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">记录列表</p>
              <h2>按时间倒序查看</h2>
              <p className="muted">点击任意记录进入结果页，查看报告详情或生成分享链接。</p>
            </div>
          </div>

          <div className="historyList">
            {items.map((run) => (
              <Link key={run.id} className="runCard" href={`/runs/${run.id}`} prefetch={false}>
                <div className="runCardMain">
                  <strong>{run.model}</strong>
                  <div className="endpointMeta">
                    <span className="endpointLabel">Endpoint</span>
                    <p>{formatRunEndpoint(run.baseUrl)}</p>
                  </div>
                  <span className="runTime">{formatRunTime(run.createdAt)}</span>
                </div>
                <div className="runMeta">
                  <span className={`statusBadge is-${formatRunStatusTone(run.status)}`}>{formatRunStatus(run.status)}</span>
                  <span>
                    {run.validSampleCount}/{run.sampleCount}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
