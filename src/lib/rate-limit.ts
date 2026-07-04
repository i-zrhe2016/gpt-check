import { prisma } from "./prisma";

export async function assertRunRateLimit(workspaceId: string, requestIpHash: string | null) {
  const now = Date.now();
  const tenMinutesAgo = new Date(now - 10 * 60 * 1000);
  const hourAgo = new Date(now - 60 * 60 * 1000);

  const [workspaceRecentCount, ipRecentCount] = await Promise.all([
    prisma.testRun.count({
      where: {
        workspaceId,
        createdAt: {
          gte: tenMinutesAgo,
        },
      },
    }),
    requestIpHash
      ? prisma.testRun.count({
          where: {
            requestIpHash,
            createdAt: {
              gte: hourAgo,
            },
          },
        })
      : Promise.resolve(0),
  ]);

  if (workspaceRecentCount >= 5) {
    throw new Error("This device has hit the free limit: 5 runs per 10 minutes.");
  }
  if (ipRecentCount >= 10) {
    throw new Error("This IP has hit the free limit: 10 runs per hour.");
  }
}
