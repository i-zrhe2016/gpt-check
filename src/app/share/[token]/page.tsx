import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReportView } from "@/components/report-view";
import { prisma } from "@/lib/prisma";
import { formatRunEndpoint, formatRunStatus, isTerminalRunStatus } from "@/lib/run-presenters";
import { serializeRun } from "@/lib/serializers";

export const metadata: Metadata = {
  title: "结果访问",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

type SharePageProps = {
  params: Promise<{ token: string }>;
};

export default async function SharePage(props: SharePageProps) {
  const { token } = await props.params;

  const shared = await prisma.sharedReport.findFirst({
    where: {
      shareToken: token,
      revokedAt: null,
    },
    include: {
      testRun: {
        include: {
          sharedReport: true,
        },
      },
    },
  });

  if (!shared) {
    notFound();
  }

  const run = serializeRun(shared.testRun);
  const shouldRefresh = !isTerminalRunStatus(run.status);

  return (
    <>
      {shouldRefresh ? <meta content="3" httpEquiv="refresh" /> : null}
      <main className="shell pageShell">
        <section className="pageHeader">
          <div>
            <p className="eyebrow">结果访问</p>
            <h1>{run.model}</h1>
            <p className="pageLead">
              当前状态：{formatRunStatus(run.status)}。接口地址为 {formatRunEndpoint(run.baseUrl)}。此链接只展示检测结果。
            </p>
          </div>
          <div className="actionRow">
            <Link className="secondaryButton" href="/" prefetch={false}>
              返回首页
            </Link>
          </div>
        </section>

        {shouldRefresh ? <p className="progressNotice">检测仍在进行中，页面会每 3 秒自动刷新一次。</p> : null}

        <ReportView
          heading="访问结果"
          description="这是本次检测的只读结果页，仅用于查看，不包含可复用的接口凭据。"
          run={run}
          shareUrl={null}
          readonly
        />
      </main>
    </>
  );
}
