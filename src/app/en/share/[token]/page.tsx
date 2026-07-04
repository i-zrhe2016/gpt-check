import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReportView } from "@/components/report-view";
import { localizePath } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { formatRunEndpoint, formatRunStatus, isTerminalRunStatus } from "@/lib/run-presenters";
import { serializeRun } from "@/lib/serializers";

export const metadata: Metadata = {
  title: "Shared Result",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

type SharePageProps = {
  params: Promise<{ token: string }>;
};

export default async function EnglishSharePage(props: SharePageProps) {
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
            <p className="eyebrow">Shared Result</p>
            <h1>{run.model}</h1>
            <p className="pageLead">
              Current status: {formatRunStatus(run.status, "en")}. Endpoint: {formatRunEndpoint(run.baseUrl)}. This link is read-only and exposes only the result.
            </p>
          </div>
          <div className="actionRow">
            <Link className="secondaryButton" href={localizePath("zh-CN", `/share/${token}`)} prefetch={false}>
              中文
            </Link>
            <Link className="secondaryButton" href="/en" prefetch={false}>
              Back to home
            </Link>
          </div>
        </section>

        {shouldRefresh ? <p className="progressNotice">The check is still running. This page refreshes automatically every 3 seconds.</p> : null}

        <ReportView
          heading="Shared View"
          description="This is the read-only result page for the run. It is intended only for review and does not include reusable credentials."
          locale="en"
          run={run}
          shareUrl={null}
          readonly
        />
      </main>
    </>
  );
}
