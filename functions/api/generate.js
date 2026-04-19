export async function onRequestPost(context) {
  function toText(value, fallback = "") {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed || fallback;
    }
    return fallback;
  }

  function pickStringArray(value, fallback = []) {
    if (!Array.isArray(value)) return fallback;
    const cleaned = value.map((item) => toText(item)).filter(Boolean);
    return cleaned.length ? cleaned : fallback;
  }

  function sanitizeReport(raw) {
    if (!raw || typeof raw !== "object") return null;

    const positions = ["最适合你", "最容易冷启动", "最有长期延展"];

    const opportunities = Array.isArray(raw.opportunities)
      ? raw.opportunities.slice(0, 3).map((item, index) => {
          const current = item && typeof item === "object" ? item : {};
          return {
            name: toText(current.name),
            position: toText(current.position, positions[index]),
            reason: toText(current.reason),
            targetAudience: toText(current.targetAudience),
            contentHook: toText(current.contentHook),
            starterIdea: toText(current.starterIdea),
            bestFormat: toText(current.bestFormat),
            risk: toText(current.risk),
          };
        }).filter((item) => item.name || item.starterIdea)
      : [];

    const firstWeekPlan = Array.isArray(raw.firstWeekPlan)
      ? raw.firstWeekPlan.slice(0, 3).map((item, index) => {
          const current = item && typeof item === "object" ? item : {};
          return {
            titleIdea: toText(current.titleIdea),
            angle: toText(current.angle),
            format: toText(current.format),
          };
        }).filter((item) => item.titleIdea)
      : [];

    return {
      assetSummary: toText(raw.assetSummary),
      assetTags: pickStringArray(raw.assetTags, []).slice(0, 8),
      differentiation: {
        coreAngle: toText(raw.differentiation?.coreAngle),
        whyYou: toText(raw.differentiation?.whyYou),
        avoidCommonPath: toText(raw.differentiation?.avoidCommonPath),
      },
      trafficPotential: {
        highResonance: toText(raw.trafficPotential?.highResonance),
        highSaveValue: toText(raw.trafficPotential?.highSaveValue),
        highDiscussionPotential: toText(raw.trafficPotential?.highDiscussionPotential),
      },
      opportunities,
      firstPostBlueprint: {
        title: toText(raw.firstPostBlueprint?.title),
        postType: toText(raw.firstPostBlueprint?.postType),
        publishText: toText(raw.firstPostBlueprint?.publishText),
        publishContent: toText(raw.firstPostBlueprint?.publishContent),
        extensionPlan: pickStringArray(raw.firstPostBlueprint?.extensionPlan, []).slice(0, 5),
      },
      firstWeekPlan,
      riskAlerts: pickStringArray(raw.riskAlerts, []).slice(0, 8),
    };
  }

  function tryParseJsonFromText(text) {
    if (!text) return null;

    const cleaned = String(text)
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      const matched = cleaned.match(/\{[\s\S]*\}/);
      if (!matched) return null;
      try {
        return JSON.parse(matched[0]);
      } catch {
        return null;
      }
    }
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
5. firstPostBlueprint 必须是“直接可发布成品”，不要写框架说明。
6. firstPostBlueprint 只输出一个形式：图文 或 视频（二选一），并给完整可发内容。
7. firstPostBlueprint 必须包含 postType、publishText、publishContent、extensionPlan。
8. opportunities 要有创意和流量突破感，不要常规化栏目名称。
9. 每个 opportunities 还要提供 starterIdea（这周直接可发的一条内容）和 bestFormat（图文或视频）。
10. 所有内容都要具体，避免空泛鼓励和模板化描述。
11. 必须是合法 JSON。
12. 标题和正文要尽量贴近用户输入，不要像通用模板。

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
      "starterIdea": "这周直接可发的一条内容题目",
      "bestFormat": "图文或视频",
      "risk": "这个方向的主要风险"
    },
    {
      "name": "内容方向名称",
      "position": "最容易冷启动",
      "reason": "为什么更容易起步",
      "targetAudience": "适合吸引的人",
      "contentHook": "这个方向的核心钩子与吸引点",
      "starterIdea": "这周直接可发的一条内容题目",
      "bestFormat": "图文或视频",
      "risk": "这个方向的主要风险"
    },
    {
      "name": "内容方向名称",
      "position": "最有长期延展",
      "reason": "为什么适合长期做",
      "targetAudience": "适合吸引的人",
      "contentHook": "这个方向的核心钩子与吸引点",
      "starterIdea": "这周直接可发的一条内容题目",
      "bestFormat": "图文或视频",
      "risk": "这个方向的主要风险"
    }
  ],
  "firstPostBlueprint": {
    "title": "直接可以发的第一篇标题",
    "postType": "图文或视频（只能二选一）",
    "publishText": "可以直接当文案发出的短文本",
    "publishContent": "可以直接发布的正文或口播稿，完整连续文本",
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

    let parsed = tryParseJsonFromText(text);

    if (!parsed) {
      const repairPrompt = `
你是 JSON 修复助手。请把下面这段模型输出修复为合法 JSON，且严格遵守指定字段结构。
不要新增说明文字，不要 markdown，只输出 JSON。

必须保留原有内容含义，不能改成模板化文案。

字段结构：
{
  "assetSummary": "",
  "assetTags": [],
  "differentiation": {
    "coreAngle": "",
    "whyYou": "",
    "avoidCommonPath": ""
  },
  "trafficPotential": {
    "highResonance": "",
    "highSaveValue": "",
    "highDiscussionPotential": ""
  },
  "opportunities": [
    {
      "name": "",
      "position": "",
      "reason": "",
      "targetAudience": "",
      "contentHook": "",
      "starterIdea": "",
      "bestFormat": "",
      "risk": ""
    }
  ],
  "firstPostBlueprint": {
    "title": "",
    "postType": "",
    "publishText": "",
    "publishContent": "",
    "extensionPlan": []
  },
  "firstWeekPlan": [
    {
      "titleIdea": "",
      "angle": "",
      "format": ""
    }
  ],
  "riskAlerts": []
}

原始输出：
${text}
`;

      const repairedResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        prompt: repairPrompt,
        max_tokens: 1600,
      });

      let repairedText = "";
      if (typeof repairedResponse === "string") {
        repairedText = repairedResponse;
      } else if (repairedResponse?.response) {
        repairedText = repairedResponse.response;
      } else if (repairedResponse?.result?.response) {
        repairedText = repairedResponse.result.response;
      } else {
        repairedText = JSON.stringify(repairedResponse);
      }

      parsed = tryParseJsonFromText(repairedText);
    }

    const sanitized = sanitizeReport(parsed);
    if (!sanitized) {
      return Response.json(
        {
          error: "模型输出格式不稳定，请重试一次",
          detail: "AI output could not be parsed into required JSON structure"
        },
        { status: 502 }
      );
    }

    return Response.json(sanitized, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: error.message || "服务异常" },
      { status: 500 }
    );
  }
}
