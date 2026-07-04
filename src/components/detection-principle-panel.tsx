"use client";

import { useEffect, useState } from "react";

import type { AppLocale } from "@/lib/locale";

const FLOW_STEPS = {
  "zh-CN": [
    {
      id: "sample",
      label: "发起检测",
      title: "重复发送固定中文提示词",
      description: "系统会多次请求目标模型，只要求它返回 1 到 355 之间的随机数字，确保每次采样都使用同一探针。",
      systemAction: "并发发起 50 到 100 次请求，收集原始返回结果。",
      userView: "你会先看到进度更新，直到样本数量足够进入下一步。",
      result: "得到一批可用于统计的原始响应样本。",
    },
    {
      id: "extract",
      label: "提取数字",
      title: "把回答清洗成有效样本",
      description: "系统会从每条返回中提取有效数字，过滤超出范围或格式不合法的结果，并同时统计失败次数。",
      systemAction: "保留 1 到 355 之间的有效数字，剔除无效响应。",
      userView: "你会看到有效样本数、已处理请求数和失败数持续变化。",
      result: "得到一组干净的数字样本，用于后续分布分析。",
    },
    {
      id: "compare",
      label: "计算分布",
      title: "生成当前模型的指纹分布",
      description: "样本会被汇总成分桶分布和基础统计指标，例如众数、均值和余弦相似度所需的数据。",
      systemAction: "计算分布、统计值，并与本地保存的基线模型做相似度比较。",
      userView: "结果页会逐步补齐排名、样本统计和分布图。",
      result: "得到当前接口与各个基线模型之间的相似度分数。",
    },
    {
      id: "result",
      label: "输出结果",
      title: "给出最接近的基线判断",
      description: "系统会选出最接近的基线模型，并展示 Top 3 匹配结果，帮助判断接口是否存在掺水、降配或错配。",
      systemAction: "生成摘要、排名和分布对比图，写入最终报告。",
      userView: "你拿到的是可复核的检测报告，而不是单条回复的主观判断。",
      result: "形成一份可分享、可回看的检测结果。",
    },
  ],
  en: [
    {
      id: "sample",
      label: "Start run",
      title: "Replay one fixed Chinese probe",
      description: "The system repeatedly asks the target model to return only a random number from 1 to 355, so every sample uses the same prompt.",
      systemAction: "Send 50 to 100 requests, with limited concurrency, and collect raw responses.",
      userView: "You first see progress updates while the sample set is still being collected.",
      result: "A batch of raw responses is collected for statistical analysis.",
    },
    {
      id: "extract",
      label: "Extract values",
      title: "Clean responses into valid samples",
      description: "Each response is parsed for a valid number. Out-of-range or malformed outputs are discarded, and request failures are counted separately.",
      systemAction: "Keep only integers between 1 and 355 and discard invalid responses.",
      userView: "Valid sample count, processed requests, and failures update as the run proceeds.",
      result: "A clean numeric sample set is prepared for distribution analysis.",
    },
    {
      id: "compare",
      label: "Build distribution",
      title: "Generate the model fingerprint",
      description: "The sample set is converted into bucketed distributions and basic statistics, which are then compared with locally stored baseline models.",
      systemAction: "Compute distributions, statistics, and similarity scores against baseline fingerprints.",
      userView: "The report gradually fills in ranking cards, sample stats, and a comparison chart.",
      result: "Similarity scores are produced for the current endpoint against each baseline model.",
    },
    {
      id: "result",
      label: "Deliver report",
      title: "Show the closest baseline match",
      description: "The system highlights the closest baseline and the Top 3 matches so you can judge whether the endpoint looks diluted, downgraded, or mismatched.",
      systemAction: "Write the final summary, ranking, and distribution comparison chart.",
      userView: "You get a report that can be reviewed and shared, rather than a judgment based on one reply.",
      result: "A shareable, reviewable detection report is produced.",
    },
  ],
} as const;

const PANEL_COPY = {
  "zh-CN": {
    kicker: "4 步看懂检测",
    intro: "页面会自动演示一次检测是怎么完成的，你也可以点任意一步查看当前说明。",
    autoPlaying: "自动演示中",
    autoPaused: "自动切换已关闭",
    ariaLabel: "模型检测流程",
    currentStep: "当前步骤",
    outcome: "这一步会产出什么",
    systemAction: "系统在做什么",
    userView: "用户会看到什么",
    why: "为什么要这一步",
    whyDetail: "把请求、清洗、比对和结论拆开展示，用户更容易理解结果不是拍脑袋得出的。",
  },
  en: {
    kicker: "Understand the check in 4 steps",
    intro: "The page auto-plays a full run. You can also click any step to inspect that part of the process.",
    autoPlaying: "Auto demo running",
    autoPaused: "Auto-switching paused",
    ariaLabel: "Model detection flow",
    currentStep: "Current step",
    outcome: "What this step produces",
    systemAction: "What the system does",
    userView: "What you see",
    why: "Why this step matters",
    whyDetail: "Breaking the run into request, cleanup, comparison, and conclusion makes it clear the result is evidence-based.",
  },
} as const;

type DetectionPrinciplePanelProps = {
  locale?: AppLocale;
};

export function DetectionPrinciplePanel({ locale = "zh-CN" }: DetectionPrinciplePanelProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const steps = FLOW_STEPS[locale];
  const copy = PANEL_COPY[locale];

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => {
      setReducedMotion(mediaQuery.matches);
    };

    syncPreference();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncPreference);

      return () => {
        mediaQuery.removeEventListener("change", syncPreference);
      };
    }

    mediaQuery.addListener(syncPreference);

    return () => {
      mediaQuery.removeListener(syncPreference);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length);
    }, 2800);

    return () => {
      window.clearInterval(timer);
    };
  }, [reducedMotion, steps.length]);

  const currentStep = steps[activeStep];

  return (
    <div className="principleFlow">
      <div className="flowBoard">
        <div className="flowIntro">
          <div>
            <p className="flowKicker">{copy.kicker}</p>
            <p>{copy.intro}</p>
          </div>
          <span className={`flowStatus${reducedMotion ? " is-paused" : ""}`}>
            {reducedMotion ? copy.autoPaused : copy.autoPlaying}
          </span>
        </div>

        <div className="flowTrack" role="tablist" aria-label={copy.ariaLabel}>
          {steps.map((step, index) => {
            const isActive = index === activeStep;

            return (
              <button
                key={step.id}
                type="button"
                className={`flowStep${isActive ? " is-active" : ""}`}
                role="tab"
                id={`flow-tab-${step.id}`}
                aria-selected={isActive}
                aria-controls={`flow-panel-${step.id}`}
                onClick={() => setActiveStep(index)}
              >
                <span className="flowStepBadge">{index + 1}</span>
                <span className="flowStepCopy">
                  <strong>{step.label}</strong>
                  <span>{step.title}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="flowDetail" role="tabpanel" id={`flow-panel-${currentStep.id}`} aria-labelledby={`flow-tab-${currentStep.id}`}>
          <article className="flowDetailMain">
            <span className="flowChip">
              {copy.currentStep} {activeStep + 1} / {steps.length}
            </span>
            <h3>{currentStep.title}</h3>
            <p>{currentStep.description}</p>

            <div className="flowOutcome">
              <span>{copy.outcome}</span>
              <strong>{currentStep.result}</strong>
            </div>
          </article>

          <div className="flowFacts">
            <article className="flowFact">
              <span>{copy.systemAction}</span>
              <strong>{currentStep.systemAction}</strong>
            </article>
            <article className="flowFact">
              <span>{copy.userView}</span>
              <strong>{currentStep.userView}</strong>
            </article>
            <article className="flowFact">
              <span>{copy.why}</span>
              <strong>{copy.whyDetail}</strong>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
