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

  function fallbackPhase(index) {
    if (index < 2) return "验证核心假设";
    if (index < 4) return "收集反馈";
    if (index < 6) return "迭代强化";
    return "沉淀下一步";
  }

  function fallbackFeedbackFocus(index) {
    if (index < 2) return "先看读者是否能一眼看懂你的核心切口";
    if (index < 4) return "观察评论区会不会自然补充自己的经历";
    if (index < 6) return "看哪种开头和结构更容易让人停留";
    return "把前面几天有效的表达收束成可持续模板";
  }

  function fallbackLearningFromPrev(index) {
    if (index === 0) return "先把第一条发出去，验证这条路能不能讲清楚。";
    return "把前一天得到的反馈拿来微调开头、节奏或角度。";
  }

  function normalizeRiskAlerts(rawRiskAlerts) {
    if (rawRiskAlerts && typeof rawRiskAlerts === "object" && !Array.isArray(rawRiskAlerts)) {
      const details = Array.isArray(rawRiskAlerts.details)
        ? rawRiskAlerts.details.slice(0, 4).map((item) => {
            const current = item && typeof item === "object" ? item : {};
            return {
              risk: toText(current.risk),
              mitigation: toText(current.mitigation, "先小范围试一条，看看反馈后再决定是否放大。"),
            };
          }).filter((item) => item.risk)
        : [];

      return {
        summary: toText(rawRiskAlerts.summary, "冷启动最常见的不是没内容，而是一下子讲得太满，读者还没来得及认识你。"),
        details: details.length ? details : [
          {
            risk: "表达太完整，反而让人没有继续看下去的理由。",
            mitigation: "先保留一个悬念或一个具体场景，让读者先进入，再慢慢展开。",
          },
        ],
        encouragement: toText(rawRiskAlerts.encouragement, "先发第一条，比想一百条更重要。"),
      };
    }

    const riskList = Array.isArray(rawRiskAlerts) ? rawRiskAlerts.slice(0, 4).map((item) => toText(item)).filter(Boolean) : [];
    return {
      summary: riskList.length
        ? riskList[0]
        : "冷启动时真正需要注意的，不是先把所有风险挡住，而是先让第一条内容有机会被看见。",
      details: riskList.length
        ? riskList.map((item) => ({
            risk: item,
            mitigation: "先从小范围发布开始，观察反馈后再慢慢调整。",
          }))
        : [
            {
              risk: "一开始就想做到很完整，容易让节奏变慢。",
              mitigation: "先发一个最小可发布版本，再用反馈继续补充。",
            },
          ],
      encouragement: "你已经在做最难的第一步了，先让内容跑起来，再慢慢把它打磨好。",
    };
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
            creativeAngle: toText(current.creativeAngle, toText(current.reason, "从用户真实经历里提炼一个更具体的切口")),
            unusualApproach: toText(current.unusualApproach, toText(current.contentHook, "把常见讲法反过来，先讲结果再讲过程。")),
          };
        }).filter((item) => item.name || item.starterIdea)
      : [];

    const firstWeekSource = Array.isArray(raw.firstWeekPlan) ? raw.firstWeekPlan : [];
    const firstWeekPlan = Array.from({ length: 7 }, (_, index) => {
      const current = firstWeekSource[index] && typeof firstWeekSource[index] === "object" ? firstWeekSource[index] : {};
      return {
        titleIdea: toText(current.titleIdea, `Day ${index + 1}：${fallbackPhase(index)}`),
        angle: toText(current.angle, fallbackFeedbackFocus(index)),
        format: toText(current.format, index % 2 === 0 ? "图文" : "视频"),
        phase: toText(current.phase, fallbackPhase(index)),
        feedbackFocus: toText(current.feedbackFocus, fallbackFeedbackFocus(index)),
        learningFromPrev: toText(current.learningFromPrev, fallbackLearningFromPrev(index)),
      };
    });

    const riskAlerts = normalizeRiskAlerts(raw.riskAlerts);

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
        engagementTactic: toText(raw.firstPostBlueprint?.engagementTactic, "在结尾抛一个具体问题，把读者带进评论区。"),
        platformOptimized: toText(raw.firstPostBlueprint?.platformOptimized, "图文"),
        viralReason: toText(raw.firstPostBlueprint?.viralReason, "它既有真实经历，又有明显的转折和可转述点。"),
      },
      firstWeekPlan,
      riskAlerts,
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
      report.firstPostBlueprint?.publishContent &&
      report.firstPostBlueprint?.engagementTactic &&
      report.firstPostBlueprint?.platformOptimized &&
      report.firstPostBlueprint?.viralReason
    );
    const hasWeekPlan = Array.isArray(report.firstWeekPlan) && report.firstWeekPlan.length === 7;
    const hasRisk = Boolean(
      report.riskAlerts?.summary &&
      Array.isArray(report.riskAlerts?.details) &&
      report.riskAlerts.details.length > 0 &&
      report.riskAlerts?.encouragement
    );

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
5. 前一周该怎么从 0 到 1 开始，怎么发、怎么观察、怎么迭代
6. 风险提醒要温和，不要吓人，要顺手给出缓解办法和鼓励

你输出的内容要更像真正懂内容的人在说话：具体、带场景、带判断、带一点轻巧的记忆点。不要像通用模板，不要像公文，不要像没有经历的人在套句子。
尤其是标题、钩子、创意角度、风险提醒和第一周计划，要写得更有画面感和一点点“人话里的聪明劲”。
每一个方向都要给出明显不同的创意，不要三条都像同一套话术换个词。

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
8. firstPostBlueprint 只输出一个形式：图文 或 视频（二选一）。
9. firstPostBlueprint 必须包含 postType、publishText、publishContent、extensionPlan、engagementTactic、platformOptimized、viralReason。
10. opportunities 要有创意和传播感，不要只是安全但无聊的栏目名称。
11. 每个 opportunities 还要提供 starterIdea（这周直接可发的一条内容）、bestFormat（图文或视频）、creativeAngle（额外的新想法）和 unusualApproach（更少见的做法）。
12. firstWeekPlan 必须输出 7 条，不要每天换一个完全无关的话题；要围绕同一个起点，按“验证 -> 反馈 -> 迭代 -> 收束”往前走。
13. 每条 firstWeekPlan 都要包含 phase、feedbackFocus、learningFromPrev，让用户能照着起步和修正。
14. 所有内容都要具体，避免空泛鼓励和模板化描述。
15. 标题和正文要尽量贴近用户输入，不要像通用模板。
16. riskAlerts 要写成更人情化的结构：summary 是一段委婉提醒，details 是风险与缓解办法的配对，encouragement 是自然收尾的鼓励。
17. riskAlerts 的中文必须自然顺畅：不要出现奇怪空格、不要出现混乱标点、不要把句子硬拼接。
18. riskAlerts 的语气像一个有经验的创作同伴在陪跑：先提醒，再给做法，最后鼓励。
19. 不要用吓人的口吻，也不要只讲问题，要把缓解办法写出来。
20. 必须是合法 JSON。

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
      "creativeAngle": "基于用户输入衍生出来的一个新创意点",
      "unusualApproach": "和泛泛创作者不一样的做法，要更少见一点"
    },
    {
      "name": "内容方向名称",
      "position": "最容易冷启动",
      "reason": "为什么更容易起步",
      "targetAudience": "适合吸引的人",
      "contentHook": "这个方向的核心钩子与吸引点",
      "starterIdea": "这周直接可发的一条内容题目",
      "bestFormat": "图文或视频",
      "creativeAngle": "基于用户输入衍生出来的一个新创意点",
      "unusualApproach": "和泛泛创作者不一样的做法，要更少见一点"
    },
    {
      "name": "内容方向名称",
      "position": "最有长期延展",
      "reason": "为什么适合长期做",
      "targetAudience": "适合吸引的人",
      "contentHook": "这个方向的核心钩子与吸引点",
      "starterIdea": "这周直接可发的一条内容题目",
      "bestFormat": "图文或视频",
      "creativeAngle": "基于用户输入衍生出来的一个新创意点",
      "unusualApproach": "和泛泛创作者不一样的做法，要更少见一点"
    }
  ],
  "firstPostBlueprint": {
    "title": "直接可以发的第一篇标题，要具体、自然、有点巧思，不要标题党过头",
    "postType": "图文或视频（只能二选一）",
    "publishText": "可以直接当文案发出的短文本，要像创作者真的会发，不要像AI摘要",
    "publishContent": "可以直接发布的正文或口播稿，完整连续文本，要有人味、有节奏、有细节",
    "extensionPlan": ["如何拆成第2条内容", "如何拆成第3条内容", "如何拆成互动答疑内容"],
    "engagementTactic": "怎么把读者拉进互动",
    "platformOptimized": "图文或视频",
    "viralReason": "为什么这条更容易被看见和转述"
  },
  "firstWeekPlan": [
    {
      "titleIdea": "第一条内容建议标题",
      "angle": "具体切入角度",
      "format": "推荐形式",
      "phase": "验证核心假设",
      "feedbackFocus": "这条内容要观察什么",
      "learningFromPrev": "如何承接前一天的反馈"
    },
    {
      "titleIdea": "第二条内容建议标题",
      "angle": "具体切入角度",
      "format": "推荐形式",
      "phase": "验证核心假设",
      "feedbackFocus": "这条内容要观察什么",
      "learningFromPrev": "如何承接前一天的反馈"
    },
    {
      "titleIdea": "第三条内容建议标题",
      "angle": "具体切入角度",
      "format": "推荐形式",
      "phase": "收集反馈",
      "feedbackFocus": "这条内容要观察什么",
      "learningFromPrev": "如何承接前一天的反馈"
    },
    {
      "titleIdea": "第四条内容建议标题",
      "angle": "具体切入角度",
      "format": "推荐形式",
      "phase": "收集反馈",
      "feedbackFocus": "这条内容要观察什么",
      "learningFromPrev": "如何承接前一天的反馈"
    },
    {
      "titleIdea": "第五条内容建议标题",
      "angle": "具体切入角度",
      "format": "推荐形式",
      "phase": "迭代强化",
      "feedbackFocus": "这条内容要观察什么",
      "learningFromPrev": "如何承接前一天的反馈"
    },
    {
      "titleIdea": "第六条内容建议标题",
      "angle": "具体切入角度",
      "format": "推荐形式",
      "phase": "迭代强化",
      "feedbackFocus": "这条内容要观察什么",
      "learningFromPrev": "如何承接前一天的反馈"
    },
    {
      "titleIdea": "第七条内容建议标题",
      "angle": "具体切入角度",
      "format": "推荐形式",
      "phase": "沉淀下一步",
      "feedbackFocus": "这条内容要观察什么",
      "learningFromPrev": "如何承接前一天的反馈"
    }
  ],
  "riskAlerts": {
    "summary": "一段委婉、自然、带画面的提醒，写出冷启动里最容易卡住的地方，语气要像在陪你往前走，不要像提醒清单。",
    "details": [
      {
        "risk": "具体风险提醒1，要写得像真实创作者会遇到的一个小卡点",
        "mitigation": "对应的缓解办法，要具体到动作，不要空泛"
      },
      {
        "risk": "具体风险提醒2，要写得像真实创作者会遇到的一个小卡点",
        "mitigation": "对应的缓解办法，要具体到动作，不要空泛"
      },
      {
        "risk": "具体风险提醒3，要写得像真实创作者会遇到的一个小卡点",
        "mitigation": "对应的缓解办法，要具体到动作，不要空泛"
      }
    ],
    "encouragement": "一句自然的安慰和鼓励，不要口号感，要让人愿意继续做下去。"
  }
}
`;

    const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      prompt,
      max_tokens: 1600,
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

    const parsed = tryParseJsonFromText(text);

    if (!parsed) {
      return Response.json(
        {
          error: "模型未返回可解析结果，请重试",
          detail: "AI output could not be parsed into JSON",
        },
        { status: 502 }
      );
    }

    const sanitized = sanitizeReport(parsed);
    if (!sanitized || !hasValidReportContent(sanitized)) {
      return Response.json(
        {
          error: "模型结果不完整，请重试",
          detail: "AI output missed required report fields",
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
