import { NextResponse } from "next/server";

import { getLocalePrefix, normalizeLocale } from "@/lib/locale";
import { normalizeBaseUrl } from "@/lib/openai";
import { getClientIpHash } from "@/lib/http";
import { assertRunRateLimit } from "@/lib/rate-limit";
import { formatRunStartError } from "@/lib/run-presenters";
import { createPendingRun, executeRun } from "@/lib/test-runner";
import { assertSafeBaseUrl } from "@/lib/url-safety";
import { createTestRunSchema } from "@/lib/validators";
import { requireWorkspace } from "@/lib/workspace";

function readFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function createRedirectResponse(location: string) {
  return new NextResponse(null, {
    status: 303,
    headers: {
      location,
    },
  });
}

function createHomeRedirectUrl(locale: ReturnType<typeof normalizeLocale>, params: URLSearchParams) {
  const pathname = getLocalePrefix(locale) || "/";
  return params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
}

export async function POST(request: Request) {
  const locale = normalizeLocale(new URL(request.url).searchParams.get("lang"));
  const formData = await request.formData();
  const baseUrl = normalizeBaseUrl(readFormValue(formData, "baseUrl"));
  const apiKey = readFormValue(formData, "apiKey");
  const model = readFormValue(formData, "model");
  const sampleCount = readFormValue(formData, "sampleCount");
  const concurrency = readFormValue(formData, "concurrency");

  const redirectParams = new URLSearchParams();
  if (baseUrl) {
    redirectParams.set("baseUrl", baseUrl);
  }
  if (model) {
    redirectParams.set("model", model);
  }
  if (sampleCount) {
    redirectParams.set("sampleCount", sampleCount);
  }
  if (concurrency) {
    redirectParams.set("concurrency", concurrency);
  }

  const parsed = createTestRunSchema.safeParse({
    baseUrl,
    apiKey,
    model,
    sampleCount,
    concurrency,
  });

  if (!parsed.success) {
    redirectParams.set(
      "error",
      locale === "en"
        ? "Check the endpoint, API key, model name, and advanced settings."
        : "请检查接口地址、API Key、模型名以及高级设置。",
    );
    return createRedirectResponse(createHomeRedirectUrl(locale, redirectParams));
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

    const prefix = getLocalePrefix(locale);
    return createRedirectResponse(`${prefix}/runs/${run.id}`);
  } catch (error) {
    redirectParams.set("error", formatRunStartError(error, locale));
    return createRedirectResponse(createHomeRedirectUrl(locale, redirectParams));
  }
}
