import { RunStatus } from "@prisma/client";

import { listActiveBaselines } from "./baselines";
import { last4 } from "./crypto";
import {
  calculateDistribution,
  calculateStats,
  createComparisonChart,
  extractNumber,
  matchBaselines,
} from "./fingerprint";
import { prisma } from "./prisma";
import { summarizeRun } from "./report";
import { assertSafeBaseUrl } from "./url-safety";

const PROMPT =
  "请从1到355之间随机选择一个数字，只输出这个数字，不要有任何其他内容。";

type RunInput = {
  runId: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  sampleCount: number;
  concurrency: number;
};

async function callOpenAiCompatible({
  targetUrl,
  apiKey,
  model,
}: {
  targetUrl: string;
  apiKey: string;
  model: string;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  const response = await fetch(targetUrl, {
    method: "POST",
    redirect: "error",
    signal: controller.signal,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: PROMPT }],
      temperature: 1,
      max_tokens: 10,
    }),
  });
  clearTimeout(timeout);

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`上游接口返回错误（${response.status}）：${errorBody.slice(0, 300)}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("上游响应中没有可用的消息内容。");
  }

  return content;
}

export async function createPendingRun(input: Omit<RunInput, "runId"> & { workspaceId: string; requestIpHash: string | null }) {
  const run = await prisma.testRun.create({
    data: {
      workspaceId: input.workspaceId,
      requestIpHash: input.requestIpHash,
      baseUrl: input.baseUrl,
      model: input.model,
      apiKeyLast4: last4(input.apiKey),
      sampleCount: input.sampleCount,
      concurrency: input.concurrency,
      processedCount: 0,
      errorCount: 0,
      validResults: [],
      status: RunStatus.PENDING,
    },
  });

  const overflow = await prisma.testRun.findMany({
    where: { workspaceId: input.workspaceId },
    orderBy: { createdAt: "desc" },
    skip: 100,
    select: { id: true },
  });

  if (overflow.length > 0) {
    await prisma.testRun.deleteMany({
      where: {
        id: {
          in: overflow.map((item) => item.id),
        },
      },
    });
  }

  return run;
}

export async function executeRun(input: RunInput) {
  await prisma.testRun.update({
    where: { id: input.runId },
    data: {
      status: RunStatus.RUNNING,
      errorSummary: null,
    },
  });

  try {
    const safeBaseUrl = await assertSafeBaseUrl(input.baseUrl);
    const targetBase = safeBaseUrl.toString().endsWith("/") ? safeBaseUrl.toString() : `${safeBaseUrl.toString()}/`;
    const targetUrl = new URL("chat/completions", targetBase).toString();
    const results: number[] = [];
    let completed = 0;
    let errorCount = 0;
    let nextIndex = 0;
    const workerCount = Math.min(input.concurrency, input.sampleCount);

    const worker = async () => {
      while (true) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        if (currentIndex >= input.sampleCount) {
          break;
        }

        try {
          const raw = await callOpenAiCompatible({
            targetUrl,
            apiKey: input.apiKey,
            model: input.model,
          });
          const parsed = extractNumber(raw);
          if (parsed != null) {
            results.push(parsed);
          } else {
            errorCount += 1;
          }
        } catch {
          errorCount += 1;
        } finally {
          completed += 1;
          if (completed === input.sampleCount || completed % 5 === 0) {
            await prisma.testRun.update({
              where: { id: input.runId },
              data: {
                validResults: [...results],
                processedCount: completed,
                errorCount,
                errorSummary: errorCount > 0 ? `已有 ${errorCount} 次请求失败或返回了无效结果。` : null,
              },
            });
          }
        }
      }
    };

    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    if (results.length < 40) {
      await prisma.testRun.update({
        where: { id: input.runId },
        data: {
          validResults: results,
          processedCount: completed,
          errorCount,
          status: RunStatus.FAILED,
          errorSummary: `仅收集到 ${results.length} 个有效样本，至少需要 40 个才能完成检测。`,
        },
      });
      return;
    }

    const baselines = await listActiveBaselines();
    const distribution = calculateDistribution(results);
    const stats = calculateStats(results);
    const matches = matchBaselines(distribution, stats, baselines);
    const topMatches = matches.slice(0, 3);
    const winner = topMatches[0];
    const winnerBaseline = winner ? baselines.find((item) => item.id === winner.baselineId) : null;
    const chart =
      winner && winnerBaseline
        ? createComparisonChart(distribution, winnerBaseline.distribution, input.model, winner.displayName)
        : null;
    const summary = summarizeRun({
      requestedModel: input.model,
      sampleCount: input.sampleCount,
      validSampleCount: results.length,
      baselineModels: baselines.map((item) => item.model),
      topMatches,
    });

    await prisma.testRun.update({
      where: { id: input.runId },
      data: {
        validResults: results,
        processedCount: completed,
        errorCount,
        distribution,
        stats,
        matches: {
          topMatches,
          chart,
          summary,
        },
        status: RunStatus.COMPLETED,
        errorSummary: errorCount > 0 ? `共有 ${errorCount} 次请求失败或返回了无效结果。` : null,
      },
    });
  } catch (error) {
    await prisma.testRun.update({
      where: { id: input.runId },
      data: {
        status: RunStatus.FAILED,
        errorSummary: error instanceof Error ? error.message : "检测过程中出现未知错误。",
      },
    });
  }
}
