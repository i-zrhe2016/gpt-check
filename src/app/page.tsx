import type { Metadata } from "next";
import Link from "next/link";

import { DetectionPrinciplePanel } from "@/components/detection-principle-panel";
import { DEFAULT_OPENAI_BASE_URL, DEFAULT_OPENAI_MODEL, normalizeBaseUrl } from "@/lib/openai";
import { resolveAbsoluteUrl, siteDescription, siteName, siteTitle } from "@/lib/site";

const DEFAULT_SAMPLE_COUNT = 50;
const DEFAULT_CONCURRENCY = 3;
const HOME_URL = resolveAbsoluteUrl("/");

export const metadata: Metadata = {
  title: `${siteTitle} | ${siteName}`,
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    type: "website",
    locale: "zh_CN",
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

export default async function Home(props: HomePageProps) {
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
        inLanguage: "zh-CN",
        description: siteDescription,
      },
      {
        "@type": "WebApplication",
        "@id": `${HOME_URL}#application`,
        name: siteTitle,
        url: HOME_URL,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web Browser",
        inLanguage: "zh-CN",
        description: siteDescription,
        featureList: [
          "检测第三方 OpenAI 兼容接口是否存在模型掺水",
          "识别声明模型与实际输出能力是否降配或错配",
          "支持中文检测、OpenAI 官方地址和自定义兼容 Base URL",
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
            <p className="eyebrow">HLWY Model Check</p>
            <h1>模型掺水检测</h1>
            <p className="heroLead">
              输入接口地址、API Key 和模型名，直接发起一次中文模型检测。这个页面的实际用途不是聊天，而是核验第三方 OpenAI
              兼容接口是否把声明的 GPT 模型掺水、降配或错配成更弱模型。
            </p>
          </div>

          <div className="heroBlock introMeta">
            <p>
              支持 OpenAI 官方地址，也支持兼容 OpenAI <code>chat/completions</code> 的自定义接口。
            </p>
            <p>结果页会自动刷新，历史记录保存在当前浏览器，适合做接口交付验收和模型真实性排查。</p>
          </div>

          <div className="heroBlock compactList">
            <article className="compactCard">
              <span>接口</span>
              <strong>自定义 Base URL</strong>
              <p>可填写官方地址或你自己的兼容服务地址。</p>
            </article>
            <article className="compactCard">
              <span>模型</span>
              <strong>自由输入模型名</strong>
              <p>
                默认预填 <code>gpt-5.5</code>，可直接改成你要检测的 OpenAI 模型名。
              </p>
            </article>
          </div>
        </div>

        <div className="formPanel">
          <div className="sectionHeader">
            <div>
              <p className="eyebrow">开始检测</p>
              <h2>提交一次真实检测</h2>
              <p className="muted">用真实 API 返回结果判断模型是否掺水。首页只保留必要输入项，高级参数默认折叠。</p>
            </div>
            <Link className="secondaryButton" href="/runs" prefetch={false}>
              历史记录
            </Link>
          </div>

          <form action="/runs/start" className="form" method="post">
            <label>
              <span>API Base URL</span>
              <input defaultValue={baseUrl} name="baseUrl" placeholder="https://api.openai.com/v1" required type="url" />
            </label>

            <label>
              <span>API Key</span>
              <input autoComplete="off" name="apiKey" placeholder="sk-..." required type="password" />
            </label>

            <label>
              <span>模型名</span>
              <input defaultValue={model} name="model" placeholder="gpt-5.5" required type="text" />
            </label>

            <p className="helperText">
              请填写当前接口实际支持的 OpenAI 模型名，例如 <code>gpt-5.5</code>。
            </p>

            <details className="advancedPanel">
              <summary>高级设置</summary>
              <div className="advancedBody">
                <div className="formRow">
                  <label>
                    <span>采样数</span>
                    <input defaultValue={sampleCount} max={100} min={50} name="sampleCount" required type="number" />
                  </label>
                  <label>
                    <span>并发数</span>
                    <input defaultValue={concurrency} max={5} min={1} name="concurrency" required type="number" />
                  </label>
                </div>
                <p className="fieldMeta">默认值适合首轮检测。需要更快试跑时可降低采样数，接口稳定时可提高并发。</p>
              </div>
            </details>

            <button className="primaryButton" type="submit">
              开始检测
            </button>

            {error ? <p className="errorText">{error}</p> : null}
            {!error ? <p className="fieldMeta">API Key 不会写入页面地址。表单校验失败时只回填可公开的字段。</p> : null}
          </form>
        </div>
      </section>

      <section className="listPanel principleSection">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">检测原理</p>
            <h2>用流程图看懂结果怎么来的</h2>
            <p className="muted">
              这个演示会按“采样、提取特征、对照基线、给出判断”四步自动切换，让用户直接看懂系统为什么会判定疑似降配。
            </p>
          </div>
        </div>

        <DetectionPrinciplePanel />
      </section>

      <section className="listPanel">
        <div className="sectionHeader">
          <div>
            <p className="eyebrow">实际用途</p>
            <h2>这个网站具体用来做什么</h2>
            <p className="muted">核心目标是识别模型是否掺水，而不是做通用聊天入口。</p>
          </div>
        </div>

        <div className="compactList">
          <article className="compactCard">
            <span>验收</span>
            <strong>核验第三方接口交付</strong>
            <p>检测第三方服务声称提供的 GPT 模型，是否真的具备对应能力，而不是被偷偷换成更弱模型。</p>
          </article>
          <article className="compactCard">
            <span>排查</span>
            <strong>识别掺水、降配、错配</strong>
            <p>用于排查中转、代理或聚合平台是否存在模型降级、型号错配，或输出能力明显低于声明型号。</p>
          </article>
          <article className="compactCard">
            <span>适配</span>
            <strong>支持 OpenAI 兼容接口</strong>
            <p>既可以检测 OpenAI 官方地址，也可以检测兼容 <code>chat/completions</code> 的自定义接口。</p>
          </article>
          <article className="compactCard">
            <span>语言</span>
            <strong>中文检测页面</strong>
            <p>面向中文用户提供直接可用的模型检测页面，便于快速判断接口返回能力是否与声明一致。</p>
          </article>
        </div>
      </section>
    </main>
  );
}
