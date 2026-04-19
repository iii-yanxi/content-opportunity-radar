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

  function uniqueStrings(list) {
    return Array.from(new Set(list.filter(Boolean)));
  }

  function buildAudienceHint(audience = "", topics = "") {
    const parts = [toText(audience), toText(topics)].filter(Boolean);
    return parts.join("、") || "同样在寻找方向的人";
  }

  function shortCue(text = "", maxLen = 22) {
    const normalized = toText(text).replace(/\s+/g, "");
    if (!normalized) return "这件事";
    return normalized.length > maxLen ? `${normalized.slice(0, maxLen)}...` : normalized;
  }

  function fallbackReport(input = {}) {
    const audienceHint = buildAudienceHint(input.audience, input.topics);
    const topicHint = toText(input.topics, "内容表达") || "内容表达";
    const backgroundCue = shortCue(input.background);
    return {
      assetSummary: `你可以把 ${topicHint} 和真实经历整理成更有个人辨识度的内容表达。`,
      assetTags: uniqueStrings(["真实表达", "可持续主题", "冷启动友好", topicHint].map((item) => toText(item))).slice(0, 4),
      differentiation: {
        coreAngle: `把 ${topicHint} 讲成有场景、有转折、有结果的真实内容。`,
        whyYou: `你对 ${topicHint} 的理解来自自己的经历和取舍，这种视角别人很难直接复制。`,
        avoidCommonPath: "不要写成泛泛而谈的百科知识，也不要一上来追热点却没有自己视角。"
      },
      trafficPotential: {
        highResonance: `围绕 ${audienceHint} 常见的焦虑、卡点或阶段性迷茫，更容易引发共鸣。`,
        highSaveValue: "把经验整理成清晰步骤、检查清单或避坑指南，更容易被收藏。",
        highDiscussionPotential: "如果你能提出一个和常规认知不同的判断，评论区会更容易出现讨论。"
      },
      opportunities: [
        {
          name: "真实经历复盘",
          position: "最适合你",
          reason: `从你自己的经历切入，最容易建立信任感和个人记忆点。`,
          targetAudience: audienceHint,
          contentHook: "用真实踩坑、反转和结果变化，抓住有同样问题的人。",
          risk: "如果写得太流水账，读者很难快速抓住重点。"
        },
        {
          name: "轻干货经验分享",
          position: "最容易冷启动",
          reason: "你可以把已经验证过的方法直接拆成清晰步骤，起步最快。",
          targetAudience: audienceHint,
          contentHook: "直接给出 1-2-3 的结构、清单或模板，降低理解门槛。",
          risk: "如果信息密度不足，会显得普通、难记。"
        },
        {
          name: "主题化长期栏目",
          position: "最有长期延展",
          reason: "围绕一个稳定主题持续输出，更容易建立内容识别度和长期积累。",
          targetAudience: audienceHint,
          contentHook: "用连载式内容塑造长期观察者或陪伴者的形象。",
          risk: "需要稳定选题和长期表达耐心。"
        }
      ],
      firstPostBlueprint: {
        title: `我在 ${backgroundCue} 里踩了3次坑后，才总结出这套 ${topicHint} 起步方法`,
        coverLine: `${topicHint} 不是你想的那样：我踩坑后总结的3条结论`,
        hook: `如果你也在 ${topicHint} 上反复卡住，这篇可能能帮你少走半年弯路。`,
        openingScript: `先讲一个真实场景：我在做 ${backgroundCue} 时，以为越努力越有效，结果连续翻车。`,
        structure: [
          "先给结论：真正影响结果的不是努力多少，而是路径是否对",
          "再讲我的翻车经历：做错了什么、为什么会错",
          "给出反转洞察：后来我如何调整，哪些动作最关键",
          "最后给可执行模板：新手今天就能照着做的起步步骤"
        ],
        format: "图文清单 / 文字长帖",
        closingScript: "最后我只保留一个行动建议：先用最小成本发出第一条，再根据反馈迭代。",
        cta: `你现在在 ${topicHint} 的哪个阶段？评论区留“卡点”，我按高频问题做下一篇。`,
        trafficSecrets: [
          "开头 2 句先给反差结论，再讲原因，减少读者流失。",
          "每一段都带一个具体场景词，避免抽象表达。",
          "在中段放一个可复制的小模板，提升收藏率。"
        ],
        extensionPlan: [
          "把主帖改写为 30 秒短视频口播稿，保留同一核心结论。",
          "把正文方法论拆成一张清单图，做二次分发。",
          "从评论区挑 1 个高频问题，产出一条追更答疑帖。"
        ]
      },
      firstWeekPlan: [
        {
          titleIdea: "先讲一个最能代表你的真实经历或阶段变化",
          angle: "从一个具体场景切入，让别人先理解你是谁、为什么会关心这个主题。",
          format: "图文"
        },
        {
          titleIdea: "分享一个你最有发言权的经验或方法",
          angle: "把你的经历提炼成别人可以直接复用的步骤、清单或方法。",
          format: "清单"
        },
        {
          titleIdea: "做一期你想长期更新的主题试水",
          angle: "用一条内容测试大家对你核心方向的反馈，再决定是否继续深挖。",
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

  function sanitizeReport(raw, input = {}) {
    const base = fallbackReport(input);
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
        coverLine: toText(raw.firstPostBlueprint?.coverLine, base.firstPostBlueprint.coverLine),
        hook: toText(raw.firstPostBlueprint?.hook, base.firstPostBlueprint.hook),
        openingScript: toText(raw.firstPostBlueprint?.openingScript, base.firstPostBlueprint.openingScript),
        structure: pickStringArray(raw.firstPostBlueprint?.structure, base.firstPostBlueprint.structure),
        format: toText(raw.firstPostBlueprint?.format, base.firstPostBlueprint.format),
        closingScript: toText(raw.firstPostBlueprint?.closingScript, base.firstPostBlueprint.closingScript),
        cta: toText(raw.firstPostBlueprint?.cta, base.firstPostBlueprint.cta),
        trafficSecrets: pickStringArray(raw.firstPostBlueprint?.trafficSecrets, base.firstPostBlueprint.trafficSecrets).slice(0, 4),
        extensionPlan: pickStringArray(raw.firstPostBlueprint?.extensionPlan, base.firstPostBlueprint.extensionPlan).slice(0, 4),
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
你的任务是输出一份可直接用于创作者冷启动的内容策略报告，重点是内容方向而不是职业身份。

你必须帮助用户得到以下内容：
1. 他适合讲什么内容
2. 他与别人不同的切口是什么
3. 哪些内容更容易被看见、收藏和讨论
4. 第一篇内容应该怎么写
5. 前一周该怎么试内容
6. 需要避开的同质化风险

请根据用户输入，输出严格 JSON，不要输出 markdown，不要输出解释，不要输出代码块。
字段必须完整，不能省略，值尽量具体、可执行、像真正能发出去的内容策略。

用户信息：
- 经历/优势：${background}
- 想表达的主题：${topics}
- 想吸引的人群：${audience}
- 表达方式偏好：${stylePreference}
- 每周更新频率：${frequency}

硬性规则：
1. opportunities 必须是“内容方向 / 内容栏目 / 内容赛道”，不能是职业岗位、身份或行业头衔。
2. 不要输出“产品经理”“讲师”“运营”“顾问”等职业名称作为方向。
3. 内容方向要贴近创作语言，例如真实经历复盘、主题化表达、行业观察、生活方式表达、实操经验分享。
4. trafficPotential 只能基于用户输入推断，不要假装引用实时热点或外部数据。
5. firstPostBlueprint 必须像可以直接发布的第一篇帖子方案，包含封面文案、钩子、正文结构、结尾话术、评论区引导。
6. firstPostBlueprint 还要包含“trafficSecrets”和“extensionPlan”，让用户可以把首篇内容扩散成后续内容。
7. 所有内容都要具体，避免空泛鼓励和模板化描述。
8. 必须是合法 JSON。
9. 标题和正文要尽量贴近用户输入，不要像通用模板。

请返回以下结构：
{
  "assetSummary": "一句话总结这个人的内容资产，不超过60字",
  "assetTags": ["标签1", "标签2", "标签3", "标签4"],
  "differentiation": {
    "coreAngle": "最核心的差异化切口是什么",
    "whyYou": "为什么只能你来做这件事",
    "avoidCommonPath": "坚决避开的同质化路线是什么"
  },
  "trafficPotential": {
    "highResonance": "潜在的情感类传播优势点",
    "highSaveValue": "潜在的收藏价值点",
    "highDiscussionPotential": "潜在的讨论引爆点"
  },
  "opportunities": [
    {
      "name": "内容方向名称",
      "position": "最适合你",
      "reason": "为什么适合这个人",
      "targetAudience": "适合吸引的人",
      "contentHook": "这个方向的核心钩子与吸引点",
      "risk": "这个方向的主要风险"
    },
    {
      "name": "内容方向名称",
      "position": "最容易冷启动",
      "reason": "为什么更容易起步",
      "targetAudience": "适合吸引的人",
      "contentHook": "这个方向的核心钩子与吸引点",
      "risk": "这个方向的主要风险"
    },
    {
      "name": "内容方向名称",
      "position": "最有长期延展",
      "reason": "为什么适合长期做",
      "targetAudience": "适合吸引的人",
      "contentHook": "这个方向的核心钩子与吸引点",
      "risk": "这个方向的主要风险"
    }
  ],
  "firstPostBlueprint": {
    "title": "直接可以发的第一篇标题",
    "coverLine": "封面上最抓眼的第一句话",
    "hook": "正文开头的黄金三秒钩子",
    "openingScript": "正文第一段怎么说",
    "structure": ["第一部分", "第二部分", "第三部分", "第四部分"],
    "format": "建议的发布形式",
    "closingScript": "正文结尾怎么收束",
    "cta": "结尾评论区互动引导",
    "trafficSecrets": ["能提升完读/收藏/转发的执行细节1", "执行细节2", "执行细节3"],
    "extensionPlan": ["如何拆成第2条内容", "如何拆成第3条内容", "如何拆成互动答疑内容"]
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
  "riskAlerts": ["具体风险提醒1", "具体风险提醒2", "具体风险提醒3"]
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
      parsed = matched ? (() => {
        try {
          return JSON.parse(matched[0]);
        } catch {
          return fallbackReport({ background, topics, audience, stylePreference, frequency });
        }
      })() : fallbackReport({ background, topics, audience, stylePreference, frequency });
    }

    return Response.json(
      sanitizeReport(parsed, { background, topics, audience, stylePreference, frequency }),
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { error: error.message || "服务异常" },
      { status: 500 }
    );
  }
}
