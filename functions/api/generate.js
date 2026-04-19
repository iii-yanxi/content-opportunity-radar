export async function onRequestPost(context) {
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
你是一个中文内容冷启动策略助手。
请根据用户输入，输出严格 JSON，不要输出 markdown，不要输出解释。
字段必须完整，不能省略。

用户信息：
- 经历/优势：${background}
- 想表达的主题：${topics}
- 想吸引的人群：${audience}
- 表达方式偏好：${stylePreference}
- 每周更新频率：${frequency}

请返回这个 JSON 结构：
{
  "assetSummary": "一句话总结这个人的内容资产，不超过60字",
  "assetTags": ["标签1", "标签2", "标签3"],
  "opportunities": [
    {
      "name": "方向名称",
      "position": "最适合你",
      "reason": "为什么适合",
      "targetAudience": "适合吸引的人",
      "risk": "这个方向的主要风险"
    },
    {
      "name": "方向名称",
      "position": "最容易冷启动",
      "reason": "为什么容易起步",
      "targetAudience": "适合吸引的人",
      "risk": "这个方向的主要风险"
    },
    {
      "name": "方向名称",
      "position": "最有长期延展",
      "reason": "为什么适合长期做",
      "targetAudience": "适合吸引的人",
      "risk": "这个方向的主要风险"
    }
  ],
  "firstWeekPlan": [
    {
      "titleIdea": "第一条内容建议标题",
      "angle": "这一条的内容角度",
      "format": "推荐形式，例如图文/短视频/清单/复盘"
    },
    {
      "titleIdea": "第二条内容建议标题",
      "angle": "这一条的内容角度",
      "format": "推荐形式"
    },
    {
      "titleIdea": "第三条内容建议标题",
      "angle": "这一条的内容角度",
      "format": "推荐形式"
    }
  ],
  "riskAlerts": ["风险提醒1", "风险提醒2", "风险提醒3"]
}

要求：
1. 建议要具体，不要空泛鼓励。
2. 不要编造用户没有的经历。
3. 方向要有差异，不要重复。
4. 必须是合法 JSON。
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
      return Response.json(
        {
          assetSummary: "你具备复合型内容资产，适合从个人经历与主题兴趣交叉切入。",
          assetTags: ["复合经历", "可持续表达", "内容冷启动"],
          opportunities: [
            {
              name: "成长经历拆解",
              position: "最适合你",
              reason: "你的经历有真实感，容易建立信任。",
              targetAudience: audience,
              risk: "如果过于流水账，会降低吸引力。"
            },
            {
              name: "轻干货经验分享",
              position: "最容易冷启动",
              reason: "容易围绕已有经验快速输出。",
              targetAudience: audience,
              risk: "如果太泛，会显得同质化。"
            },
            {
              name: "主题化长期栏目",
              position: "最有长期延展",
              reason: "适合形成稳定更新和个人识别度。",
              targetAudience: audience,
              risk: "需要持续选题能力。"
            }
          ],
          firstWeekPlan: [
            {
              titleIdea: "先讲一个最能代表你的真实经历",
              angle: "用具体场景切入，建立人物感",
              format: "图文"
            },
            {
              titleIdea: "总结一个你最有发言权的经验",
              angle: "提供一个可直接复用的方法",
              format: "清单"
            },
            {
              titleIdea: "做一期你想长期更新的栏目试水",
              angle: "测试用户对你核心方向的反馈",
              format: "短视频"
            }
          ],
          riskAlerts: [
            "不要一开始覆盖太多主题",
            "避免只讲感受不讲具体细节",
            "尽量形成稳定更新节奏"
          ]
        },
        { status: 200 }
      );
    }

    return Response.json(parsed, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: error.message || "服务异常" },
      { status: 500 }
    );
  }
}
