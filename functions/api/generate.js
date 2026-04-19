export async function onRequestPost(context) {
  function toText(value, fallback = "") {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed || fallback;
    }
    return fallback;
  }

  function limitText(value, maxLen) {
    const text = toText(value);
    return text.length > maxLen ? text.slice(0, maxLen) : text;
  }

  function pickStringArray(value, fallback = []) {
    if (!Array.isArray(value)) return fallback;
    const cleaned = value.map((item) => toText(item)).filter(Boolean);
    return cleaned.length ? cleaned : fallback;
  }

  function fallbackReport(audience = "") {
    return {
      assetSummary: "你具备可转化为自媒体表达的内容资产，适合从真实经历、明确主题或稳定兴趣切入。",
      assetTags: ["真实表达", "可持续主题", "冷启动友好"],
      differentiation: {
        coreAngle: "结合过往真实经历，用场景化细节打动人，而非空洞说教。",
        whyYou: "你的具体踩坑与成长路径具有唯一性，别人无法完全复刻。",
        avoidCommonPath: "切忌做百科全书式的泛干货，避免盲目追逐无关热点。"
      },
      trafficPotential: {
        highResonance: "通过情感共鸣或相同困境引发群体认同，获得高互动。",
        highSaveValue: "提供经过验证的具体方法论或避坑指南，获得高收藏。",
        highDiscussionPotential: "针对行业常见误区提出反直觉的亲身感悟，引发讨论。"
      },
      opportunities: [
        {
          name: "真实经历复盘",
          position: "最适合你",
          reason: "从最具体、最真实的经历切入，更容易建立信任感和人物记忆点。",
          targetAudience: audience || "与你经历相关的潜在读者",
          contentHook: "用真实的踩坑和反转，吸引有同样痛点的人",
          risk: "如果写得太流水账，内容吸引力会下降。"
        },
        {
          name: "轻干货经验分享",
          position: "最容易冷启动",
          reason: "围绕已有经验、技能或阶段性收获快速输出，更适合起步阶段稳定更新。",
          targetAudience: audience || "希望快速获得可用方法的人群",
          contentHook: "直接给出1-2-3步的清晰结构，降低理解门槛",
          risk: "如果信息密度不足，容易显得普通。"
        },
        {
          name: "主题化长期栏目",
          position: "最有长期延展",
          reason: "围绕一个稳定主题持续输出，更容易形成内容识别度和长期积累。",
          targetAudience: audience || "对长期陪伴式内容有兴趣的人群",
          contentHook: "塑造长期观察者的身份，提供连载式的价值",
          risk: "需要持续选题和长期表达耐心。"
        }
      ],
      firstPostBlueprint: {
        title: "我用血泪经验换来的：关于XX的3个真相",
        hook: "曾经我也以为XX，直到我遇到了XX...",
        structure: [
          "痛点共鸣：描述大家常遇到的一个核心问题",
          "真实经历：我是怎么踩坑的，付出了什么代价",
          "认知反转：我发现了什么不同的切入点",
          "具体方法：1-2-3步我是怎么做到的"
        ],
        format: "图文笔记",
        cta: "你现在在哪个阶段？在评论区聊聊你的困惑，我来帮你支招。"
      },
      firstWeekPlan: [
        {
          titleIdea: "先讲一个最能代表你的真实经历或阶段变化",
          angle: "从一个具体场景切入，让别人先理解你是谁。",
          format: "图文"
        },
        {
          titleIdea: "分享一个你最有发言权的经验或方法",
          angle: "把自己的经历提炼成别人能收藏和复用的具体收获。",
          format: "清单"
        },
        {
          titleIdea: "做一期你想长期更新的主题试水",
          angle: "用一条内容测试大家对你核心方向的反馈。",
          format: "短视频"
        }
      ],
      riskAlerts: [
        "不要一开始覆盖太多主题",
        "避免只有感受没有细节",
        "先找到能持续更新的核心方向"
      ]
    };
  }

  function sanitizeReport(raw, audience = "") {
    const base = fallbackReport(audience);
    if (!raw || typeof raw !== "object") return base;

    const positions = ["最适合你", "最容易冷启动", "最有长期延展"];

    const opportunities = Array.isArray(raw.opportunities)
      ? raw.opportunities.slice(0, 3).map((item, index) => {
          const current = item && typeof item === "object" ? item : {};
          return {
            name: toText(current.name, base.opportunities[index].name),
            position: toText(current.position, positions[index]),
            reason: toText(current.reason, base.opportunities[index].reason),
            targetAudience: toText(current.targetAudience, base.opportunities[index].targetAudience),
            contentHook: toText(current.contentHook, base.opportunities[index].contentHook),
            risk: toText(current.risk, base.opportunities[index].risk),
          };
        })
      : [];

    while (opportunities.length < 3) {
      opportunities.push(base.opportunities[opportunities.length]);
    }

    const firstWeekPlan = Array.isArray(raw.firstWeekPlan)
      ? raw.firstWeekPlan.slice(0, 3).map((item, index) => {
          const current = item && typeof item === "object" ? item : {};
          return {
            titleIdea: toText(current.titleIdea, base.firstWeekPlan[index].titleIdea),
            angle: toText(current.angle, base.firstWeekPlan[index].angle),
            format: toText(current.format, base.firstWeekPlan[index].format),
          };
        })
      : [];

    while (firstWeekPlan.length < 3) {
      firstWeekPlan.push(base.firstWeekPlan[firstWeekPlan.length]);
    }

    return {
      assetSummary: limitText(raw.assetSummary || base.assetSummary, 100),
      assetTags: pickStringArray(raw.assetTags, base.assetTags).slice(0, 6),
      differentiation: {
        coreAngle: toText(raw.differentiation?.coreAngle, base.differentiation.coreAngle),
        whyYou: toText(raw.differentiation?.whyYou, base.differentiation.whyYou),
        avoidCommonPath: toText(raw.differentiation?.avoidCommonPath, base.differentiation.avoidCommonPath),
      },
      trafficPotential: {
        highResonance: toText(raw.trafficPotential?.highResonance, base.trafficPotential.highResonance),
        highSaveValue: toText(raw.trafficPotential?.highSaveValue, base.trafficPotential.highSaveValue),
        highDiscussionPotential: toText(raw.trafficPotential?.highDiscussionPotential, base.trafficPotential.highDiscussionPotential),
      },
      opportunities,
      firstPostBlueprint: {
        title: toText(raw.firstPostBlueprint?.title, base.firstPostBlueprint.title),
        hook: toText(raw.firstPostBlueprint?.hook, base.firstPostBlueprint.hook),
        structure: pickStringArray(raw.firstPostBlueprint?.structure, base.firstPostBlueprint.structure),
        format: toText(raw.firstPostBlueprint?.format, base.firstPostBlueprint.format),
        cta: toText(raw.firstPostBlueprint?.cta, base.firstPostBlueprint.cta),
      },
      firstWeekPlan,
      riskAlerts: pickStringArray(raw.riskAlerts, base.riskAlerts).slice(0, 5),
    };
  }

  try {
    const { request, env } = context;
    const body = await request.json();

    const {
      background = "",
      topics = "",
      audience = "",
      stylePreference = "",
      frequency = "",
    } = body || {};

    if (!background || !topics || !audience) {
      return Response.json({ error: "缺少必要字段" }, { status: 400 });
    }

    const prompt = `
你是一个“自媒体冷启动内容策略助手”，不是职业规划师，也不是泛泛而谈的聊天助手。
你的任务是帮助用户找到：
1. 适合自己的自媒体内容定位
2. 更有差异化的内容切口与传播优势
3. 第一周可以直接发布的内容动作，以及第一篇完整的高转化结构图
4. 需要规避的同质化路线和风险

请根据用户输入，输出严格 JSON，不要输出 markdown，不要输出解释，不要输出代码块。
所有字段必须完整生成，不能省略。

用户信息：
- 经历/优势：${background}
- 想表达的主题：${topics}
- 想吸引的人群：${audience}
- 表达方式偏好：${stylePreference}
- 每周更新频率：${frequency}

请特别遵守以下规则：
1. opportunities 必须是“内容方向/内容栏目/内容赛道”，不能是职业岗位名称（千万不要输出“产品经理”“讲师”“运营”等）。
2. 内容方向要贴近创作语言（如“真实经历复盘”“行业趋势拆解”“生活方式表达”“实操经验分享”）。
3. trafficPotential 不要假装引用实时网络热点或搜索数据，只能基于用户输入的素材判断其潜在传播特质。
4. firstPostBlueprint 必须像可以直接发布的真实干货/故事大纲。

请返回这个 JSON 结构：
{
  "assetSummary": "一句话总结这个人的内容资产，不超过60字",
  "assetTags": ["标签1", "标签2", "标签3", "标签4"],
  "differentiation": {
    "coreAngle": "最核心的差异化切口是什么（如何与泛泛之谈的人区分开）",
    "whyYou": "为什么只能你来做这件事（个人独特经历或视角壁垒）",
    "avoidCommonPath": "坚决避开的同质化路线是什么"
  },
  "trafficPotential": {
    "highResonance": "潜在的情感类传播优势点（如：同样迷茫的人的共鸣）",
    "highSaveValue": "潜在的干货类收藏优势点（如：清晰的123步结构论）",
    "highDiscussionPotential": "观点类讨论爆点（如：打破什么常见的偏见）"
  },
  "opportunities": [
    {
      "name": "内容方向名称",
      "position": "最适合你",
      "reason": "为什么适合过往经历，强调内容表达",
      "targetAudience": "适合吸引的人",
      "contentHook": "这个方向的核心钩子与吸引点是什么",
      "risk": "这个方向的主要风险（比如同质化、表达过泛等）"
    },
    {
      "name": "内容方向名称",
      "position": "最容易冷启动",
      "reason": "...",
      "targetAudience": "...",
      "contentHook": "...",
      "risk": "..."
    },
    {
      "name": "内容方向名称",
      "position": "最有长期延展",
      "reason": "...",
      "targetAudience": "...",
      "contentHook": "...",
      "risk": "..."
    }
  ],
  "firstPostBlueprint": {
    "title": "直接写出这篇内容的可看性强的标题",
    "hook": "正文开头的黄金三秒钩子话术",
    "structure": [
      "1. 内容结构第1步的具体描述",
      "2. 内容结构第2步的具体描述",
      "3. 内容结构第3步的具体描述",
      "4. 内容结构第4步的具体描述"
    ],
    "format": "建议的形式（如图文清单/短视频对口型/Vlog等）",
    "cta": "结尾评论区互动引导的话术设计"
  },
  "firstWeekPlan": [
    {
      "titleIdea": "第一条内容建议标题",
      "angle": "具体切入角度",
      "format": "推荐形式"
    },
    {
      "titleIdea": "第二条内容建议标题",
      "angle": "具体切入角度",
      "format": "推荐形式"
    },
    {
      "titleIdea": "第三条内容建议标题",
      "angle": "具体切入角度",
      "format": "推荐形式"
    }
  ],
  "riskAlerts": ["具体的风险提醒1", "具体的风险提醒2", "具体的风险提醒3"]
}
`;

    const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      prompt,
      max_tokens: 1500,
    });

    let text = "";

    if (typeof response === "string") {
      text = response;
    } else if (response?.response) {
      text = response.response;
    } else if (response?.result?.response) {
      text = response.result.response;
    } else {
      text = JSON.stringify(response);
    }

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const matched = cleaned.match(/\{[\s\S]*\}/);
      if (matched) {
        try {
          parsed = JSON.parse(matched[0]);
        } catch {
          parsed = fallbackReport(audience);
        }
      } else {
        parsed = fallbackReport(audience);
      }
    }

    return Response.json(sanitizeReport(parsed, audience), { status: 200 });
  } catch (error) {
    return Response.json(
      { error: error.message || "服务异常" },
      { status: 500 }
    );
  }
}
