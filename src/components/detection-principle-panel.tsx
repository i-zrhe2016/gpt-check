"use client";

import { useEffect, useState } from "react";

const FLOW_STEPS = [
  {
    id: "sample",
    label: "发起检测",
    title: "先问一组固定问题",
    description: "系统会连续发出多条中文问题，覆盖理解、执行和表达场景，不会只看某一条回复的发挥。",
    systemAction: "批量采样 50 到 100 条回答，先把样本收齐。",
    userView: "你看到的是“正在检测”，而不是一条回答就直接下结论。",
    result: "得到足够样本后，才能进入下一步判断。",
  },
  {
    id: "extract",
    label: "提取特征",
    title: "把回答变成可比较的信号",
    description: "每条回答都会被拆成更稳定的特征，比如表达习惯、遵循程度、拒答方式和结构一致性。",
    systemAction: "提取一组行为指纹，降低措辞波动带来的误差。",
    userView: "你不需要手动逐条查看，系统会先整理成统一信号。",
    result: "原始回答会被转成一组更容易复核的特征。",
  },
  {
    id: "compare",
    label: "对照基线",
    title: "和参考模型做交叉比对",
    description: "系统会把这些特征和已知模型基线进行比较，看它更像目标模型，还是更像更弱的替代模型。",
    systemAction: "同时计算多组相似度，避免只靠单一指标判断。",
    userView: "你最终看到的是对照结果，而不是一堆难懂的中间参数。",
    result: "如果更弱基线持续更接近，就会被标记为风险信号。",
  },
  {
    id: "result",
    label: "给出判断",
    title: "输出是否疑似降配",
    description: "最后一步会综合样本稳定性、相似度走势和异常项，给出更容易理解的检测结论。",
    systemAction: "合并证据并生成结果说明。",
    userView: "你拿到的是“是否疑似降配”以及为什么会这么判断。",
    result: "结论不是猜测，而是由前面几步的证据串起来的。",
  },
] as const;

export function DetectionPrinciplePanel() {
  const [activeStep, setActiveStep] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

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
      setActiveStep((current) => (current + 1) % FLOW_STEPS.length);
    }, 2800);

    return () => {
      window.clearInterval(timer);
    };
  }, [reducedMotion]);

  const currentStep = FLOW_STEPS[activeStep];

  return (
    <div className="principleFlow">
      <div className="flowBoard">
        <div className="flowIntro">
          <div>
            <p className="flowKicker">4 步看懂检测</p>
            <p>页面会自动演示一次检测是怎么完成的，你也可以点任意一步查看当前说明。</p>
          </div>
          <span className={`flowStatus${reducedMotion ? " is-paused" : ""}`}>
            {reducedMotion ? "自动切换已关闭" : "自动演示中"}
          </span>
        </div>

        <div className="flowTrack" role="tablist" aria-label="模型检测流程">
          {FLOW_STEPS.map((step, index) => {
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
              当前步骤 {activeStep + 1} / {FLOW_STEPS.length}
            </span>
            <h3>{currentStep.title}</h3>
            <p>{currentStep.description}</p>

            <div className="flowOutcome">
              <span>这一步会产出什么</span>
              <strong>{currentStep.result}</strong>
            </div>
          </article>

          <div className="flowFacts">
            <article className="flowFact">
              <span>系统在做什么</span>
              <strong>{currentStep.systemAction}</strong>
            </article>
            <article className="flowFact">
              <span>用户会看到什么</span>
              <strong>{currentStep.userView}</strong>
            </article>
            <article className="flowFact">
              <span>为什么要这一步</span>
              <strong>把过程拆开展示，用户更容易理解结果不是“拍脑袋”得出的。</strong>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
