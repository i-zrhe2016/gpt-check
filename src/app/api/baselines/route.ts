import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { serializeBaseline } from "@/lib/serializers";

export async function GET() {
  const baselines = await prisma.baselineProfile.findMany({
    where: { active: true },
    orderBy: [{ vendor: "asc" }, { displayName: "asc" }],
  });

  return NextResponse.json({
    baselines: baselines.map(serializeBaseline),
  });
}
