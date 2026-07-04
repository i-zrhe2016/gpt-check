import type { Metadata } from "next";
import Link from "next/link";

import { DetectionPrinciplePanel } from "@/components/detection-principle-panel";
import { localizePath } from "@/lib/locale";
import { DEFAULT_OPENAI_BASE_URL, DEFAULT_OPENAI_MODEL, normalizeBaseUrl } from "@/lib/openai";
import { getSiteDescription, getSiteName, getSiteTitle, resolveAbsoluteUrl } from "@/lib/site";

const DEFAULT_SAMPLE_COUNT = 50;
const DEFAULT_CONCURRENCY = 3;
const HOME_URL = resolveAbsoluteUrl("/en");
const siteName = getSiteName("en");
const siteTitle = getSiteTitle("en");
const siteDescription = getSiteDescription("en");

export const metadata: Metadata = {
  title: `${siteTitle} | ${siteName}`,
  description: siteDescription,
  alternates: {
    canonical: "/en",
    languages: {
      "zh-CN": "/",
      en: "/en",
    },
  },
  openGraph: {
    url: "/en",
    type: "website",
    locale: "en_US",
    siteName,
    title: `${siteTitle} | ${siteName}`,
    description: siteDescription,
  },
};

function readSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseNumber(value: string | undefined, fallback: number, min: number, max: number) {
  const next = Number(value);
  if (Number.isInteger(next) && next >= min && next <= max) {
    return next;
  }

  return fallback;
}

function readText(value: string | undefined, fallback: string) {
  const next = value?.trim();
  return next ? next : fallback;
}

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EnglishHomePage(props: HomePageProps) {
  const searchParams = await props.searchParams;
  const error = readSearchValue(searchParams.error);
  const baseUrl = normalizeBaseUrl(readText(readSearchValue(searchParams.baseUrl), DEFAULT_OPENAI_BASE_URL));
  const model = readText(readSearchValue(searchParams.model), DEFAULT_OPENAI_MODEL);
  const sampleCount = parseNumber(readSearchValue(searchParams.sampleCount), DEFAULT_SAMPLE_COUNT, 50, 100);
  const concurrency = parseNumber(readSearchValue(searchParams.concurrency), DEFAULT_CONCURRENCY, 1, 5);
  const homeJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${HOME_URL}#website`,
        name: siteTitle,
        url: HOME_URL,
        inLanguage: "en",
        description: siteDescription,
      },
      {
        "@type": "WebApplication",
        "@id": `${HOME_URL}#application`,
        name: siteTitle,
        url: HOME_URL,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web Browser",
        inLanguage: "en",
        description: siteDescription,
        featureList: [
          "Check whether a third-party OpenAI-compatible endpoint is serving a diluted model",
          "Compare the observed fingerprint against stored baseline models",
          "Support both the official OpenAI base URL and custom OpenAI-compatible endpoints",
        ],
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  };

  return (
    <main className="shell landingShell">
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
        type="application/ld+json"
      />
      <section className="landingGrid">
        <div className="heroPanel">
          <div className="heroBlock">
            <div className="sectionHeader">
              <p className="eyebrow">HLWY Model Check</p>
              <Link className="secondaryButton" href="/" prefetch={false}>
                中文
              </Link>
            </div>
            <h1>Model Dilution Detection</h1>
            <p className="heroLead">
              Enter the endpoint, API key, and model name to run a Chinese-language probe against the target model. This page is not a chat
              interface. It is built to verify whether a third-party OpenAI-compatible endpoint is serving the claimed GPT model or a weaker
              substitute behind it.
            </p>
          </div>

          <div className="heroBlock introMeta">
            <p>
              Works with the official OpenAI endpoint and with custom services that implement OpenAI-compatible <code>chat/completions</code>.
            </p>
            <p>The result page auto-refreshes, and recent history stays in the current browser for delivery checks and authenticity reviews.</p>
          </div>

          <div className="heroBlock compactList">
            <article className="compactCard">
              <span>Endpoint</span>
              <strong>Custom Base URL</strong>
              <p>Use the official URL or your own OpenAI-compatible service endpoint.</p>
            </article>
            <article className="compactCard">
              <span>Model</span>
              <strong>Free-form model name</strong>
              <p>
                Prefilled with <code>gpt-5.5</code>, and you can replace it with the model you need to validate.
              </p>
            </article>
          </div>
        </div>

        <div className="formPanel">
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">Run Check</p>
              <h2>Submit a live inspection</h2>
              <p className="muted">The result is based on real API responses. The homepage keeps only the required inputs, with advanced settings collapsed.</p>
            </div>
            <Link className="secondaryButton" href="/en/runs" prefetch={false}>
              History
            </Link>
          </div>

          <form action={`${localizePath("zh-CN", "/runs/start")}?lang=en`} className="form" method="post">
            <label>
              <span>API Base URL</span>
              <input defaultValue={baseUrl} name="baseUrl" placeholder="https://api.openai.com/v1" required type="url" />
            </label>

            <label>
              <span>API Key</span>
              <input autoComplete="off" name="apiKey" placeholder="sk-..." required type="password" />
            </label>

            <label>
              <span>Model name</span>
              <input defaultValue={model} name="model" placeholder="gpt-5.5" required type="text" />
            </label>

            <p className="helperText">
              Enter the exact OpenAI model name supported by this endpoint, for example <code>gpt-5.5</code>.
            </p>

            <details className="advancedPanel">
              <summary>Advanced settings</summary>
              <div className="advancedBody">
                <div className="formRow">
                  <label>
                    <span>Samples</span>
                    <input defaultValue={sampleCount} max={100} min={50} name="sampleCount" required type="number" />
                  </label>
                  <label>
                    <span>Concurrency</span>
                    <input defaultValue={concurrency} max={5} min={1} name="concurrency" required type="number" />
                  </label>
                </div>
                <p className="fieldMeta">The defaults are suitable for a first pass. Lower samples for a faster smoke test, or raise concurrency when the endpoint is stable.</p>
              </div>
            </details>

            <button className="primaryButton" type="submit">
              Start check
            </button>

            {error ? <p className="errorText">{error}</p> : null}
            {!error ? <p className="fieldMeta">The API key is never written into the page URL. On validation errors, only public fields are preserved.</p> : null}
          </form>
        </div>
      </section>

      <section className="listPanel principleSection">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">How It Works</p>
            <h2>See the result pipeline as a flow</h2>
            <p className="muted">
              This demo cycles through four steps: collect samples, extract valid numbers, build the distribution, and produce the report.
            </p>
          </div>
        </div>

        <DetectionPrinciplePanel locale="en" />
      </section>

      <section className="listPanel">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">Use Cases</p>
            <h2>What this site is for</h2>
            <p className="muted">Its purpose is to verify model authenticity, not to serve as a general chat front end.</p>
          </div>
        </div>

        <div className="compactList">
          <article className="compactCard">
            <span>Acceptance</span>
            <strong>Verify third-party delivery</strong>
            <p>Check whether a service that claims to expose a GPT model actually behaves like that model instead of a weaker replacement.</p>
          </article>
          <article className="compactCard">
            <span>Investigation</span>
            <strong>Spot dilution, downgrade, or mismatch</strong>
            <p>Use it to review gateways, resellers, or aggregators for model downgrades, SKU mismatches, or output quality far below the claimed tier.</p>
          </article>
          <article className="compactCard">
            <span>Compatibility</span>
            <strong>Support OpenAI-compatible endpoints</strong>
            <p>It works with the official OpenAI endpoint and with custom services implementing <code>chat/completions</code>.</p>
          </article>
          <article className="compactCard">
            <span>Language</span>
            <strong>English interface available</strong>
            <p>The UI is now available in English while the underlying probe remains the same, so mixed-language teams can review the same run.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
