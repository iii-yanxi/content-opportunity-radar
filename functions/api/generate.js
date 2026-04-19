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
    const cleaned = value
      .map((item) => toText(item))
      .filter(Boolean);
    return cleaned.length ? cleaned : fallback;
  }

  function fallbackReport(audience = "") {
    return {
      assetSummary: "你具备可转化为自媒体表达的内容资产，适合从真实经历、明确主题或稳定兴趣切入。",
      assetTags: ["真实表达", "可持续主题", "冷启动友好"],
      opportunities: [
        {
          name: "真实经历复盘",
          position: "最适合你",
          reason: "从最具体、最真实的经历切入，更容易建立信任感和人物记忆点。",
          targetAudience: audience || "与你经历相关的潜在读者",
          risk: "如果写得太流水账，内容吸引力会下降。"
        },
        {
          name: "轻干货经验分享",
          position: "最容易冷启动",
          reason: "围绕已有经验、技能或阶段性收获快速输出，更适合起步阶段稳定更新。",
          targetAudience: audience || "希望快速获得可用方法的人群",
          risk: "如果信息密度不足，容易显得普通。"
        },
        {
          name: "主题化长期栏目",
          position: "最有长期延展",
          reason: "围绕一个稳定主题持续输出，更容易形成内容识别度和长期积累。",
          targetAudience: audience || "对长期陪伴式内容有兴趣的人群",
          risk: "需要持续选题和长期表达耐心。"
        }
      ],
      firstWeekPlan: [
        {
          titleIdea: "先讲一个最能代表你的真实经历或阶段变化",
          angle: "从一个具体场景切入，让别人先理解你是谁、经历了什么、为什么值得关注。",
          format: "图文"
        },
        {
          titleIdea: "分享一个你最有发言权的经验或方法",
          angle: "把自己的经历提炼成别人能收藏和复用的具体收获。",
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

  function sanitizeReport(raw, audience = "") {
    const base = fallbackReport(audience);
    if (!raw || typeof raw !== "object") {
      return base;
    }

    const positions = ["最适合你", "最容易冷启动", "最有长期延展"];

    const opportunities = Array.isArray(raw.opportunities)
      ? raw.opportunities.slice(0, 3).map((item, index) => {
          const current = item && typeof item === "object" ? item : {};
          return {
            name: toText(current.name, base.opportunities[index].name),
            position: toText(current.position, positions[index]),
            reason: toText(current.reason, base.opportunities[index].reason),
            targetAudience: toText(current.targetAudience, audience || base.opportunities[index].targetAudience),
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

    const riskAlerts = pickStringArray(raw.riskAlerts, base.riskAlerts).slice(0, 3);
    while (riskAlerts.length < 3) {
      riskAlerts.push(base.riskAlerts[riskAlerts.length]);
    }

    return {
      assetSummary: limitText(raw.assetSummary || base.assetSummary, 60) || base.assetSummary,
      assetTags: pickStringArray(raw.assetTags, base.assetTags).slice(0, 6),
      opportunities,
      firstWeekPlan,
      riskAlerts,
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
      return Response.json(
        { error: "缺少必要字段" },
        { status: 400 }
      );
    }

    const prompt = `
你是一个“自媒体冷启动内容策略助手”，不是职业规划师，也不是泛泛而谈的聊天助手。
你的任务是帮助用户找到：
1. 适合自己的自媒体内容定位
2. 更有差异化的内容切口
3. 第一周可以直接发布的内容动作
4. 需要规避的同质化风险

请根据用户输入，输出严格 JSON，不要输出 markdown，不要输出解释，不要输出代码块。
字段必须完整，不能省略。

用户信息：
- 经历/优势：${background}
- 想表达的主题：${topics}
- 想吸引的人群：${audience}
- 表达方式偏好：${stylePreference}
- 每周更新频率：${frequency}

请特别遵守以下规则：
1. opportunities 必须是“内容方向/内容栏目/内容赛道”，不能是职业岗位、职业身份或行业头衔。
2. 不要输出“产品经理”“技术专家”“教育培训师”“讲师”“运营”等职业名称作为方向。
3. 内容方向要贴近自媒体创作，例如“真实经历复盘”“个人成长记录”“行业趋势拆解”“生活方式表达”“技能经验分享”“兴趣主题表达”等。
4. 要体现差异化和潜在传播优势，但不要假装引用实时热点数据；只能基于用户输入做合理判断。
5. 建议必须具体、可执行，不能空泛鼓励。
6. 不要编造用户没有提到的经历。
7. 必须是合法 JSON。

请返回这个 JSON 结构：
{
  "assetSummary": "一句话总结这个人的内容资产，不超过60字",
  "assetTags": ["标签1", "标签2", "标签3"],
  "opportunities": [
    {
      "name": "内容方向名称",
      "position": "最适合你",
      "reason": "为什么这个内容方向适合这个人，强调内容表达而不是职业选择",
      "targetAudience": "适合吸引的人",
      "risk": "这个内容方向的主要风险，比如同质化、表达过泛、难持续等"
    },
    {
      "name": "内容方向名称",
      "position": "最容易冷启动",
      "reason": "为什么这个方向更容易起步",
      "targetAudience": "适合吸引的人",
      "risk": "这个方向的主要风险"
    },
    {
      "name": "内容方向名称",
      "position": "最有长期延展",
      "reason": "为什么这个方向适合长期做",
      "targetAudience": "适合吸引的人",
      "risk": "这个方向的主要风险"
    }
  ],
  "firstWeekPlan": [
    {
      "titleIdea": "第一条内容建议标题，要像真的可以发出去的题目",
      "angle": "这一条的具体切入角度，尽量有场景感或记忆点",
      "format": "推荐形式，例如图文/短视频/清单/复盘"
    },
    {
      "titleIdea": "第二条内容建议标题",
      "angle": "这一条的具体切入角度",
      "format": "推荐形式"
    },
    {
      "titleIdea": "第三条内容建议标题",
      "angle": "这一条的具体切入角度",
      "format": "推荐形式"
    }
  ],
  "riskAlerts": ["风险提醒1", "风险提醒2", "风险提醒3"]
}
`;

    const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      prompt,
      max_tokens: 900,
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