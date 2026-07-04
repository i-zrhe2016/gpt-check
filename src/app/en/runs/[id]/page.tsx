import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReportView } from "@/components/report-view";
import { localizePath } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { formatRunEndpoint, formatRunStatus, formatRunTime, isTerminalRunStatus } from "@/lib/run-presenters";
import { serializeRun } from "@/lib/serializers";
import { findWorkspaceFromCookie } from "@/lib/workspace";

export const metadata: Metadata = {
  title: "Run Details",
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

export default async function EnglishRunDetailPage(props: RunDetailPageProps) {
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
  const shareUrl = run.shareToken ? await createAbsoluteUrl(localizePath("en", `/share/${run.shareToken}`)) : null;
  const shouldRefresh = !isTerminalRunStatus(run.status);
  const showSharedNotice = readSearchValue(searchParams.shared) === "1" && shareUrl;

  return (
    <>
      {shouldRefresh ? <meta content="3" httpEquiv="refresh" /> : null}
      <main className="shell pageShell">
        <section className="pageHeader">
          <div>
            <p className="eyebrow">Run Details</p>
            <h1>{run.model}</h1>
            <p className="pageLead">
              Current status: {formatRunStatus(run.status, "en")}. Created at {formatRunTime(run.createdAt, "en")}. Endpoint:{" "}
              {formatRunEndpoint(run.baseUrl)}.
            </p>
          </div>

          <div className="actionRow">
            <Link className="secondaryButton" href={localizePath("zh-CN", `/runs/${run.id}`)} prefetch={false}>
              中文
            </Link>
            <Link className="secondaryButton" href="/en" prefetch={false}>
              New check
            </Link>
            <Link className="secondaryButton" href="/en/runs" prefetch={false}>
              History
            </Link>
            {!shareUrl ? (
              <form action={`/runs/${run.id}/share?lang=en`} method="post">
                <button className="primaryButton" type="submit">
                  Generate link
                </button>
              </form>
            ) : null}
          </div>
        </section>

        {shouldRefresh ? <p className="progressNotice">The check is still running. This page refreshes automatically every 3 seconds.</p> : null}

        {showSharedNotice ? <p className="shareNotice">The shared link is ready. You can open it directly or send it to someone else.</p> : null}

        {shareUrl ? (
          <p className="shareNotice" id="share-link">
            Shared URL: <a href={shareUrl}>{shareUrl}</a>
          </p>
        ) : null}

        <ReportView
          description="This page shows the full result for the current run. While the job is still running, progress appears first and ranking/chart details fill in later."
          heading="Current Result"
          locale="en"
          run={run}
          shareUrl={shareUrl}
        />
      </main>
    </>
  );
}
