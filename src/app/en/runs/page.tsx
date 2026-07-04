import type { Metadata } from "next";
import Link from "next/link";

import { localizePath } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { formatRunEndpoint, formatRunStatus, formatRunStatusTone, formatRunTime } from "@/lib/run-presenters";
import { serializeRun } from "@/lib/serializers";
import { findWorkspaceFromCookie } from "@/lib/workspace";

export const metadata: Metadata = {
  title: "Run History",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function EnglishRunsPage() {
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
          <p className="eyebrow">Run History</p>
          <h1>Your recent checks</h1>
          <p className="pageLead">This page shows only the most recent 100 checks stored in the current browser, so you can reopen results and reuse share links.</p>
        </div>
        <div className="actionRow">
          <Link className="secondaryButton" href="/runs" prefetch={false}>
            中文
          </Link>
          <Link className="secondaryButton" href="/en" prefetch={false}>
            New check
          </Link>
        </div>
      </section>

      {items.length === 0 ? (
        <section className="emptyState">
          <h2>No checks yet</h2>
          <p className="muted">Start a check first, and the saved result history will appear here.</p>
          <Link className="primaryButton" href="/en" prefetch={false}>
            Back to home
          </Link>
        </section>
      ) : (
        <section className="listPanel">
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">Saved Runs</p>
              <h2>Newest first</h2>
              <p className="muted">Open any record to inspect the report details or generate a share link.</p>
            </div>
          </div>

          <div className="historyList">
            {items.map((run) => (
              <Link key={run.id} className="runCard" href={localizePath("en", `/runs/${run.id}`)} prefetch={false}>
                <div className="runCardMain">
                  <strong>{run.model}</strong>
                  <div className="endpointMeta">
                    <span className="endpointLabel">Endpoint</span>
                    <p>{formatRunEndpoint(run.baseUrl)}</p>
                  </div>
                  <span className="runTime">{formatRunTime(run.createdAt, "en")}</span>
                </div>
                <div className="runMeta">
                  <span className={`statusBadge is-${formatRunStatusTone(run.status)}`}>{formatRunStatus(run.status, "en")}</span>
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
