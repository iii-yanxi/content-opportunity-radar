const generateBtn = document.getElementById("generateBtn");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");

function renderTags(tags) {
  const box = document.getElementById("assetTags");
  box.innerHTML = "";
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
  list.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <h3>${item.position}：${item.name}</h3>
      <p><strong>为什么适合：</strong>${item.reason}</p>
      <p><strong>适合吸引：</strong>${item.targetAudience}</p>
      <p><strong>风险点：</strong>${item.risk}</p>
    `;
    box.appendChild(div);
  });
}

function renderPlan(list) {
  const box = document.getElementById("firstWeekPlan");
  box.innerHTML = "";
  list.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <h3>第${index + 1}条：${item.titleIdea}</h3>
      <p><strong>内容角度：</strong>${item.angle}</p>
      <p><strong>推荐形式：</strong>${item.format}</p>
    `;
    box.appendChild(div);
  });
}

function renderRisks(list) {
  const box = document.getElementById("riskAlerts");
  box.innerHTML = "";
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
    return;
  }

  statusEl.textContent = "正在生成，请稍等...";
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
  } catch (err) {
    console.error(err);
    statusEl.textContent = `出错了：${err.message}`;
  } finally {
    generateBtn.disabled = false;
  }
});