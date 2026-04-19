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
      '<p><span class="item-label">为什么适合</span>' + escapeHtml(item.reason || "-") + '</p>' +
      '<p><span class="item-label">适合吸引</span>' + escapeHtml(item.targetAudience || "-") + '</p>' +
      '<p><span class="item-label">风险点</span>' + escapeHtml(item.risk || "-") + '</p>';
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

  statusEl.textContent = "正在生成，请稍等...";
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
    renderOpportunities(data.opportunities || []);
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