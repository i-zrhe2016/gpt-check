import { NextResponse } from "next/server";

import { getClientIpHash } from "@/lib/http";
import { normalizeBaseUrl } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { assertRunRateLimit } from "@/lib/rate-limit";
import { serializeRun } from "@/lib/serializers";
import { formatRunStartError } from "@/lib/run-presenters";
import { createPendingRun, executeRun } from "@/lib/test-runner";
import { assertSafeBaseUrl } from "@/lib/url-safety";
import { createTestRunSchema } from "@/lib/validators";
import { requireWorkspace } from "@/lib/workspace";

export async function GET() {
  const workspace = await requireWorkspace();
  const runs = await prisma.testRun.findMany({
    where: { workspaceId: workspace.id },
    include: { sharedReport: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    runs: runs.map(serializeRun),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const parsed = createTestRunSchema.safeParse({
    ...body,
    baseUrl: typeof body.baseUrl === "string" ? normalizeBaseUrl(body.baseUrl) : body.baseUrl,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "请求参数无效",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    await assertSafeBaseUrl(parsed.data.baseUrl);

    const workspace = await requireWorkspace();
    const requestIpHash = await getClientIpHash();
    await assertRunRateLimit(workspace.id, requestIpHash);

    const run = await createPendingRun({
      workspaceId: workspace.id,
      requestIpHash,
      ...parsed.data,
    });

    void executeRun({
      runId: run.id,
      ...parsed.data,
    });

    return NextResponse.json({
      runId: run.id,
      status: run.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: formatRunStartError(error),
      },
      { status: 400 },
    );
  }
}
