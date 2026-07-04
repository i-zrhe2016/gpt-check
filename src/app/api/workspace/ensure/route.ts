import { NextResponse } from "next/server";

import { ensureWorkspace } from "@/lib/workspace";

export async function POST() {
  const ensured = await ensureWorkspace();

  return NextResponse.json({
    workspaceId: ensured.workspace.id,
    created: ensured.created,
  });
}
