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

  function hasValidReportContent(report) {
    if (!report) return false;

    const hasSummary = Boolean(report.assetSummary);
    const hasOpportunities = Array.isArray(report.opportunities) && report.opportunities.length > 0;
    const hasBlueprint = Boolean(
      report.firstPostBlueprint?.title &&
      report.firstPostBlueprint?.postType &&
      report.firstPostBlueprint?.publishText &&
      report.firstPostBlueprint?.publishContent
    );
    const hasWeekPlan = Array.isArray(report.firstWeekPlan) && report.firstWeekPlan.length > 0;
    const hasRisk = Array.isArray(report.riskAlerts) && report.riskAlerts.length > 0;

    return hasSummary && hasOpportunities && hasBlueprint && hasWeekPlan && hasRisk;
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
你是一个“内容冷启动策略顾问”，不是泛化顾问，也不是只会给正确废话的聊天助手。
你的任务不是写一份工整但呆板的报告，而是给用户一套更像“懂自媒体、懂冷启动、懂流量判断”的内容策略。

你必须帮助用户得到以下内容：
1. 他最值得先做的内容方向是什么
2. 为什么这个方向更容易起量
3. 这个方向的差异化切口是什么
4. 第一篇内容应该怎么发，才更像真的有人会点、会看、会评论
5. 前一周该怎么试内容
6. 需要避开的同质化风险是什么

请根据用户输入，输出严格 JSON，不要输出 markdown，不要输出代码块。
字段必须完整，不能省略，值尽量具体、可执行、像真正能发出去的内容策略。
语言风格要求：可以更聪明、有判断、有一点幽默感，但不要油腻，不要浮夸，不要为了有趣而脱离用户输入。

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
5. 你必须解释为什么这个方向更容易起量，至少从这些角度分析：共鸣潜力、收藏潜力、评论潜力、人设记忆点、同质化风险。
6. 不要平均用力，不要把所有方向都写得差不多好；要有判断力和取舍感。
7. firstPostBlueprint 必须是“直接可发布成品”，不要写框架说明。
8. firstPostBlueprint 只输出一个形式：图文 或 视频（二选一），并给完整可发内容。
9. firstPostBlueprint 必须包含 postType、publishText、publishContent、extensionPlan。
10. opportunities 要有创意和传播感，不要只是安全但无聊的栏目名称。
11. 每个 opportunities 还要提供 starterIdea（这周直接可发的一条内容）和 bestFormat（图文或视频）。
12. 所有内容都要具体，避免空泛鼓励和模板化描述。
13. 标题和正文要尽量贴近用户输入，不要像通用模板。
14. riskAlerts 要像真的在提醒创作者，而不是写套话。
15. 在 riskAlerts 的最后一条里，加入一句简短鼓励，但要自然一点，像“先发第一条，比想100条更重要”这种风格。
16. 必须是合法 JSON。

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
    "highResonance": "潜在的情感类传播优势点，要说明为什么容易让人代入",
    "highSaveValue": "潜在的收藏价值点，要说明什么内容最值得被收藏",
    "highDiscussionPotential": "潜在的讨论引爆点，要说明什么话题更容易让人想留言"
  },
  "opportunities": [
    {
      "name": "内容方向名称",
      "position": "最适合你",
      "reason": "为什么适合这个人，要有判断，不要套话",
      "targetAudience": "适合吸引的人",
      "contentHook": "这个方向的核心钩子与吸引点，要更像会抓眼球的表达",
      "starterIdea": "这周直接可发的一条内容题目，要具体、有意思、像真的会有人点开",
      "bestFormat": "图文或视频",
      "risk": "这个方向的主要风险，要说得具体"
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
    "title": "直接可以发的第一篇标题，要具体、自然、有点巧思，不要标题党过头",
    "postType": "图文或视频（只能二选一）",
    "publishText": "可以直接当文案发出的短文本，要像创作者真的会发，不要像AI摘要",
    "publishContent": "可以直接发布的正文或口播稿，完整连续文本，要有人味、有节奏、有细节",
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
      return Response.json(
        {
          error: "模型未返回可解析结果，请重试",
          detail: "AI output could not be parsed into JSON"
        },
        { status: 502 }
      );
    }

    const sanitized = sanitizeReport(parsed);
    if (!sanitized || !hasValidReportContent(sanitized)) {
      return Response.json(
        {
          error: "模型结果不完整，请重试",
          detail: "AI output missed required report fields"
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
