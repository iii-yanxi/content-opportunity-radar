const generateBtn = document.getElementById("generateBtn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const voiceControllers = new Map();

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderTags(tags) {
  const box = document.getElementById("assetTags");
  if (!box) return;
  box.innerHTML = "";

  if (!tags.length) {
    box.innerHTML = '<span class="tag muted">暂无标签</span>';
    return;
  }

  tags.forEach((tag) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = tag;
    box.appendChild(span);
  });
}

function insertTextAtCursor(field, text) {
  const value = field.value || "";
  const start = field.selectionStart ?? value.length;
  const end = field.selectionEnd ?? value.length;
  const nextValue = value.slice(0, start) + text + value.slice(end);
  field.value = nextValue;
  const cursor = start + text.length;
  field.setSelectionRange(cursor, cursor);
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

function attachVoiceInputButtons() {
  const buttons = document.querySelectorAll("[data-voice-for]");
  buttons.forEach((button) => {
    const fieldId = button.getAttribute("data-voice-for");
    const field = document.getElementById(fieldId);
    if (!field) return;

    if (!SpeechRecognition) {
      button.disabled = true;
      button.title = "当前浏览器不支持中文语音输入";
      button.classList.add("is-disabled");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = true;

    let finalText = "";

    const stopVoice = (resetLabel = true) => {
      voiceControllers.delete(fieldId);
      button.classList.remove("is-recording");
      if (resetLabel) button.title = "语音输入";
    };

    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }

      if (event.results[event.results.length - 1]?.isFinal) {
        finalText = transcript.trim();
        return;
      }

      const liveText = transcript.trim();
      button.dataset.liveText = liveText;
      button.title = liveText || "正在识别";
    };

    recognition.onend = () => {
      const liveText = button.dataset.liveText || "";
      const transcript = finalText || liveText;
      if (transcript) {
        const joined = field.value.trim();
        const addition = joined ? (field.tagName === "TEXTAREA" ? "\n" : " ") + transcript : transcript;
        insertTextAtCursor(field, addition);
      }
      delete button.dataset.liveText;
      finalText = "";
      stopVoice(true);
    };

    recognition.onerror = () => {
      delete button.dataset.liveText;
      finalText = "";
      stopVoice(true);
      statusEl.textContent = "语音输入暂时不可用，请再试一次。";
      statusEl.dataset.state = "error";
    };

    button.addEventListener("click", () => {
      if (voiceControllers.has(fieldId)) {
        try {
          voiceControllers.get(fieldId).stop();
        } catch {
          stopVoice(true);
        }
        return;
      }

      voiceControllers.set(fieldId, recognition);
      button.classList.add("is-recording");
      button.title = "正在录音，点一下可停止";
      statusEl.textContent = "正在等待你的语音输入，尽量用自然中文表达。";
      statusEl.dataset.state = "loading";

      try {
        recognition.start();
      } catch (error) {
        stopVoice(true);
        statusEl.textContent = "语音输入启动失败，请稍后重试。";
        statusEl.dataset.state = "error";
        console.error(error);
      }
    });
  });
}

function scoreText(text, keywords) {
  const value = String(text || "");
  let score = 2;

  keywords.forEach((keyword) => {
    if (value.includes(keyword)) {
      score += 1.2;
    }
  });

  if (value.length > 20) score += 0.7;
  if (value.length > 45) score += 0.7;
  if (value.length > 70) score += 0.4;

  return Math.max(1.2, Math.min(9.6, Math.round(score * 10) / 10));
}

function renderDifferentiation(data) {
  const box = document.getElementById("differentiationTable");
  if (!box) return;
  box.innerHTML = "";

  const rows = [
    {
      label: "核心切口",
      generic: "只讲一个很泛的主题，听完还是模糊的。",
      custom: data?.coreAngle || "-",
    },
    {
      label: "可信度来源",
      generic: "有观点，但没有你自己的经历入口。",
      custom: data?.whyYou || "-",
    },
    {
      label: "撞车路线",
      generic: "顺着别人已经讲烂的表达继续说。",
      custom: data?.avoidCommonPath || "-",
    },
  ];

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML =
      '<th scope="row">' + escapeHtml(row.label) + '</th>' +
      '<td>' + escapeHtml(row.generic) + '</td>' +
      '<td>' + escapeHtml(row.custom) + '</td>';
    box.appendChild(tr);
  });
}

function renderTrafficPotential(data) {
  const box = document.getElementById("trafficChart");
  if (!box) return;
  box.innerHTML = "";

  const nodes = [
    {
      label: "共鸣点",
      text: data?.highResonance || "-",
      x: scoreText(data?.highResonance, ["共鸣", "代入", "真实", "情绪", "故事", "反差"]),
      y: scoreText(data?.highResonance, ["共鸣", "代入", "真实", "情绪", "故事", "反差"]),
      size: scoreText(data?.highResonance, ["共鸣", "代入", "真实", "情绪", "故事", "反差"]),
      tone: "tone-one",
    },
    {
      label: "收藏点",
      text: data?.highSaveValue || "-",
      x: scoreText(data?.highSaveValue, ["清单", "方法", "模板", "步骤", "复盘", "框架", "可收藏"]),
      y: scoreText(data?.highSaveValue, ["清单", "方法", "模板", "步骤", "复盘", "框架", "可收藏"]),
      size: scoreText(data?.highSaveValue, ["清单", "方法", "模板", "步骤", "复盘", "框架", "可收藏"]),
      tone: "tone-two",
    },
    {
      label: "讨论点",
      text: data?.highDiscussionPotential || "-",
      x: scoreText(data?.highDiscussionPotential, ["讨论", "留言", "争议", "观点", "分歧", "反问"]),
      y: scoreText(data?.highDiscussionPotential, ["讨论", "留言", "争议", "观点", "分歧", "反问"]),
      size: scoreText(data?.highDiscussionPotential, ["讨论", "留言", "争议", "观点", "分歧", "反问"]),
      tone: "tone-three",
    },
  ];

  nodes.forEach((node) => {
    const left = Math.min(84, Math.max(10, node.x * 8.5));
    const top = Math.min(84, Math.max(12, 96 - node.y * 8.2));
    const size = Math.min(56, Math.max(26, node.size * 4.6));

    const item = document.createElement("article");
    item.className = "traffic-node " + node.tone;
    item.style.left = left + "%";
    item.style.top = top + "%";
    item.style.setProperty("--node-size", size + "px");
    item.innerHTML =
      '<span class="traffic-node-dot"></span>' +
      '<div class="traffic-node-copy">' +
        '<strong>' + escapeHtml(node.label) + '</strong>' +
        '<p>' + escapeHtml(node.text) + '</p>' +
      '</div>';
    box.appendChild(item);
  });
}

function renderBlueprint(data) {
  const box = document.getElementById("firstPostBlueprint");
  if (!box) return;
  box.innerHTML = "";

  if (!data || !data.title) {
    box.innerHTML = '<p class="empty-note">暂无第一篇内容建议。</p>';
    return;
  }

  const publishType = escapeHtml(data.postType || "图文");
  const publishBody = escapeHtml(data.publishContent || data.contentBody || "");
  const postText = escapeHtml(data.publishText || data.coverLine || "");
  const extensionList = (data.extensionPlan || [])
    .map((s) => '<li>' + escapeHtml(s) + '</li>')
    .join("");

  box.innerHTML =
    '<div class="bp-title-wrap">' +
      '<span class="bp-badge">直接发这一条</span>' +
      '<h3 class="bp-title">' + escapeHtml(data.title) + '</h3>' +
    '</div>' +
    '<div class="bp-details">' +
      '<div class="bp-row"><strong>发布形式：</strong>' + publishType + '</div>' +
      '<div class="bp-row"><strong>发布文案：</strong>' + (postText || "按正文第一段作为文案直接发布") + '</div>' +
    '</div>' +
    '<div class="bp-meta-grid">' +
      '<div class="bp-meta-card">' +
        '<span>平台倾向</span>' +
        '<strong>' + escapeHtml(data.platformOptimized || "图文") + '</strong>' +
      '</div>' +
      '<div class="bp-meta-card">' +
        '<span>互动钩子</span>' +
        '<strong>' + escapeHtml(data.engagementTactic || "把问题丢给评论区") + '</strong>' +
      '</div>' +
      '<div class="bp-meta-card bp-meta-card-wide">' +
        '<span>为什么更容易被看见</span>' +
        '<strong>' + escapeHtml(data.viralReason || "它有真实经历，也有可转述的细节") + '</strong>' +
      '</div>' +
    '</div>' +
    '<div class="bp-structure">' +
      '<h4>直接可发内容：</h4>' +
      '<p class="bp-direct">' + (publishBody || "暂无正文，请重试生成") + '</p>' +
    '</div>' +
    '<div class="bp-structure">' +
      '<h4>延展扩散（同主题继续吃流量）：</h4>' +
      '<ul>' + (extensionList || '<li>把主帖拆成复盘版、清单版、观点版三条内容。</li>') + '</ul>' +
    '</div>';
}

function renderOpportunities(list) {
  const box = document.getElementById("opportunities");
  if (!box) return;
  box.innerHTML = "";

  if (!list.length) {
    box.innerHTML = '<p class="empty-note">暂无推荐内容方向，请尝试补充更多经历和目标人群信息。</p>';
    return;
  }

  list.forEach((item) => {
    const div = document.createElement("article");
    div.className = "opportunity-item";
    div.innerHTML =
      '<div class="opportunity-head">' +
        '<span class="rank">方向 ' + escapeHtml(item.position || "-") + '</span>' +
        '<h3>' + escapeHtml(item.name || "未命名方向") + '</h3>' +
      '</div>' +
      '<p><span class="item-label">为什么适合你</span>' + escapeHtml(item.reason || "-") + '</p>' +
      '<p><span class="item-label">这周直接发这一条</span>' + escapeHtml(item.starterIdea || "先发一个真实场景 + 反转结论的内容") + '</p>' +
      '<div class="opp-grid">' +
        '<div class="opp-grid-item">' +
          '<span class="item-label">创意突破点</span>' +
          '<strong>' + escapeHtml(item.creativeAngle || "-") + '</strong>' +
        '</div>' +
        '<div class="opp-grid-item">' +
          '<span class="item-label">更少见的做法</span>' +
          '<strong>' + escapeHtml(item.unusualApproach || "-") + '</strong>' +
        '</div>' +
      '</div>' +
      '<div class="opp-bottom">' +
        '<div class="opp-bottom-item"><span class="item-label">适合的人群</span>' + escapeHtml(item.targetAudience || "-") + '</div>' +
        '<div class="opp-bottom-item"><span class="item-label">建议形式</span>' + escapeHtml(item.bestFormat || "图文") + '</div>' +
      '</div>';
    box.appendChild(div);
  });
}

function getPlanTone(index) {
  if (index < 2) return "tone-hypothesis";
  if (index < 4) return "tone-feedback";
  if (index < 6) return "tone-iterate";
  return "tone-consolidate";
}

function renderPlan(list) {
  const box = document.getElementById("firstWeekPlan");
  if (!box) return;
  box.innerHTML = "";

  if (!list.length) {
    box.innerHTML = '<p class="empty-note">暂无第一周动作建议，请重新生成一次。</p>';
    return;
  }

  const keyIndexes = [0, 2, 4, 6].filter((index) => index < list.length);
  const keyNodes = keyIndexes.map((index) => ({ item: list[index], day: index + 1 }));

  const timeline = document.createElement("div");
  timeline.className = "timeline-horizontal";

  keyNodes.forEach(({ item, day }, index) => {
    const div = document.createElement("article");
    div.className = "timeline-h-item " + getPlanTone(index);
    div.innerHTML =
      '<div class="timeline-h-dot"></div>' +
      '<div class="timeline-h-card">' +
        '<div class="plan-index">Day ' + day + '</div>' +
        '<h3>' + escapeHtml(item.phase || "关键节点") + '</h3>' +
        '<p>' + escapeHtml(item.feedbackFocus || item.angle || "-") + '</p>' +
      '</div>';

    if (index < keyNodes.length - 1) {
      div.innerHTML += '<div class="timeline-h-link" aria-hidden="true"></div>';
    }

    timeline.appendChild(div);
  });

  const footer = document.createElement("p");
  footer.className = "timeline-note";
  footer.textContent = "关键节奏：先验证切口，再看反馈，然后放大有效表达，最后沉淀成可持续节奏。";

  box.appendChild(timeline);
  box.appendChild(footer);
}

function renderRisks(data) {
  const box = document.getElementById("riskAlerts");
  if (!box) return;
  box.innerHTML = "";

  const normalizeChineseText = (text) => {
    return String(text || "")
      .replace(/[\u00A0\t\n\r]+/g, " ")
      .replace(/\s*([，。；：！？])/g, "$1")
      .replace(/([（《“])\s+/g, "$1")
      .replace(/\s+([）》”])/g, "$1")
      .replace(/([\u4e00-\u9fff])\s+([\u4e00-\u9fff])/g, "$1$2")
      .replace(/\s+/g, " ")
      .trim();
  };

  const ensureEndPunctuation = (text) => {
    if (!text) return "";
    return /[。！？]$/.test(text) ? text : `${text}。`;
  };

  const toGentleSentence = (risk, mitigation) => {
    const riskText = normalizeChineseText(risk);
    const solutionText = normalizeChineseText(mitigation);
    if (riskText && solutionText) {
      return `如果你发现自己${riskText}，可以先${solutionText}`;
    }
    return riskText || solutionText;
  };

  const composeRiskParagraph = (source) => {
    const summary = normalizeChineseText(source?.summary || "");
    const details = Array.isArray(source?.details) ? source.details : [];
    const encouragement = normalizeChineseText(source?.encouragement || "");

    const guidance = details
      .map((item) => toGentleSentence(item?.risk, item?.mitigation))
      .filter(Boolean);

    const chunks = [];
    if (summary) chunks.push(summary);
    if (guidance.length) {
      chunks.push(`你可以这样处理：${guidance.join("；")}`);
    }
    if (encouragement) chunks.push(encouragement);

    return ensureEndPunctuation(chunks.join("。"));
  };

  if (Array.isArray(data)) {
    if (!data.length) {
      box.innerHTML = '<p class="empty-note">当前无明显风险提醒。</p>';
      return;
    }

    const paragraph = document.createElement("p");
    paragraph.className = "risk-summary risk-paragraph";
    paragraph.textContent = ensureEndPunctuation(normalizeChineseText(data.join("。")));
    box.appendChild(paragraph);
    return;
  }

  if (!data || typeof data !== "object") {
    box.innerHTML = '<p class="empty-note">当前无明显风险提醒。</p>';
    return;
  }

  const paragraph = document.createElement("p");
  paragraph.className = "risk-summary risk-paragraph";
  paragraph.textContent = composeRiskParagraph(data);
  box.appendChild(paragraph);
}

generateBtn.addEventListener("click", async () => {
  const payload = {
    background: document.getElementById("background").value.trim(),
    topics: document.getElementById("topics").value.trim(),
    audience: document.getElementById("audience").value.trim(),
    stylePreference: document.getElementById("stylePreference").value,
    frequency: document.getElementById("frequency").value,
  };

  if (!payload.background || !payload.topics || !payload.audience) {
    statusEl.textContent = "请先填写前三项核心信息。";
    statusEl.dataset.state = "error";
    return;
  }

  statusEl.textContent = "正在生成内容策略报告，请稍等...";
  statusEl.dataset.state = "loading";
  generateBtn.disabled = true;

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "生成失败");
    }

    document.getElementById("assetSummary").textContent = data.assetSummary;
    renderTags(data.assetTags || []);

    renderDifferentiation(data.differentiation);
    renderTrafficPotential(data.trafficPotential);

    renderOpportunities(data.opportunities || []);
    renderBlueprint(data.firstPostBlueprint || {});
    renderPlan(data.firstWeekPlan || []);
    renderRisks(data.riskAlerts || {});

    resultEl.classList.remove("hidden");
    statusEl.textContent = "生成完成。";
    statusEl.dataset.state = "success";
    resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    console.error(err);
    statusEl.textContent = "出错了：" + err.message;
    statusEl.dataset.state = "error";
  } finally {
    generateBtn.disabled = false;
  }
});

attachVoiceInputButtons();
