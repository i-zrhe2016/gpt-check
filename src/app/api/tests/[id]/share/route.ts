import { NextResponse } from "next/server";

import { createOpaqueToken } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";

export async function POST(_request: Request, context: RouteContext<"/api/tests/[id]/share">) {
  const workspace = await requireWorkspace();
  const { id } = await context.params;

  const run = await prisma.testRun.findFirst({
    where: {
      id,
      workspaceId: workspace.id,
    },
    include: {
      sharedReport: true,
    },
  });

  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  const shared = run.sharedReport
    ? run.sharedReport
    : await prisma.sharedReport.create({
        data: {
          testRunId: run.id,
          shareToken: createOpaqueToken(),
        },
      });

  return NextResponse.json({
    shareUrl: `/share/${shared.shareToken}`,
  });
}
