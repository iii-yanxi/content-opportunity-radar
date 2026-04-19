const generateBtn = document.getElementById("generateBtn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

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
  box.innerHTML = "";

  if (!tags.length) {
    box.innerHTML = '<span class="tag muted">暂无标签</span>';
    return;
  }

  tags.forEach(tag => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = tag;
    box.appendChild(span);
  });
}

function renderGridList(boxId, dataMap) {
  const box = document.getElementById(boxId);
  box.innerHTML = "";
  if (!dataMap || typeof dataMap !== "object") return;

  for (const [label, content] of Object.entries(dataMap)) {
    if (!content) continue;
    const div = document.createElement("div");
    div.className = "grid-item";
    div.innerHTML =
      '<strong>' + escapeHtml(label) + '</strong>' +
      '<p>' + escapeHtml(content) + '</p>';
    box.appendChild(div);
  }
}

function renderDifferentiation(data) {
  renderGridList("differentiation", {
    "核心价值切口": data?.coreAngle,
    "为什么只能你来做": data?.whyYou,
    "避开的同质化路线": data?.avoidCommonPath,
  });
}

function renderTrafficPotential(data) {
  renderGridList("trafficPotential", {
    "情绪共鸣点": data?.highResonance,
    "收藏价值点": data?.highSaveValue,
    "讨论引爆点": data?.highDiscussionPotential,
  });
}

function renderBlueprint(data) {
  const box = document.getElementById("firstPostBlueprint");
  box.innerHTML = "";
  if (!data || !data.title) {
    box.innerHTML = '<p class="empty-note">暂无第一篇内容建议。</p>';
    return;
  }

  const structureHtml = (data.structure || [])
    .map((s, i) =>
      '<li><span class="step-num">' + (i + 1) + '</span> ' + escapeHtml(s) + '</li>'
    )
    .join("");

  box.innerHTML =
    '<div class="bp-title-wrap">' +
      '<span class="bp-badge">第一篇内容方案</span>' +
      '<h3 class="bp-title">' + escapeHtml(data.title) + '</h3>' +
    '</div>' +
    '<div class="bp-details">' +
      '<div class="bp-row"><strong>黄金开头：</strong>' + escapeHtml(data.hook) + '</div>' +
      '<div class="bp-row"><strong>推荐形式：</strong>' + escapeHtml(data.format) + '</div>' +
      '<div class="bp-row"><strong>互动引导：</strong>' + escapeHtml(data.cta) + '</div>' +
    '</div>' +
    '<div class="bp-structure">' +
      '<h4>正文结构参考：</h4>' +
      '<ul>' + structureHtml + '</ul>' +
    '</div>';
}

function renderOpportunities(list) {
  const box = document.getElementById("opportunities");
  box.innerHTML = "";

  if (!list.length) {
    box.innerHTML = '<p class="empty-note">暂无推荐内容方向，请尝试补充更多经历和目标人群信息。</p>';
    return;
  }

  list.forEach(item => {
    const div = document.createElement("article");
    div.className = "opportunity-item";
    div.innerHTML =
      '<div class="opportunity-head">' +
      '<span class="rank">方向 ' + escapeHtml(item.position || "-") + '</span>' +
      '<h3>' + escapeHtml(item.name || "未命名方向") + '</h3>' +
      '</div>' +
      '<p><span class="item-label">为什么适合过往经历</span>' + escapeHtml(item.reason || "-") + '</p>' +
      '<p><span class="item-label">核心钩子与吸引点</span>' + escapeHtml(item.contentHook || "-") + '</p>' +
      '<div class="opp-bottom">' +
        '<div class="opp-bottom-item"><span class="item-label">适合人群</span>' + escapeHtml(item.targetAudience || "-") + '</div>' +
        '<div class="opp-bottom-item"><span class="item-label">风险提示</span>' + escapeHtml(item.risk || "-") + '</div>' +
      '</div>';
    box.appendChild(div);
  });
}

function renderPlan(list) {
  const box = document.getElementById("firstWeekPlan");
  box.innerHTML = "";

  if (!list.length) {
    box.innerHTML = '<p class="empty-note">暂无第一周动作建议，请重新生成一次。</p>';
    return;
  }

  list.forEach((item, index) => {
    const div = document.createElement("article");
    div.className = "plan-item";
    div.innerHTML =
      '<div class="plan-index">Day ' + (index + 1) + '</div>' +
      '<h3>' + escapeHtml(item.titleIdea || "待定标题") + '</h3>' +
      '<p><span class="item-label">内容角度</span>' + escapeHtml(item.angle || "-") + '</p>' +
      '<p><span class="item-label">推荐形式</span>' + escapeHtml(item.format || "-") + '</p>';
    box.appendChild(div);
  });
}

function renderRisks(list) {
  const box = document.getElementById("riskAlerts");
  box.innerHTML = "";

  if (!list.length) {
    const li = document.createElement("li");
    li.className = "muted";
    li.textContent = "当前无明显风险提醒。";
    box.appendChild(li);
    return;
  }

  list.forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    box.appendChild(li);
  });
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
    renderRisks(data.riskAlerts || []);

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
