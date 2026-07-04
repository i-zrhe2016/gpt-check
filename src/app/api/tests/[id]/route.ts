import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { serializeRun } from "@/lib/serializers";
import { requireWorkspace } from "@/lib/workspace";

export async function GET(_request: Request, context: RouteContext<"/api/tests/[id]">) {
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

  return NextResponse.json({
    run: serializeRun(run),
  });
}
