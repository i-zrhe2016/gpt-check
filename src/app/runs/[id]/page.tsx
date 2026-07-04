import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReportView } from "@/components/report-view";
import { prisma } from "@/lib/prisma";
import { formatRunEndpoint, formatRunStatus, formatRunTime, isTerminalRunStatus } from "@/lib/run-presenters";
import { serializeRun } from "@/lib/serializers";
import { findWorkspaceFromCookie } from "@/lib/workspace";

export const metadata: Metadata = {
  title: "检测详情",
  robots: {
    index: false,
    follow: false,
  },
};

function readSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function createAbsoluteUrl(pathname: string) {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");

  if (!host) {
    return pathname;
  }

  const protocol =
    headerStore.get("x-forwarded-proto") ??
    (host.startsWith("127.0.0.1") || host.startsWith("localhost") ? "http" : "https");

  return `${protocol}://${host}${pathname}`;
}

type RunDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RunDetailPage(props: RunDetailPageProps) {
  const workspace = await findWorkspaceFromCookie();
  if (!workspace) {
    notFound();
  }

  const [{ id }, searchParams] = await Promise.all([props.params, props.searchParams]);
  const record = await prisma.testRun.findFirst({
    where: {
      id,
      workspaceId: workspace.id,
    },
    include: {
      sharedReport: true,
    },
  });

  if (!record) {
    notFound();
  }

  const run = serializeRun(record);
  const shareUrl = run.shareToken ? await createAbsoluteUrl(`/share/${run.shareToken}`) : null;
  const shouldRefresh = !isTerminalRunStatus(run.status);
  const showSharedNotice = readSearchValue(searchParams.shared) === "1" && shareUrl;

  return (
    <>
      {shouldRefresh ? <meta content="3" httpEquiv="refresh" /> : null}
      <main className="shell pageShell">
        <section className="pageHeader">
          <div>
            <p className="eyebrow">检测详情</p>
            <h1>{run.model}</h1>
            <p className="pageLead">
              当前状态：{formatRunStatus(run.status)}。创建于 {formatRunTime(run.createdAt)}，接口地址为{" "}
              {formatRunEndpoint(run.baseUrl)}。
            </p>
          </div>

          <div className="actionRow">
            <Link className="secondaryButton" href="/" prefetch={false}>
              新建检测
            </Link>
            <Link className="secondaryButton" href="/runs" prefetch={false}>
              查看历史
            </Link>
            {!shareUrl ? (
              <form action={`/runs/${run.id}/share`} method="post">
                <button className="primaryButton" type="submit">
                  生成链接
                </button>
              </form>
            ) : null}
          </div>
        </section>

        {shouldRefresh ? (
          <p className="progressNotice">检测仍在进行中，页面会每 3 秒自动刷新一次。</p>
        ) : null}

        {showSharedNotice ? <p className="shareNotice">访问链接已生成，可直接打开或复制给他人。</p> : null}

        {shareUrl ? (
          <p className="shareNotice" id="share-link">
            访问链接：
            {" "}
            <a href={shareUrl}>{shareUrl}</a>
          </p>
        ) : null}

        <ReportView
          description="这里展示本次检测的完整结果。运行中会先显示进度，完成后补齐排名和分布图。"
          heading="当前结果"
          run={run}
          shareUrl={shareUrl}
        />
      </main>
    </>
  );
}
