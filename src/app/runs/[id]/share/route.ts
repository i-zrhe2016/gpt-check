import { NextResponse } from "next/server";

import { getLocalePrefix, normalizeLocale } from "@/lib/locale";
import { createOpaqueToken } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/workspace";

function createRedirectResponse(location: string) {
  return new NextResponse(null, {
    status: 303,
    headers: {
      location,
    },
  });
}

export async function POST(request: Request, context: RouteContext<"/runs/[id]/share">) {
  const locale = normalizeLocale(new URL(request.url).searchParams.get("lang"));
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

  if (!run.sharedReport) {
    await prisma.sharedReport.create({
      data: {
        testRunId: run.id,
        shareToken: createOpaqueToken(),
      },
    });
  }

  return createRedirectResponse(`${getLocalePrefix(locale)}/runs/${run.id}?shared=1`);
}
