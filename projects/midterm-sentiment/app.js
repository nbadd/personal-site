(() => {
  "use strict";
  const root = document.getElementById("midterm-sentiment-mockup");
  if (!root) return;
  const staticResults = Boolean(root.dataset.resultsUrl);
  const fallbackStates = [
    { code: "IA", name: "Iowa", candidates: [{ id: "ia_turek", name: "Josh Turek", party: "D" }, { id: "ia_hinson", name: "Ashley Hinson", party: "R" }] },
    { code: "ME", name: "Maine", candidates: [{ id: "me_jackson", name: "Troy Jackson", party: "D" }, { id: "me_collins", name: "Susan Collins", party: "R" }] },
    { code: "MI", name: "Michigan", candidates: [{ id: "mi_elsayed", name: "Abdul El-Sayed", party: "D" }, { id: "mi_rogers", name: "Mike Rogers", party: "R" }] },
    { code: "NC", name: "North Carolina", candidates: [{ id: "nc_cooper", name: "Roy Cooper", party: "D" }, { id: "nc_whatley", name: "Michael Whatley", party: "R" }] },
    { code: "OH", name: "Ohio", candidates: [{ id: "oh_brown", name: "Sherrod Brown", party: "D" }, { id: "oh_husted", name: "Jon Husted", party: "R" }] },
    { code: "TX", name: "Texas", candidates: [{ id: "tx_talarico", name: "James Talarico", party: "D" }, { id: "tx_paxton", name: "Ken Paxton", party: "R" }] }
  ];
  const emptyWeeks = Array.from({ length: 10 }, (_, i) => ({ id: `planned-${i + 1}`, label: `Week ${i + 1}`, start_at: null, end_at: null }));
  const state = { code: "TX", week: null, followingLatest: true, loading: true, error: false, data: null, lastFetched: null };
  const SVG = "http://www.w3.org/2000/svg";
  const labels = ["for", "against", "neutral", "unclear"];
  const labelNames = ["For", "Against", "Neutral", "Unclear"];
  const completeStatuses = new Set(["complete", "completed", "quota_reached", "exhausted", "success", "done"]);
  const pendingStatuses = new Set(["", "pending", "not_started", "not_collected", "not_attempted", "planned"]);
  const activeStatuses = new Set(["running", "collecting", "partial", "interrupted", "sampling", "in_progress", "backfill_running"]);
  let timer = null;
  let fetching = false;
  try { const saved = localStorage.getItem("midterm-selected-state"); if (fallbackStates.some((s) => s.code === saved)) state.code = saved; } catch (_) { /* Optional preference storage. */ }

  const node = (tag, className, text) => { const element = document.createElement(tag); if (className) element.className = className; if (text !== undefined) element.textContent = text; return element; };
  const svgNode = (tag, attributes, text) => { const element = document.createElementNS(SVG, tag); Object.entries(attributes || {}).forEach(([key, value]) => element.setAttribute(key, String(value))); if (text !== undefined) element.textContent = text; return element; };
  const count = (value) => Number.isSafeInteger(value) && value >= 0 ? value : null;
  const number = (value) => count(value) === null ? "—" : value.toLocaleString("en-US");
  const signed = (value) => { if (!Number.isFinite(value)) return "—"; const rounded = Math.round(value * 10) / 10; return `${rounded > 0 ? "+" : rounded < 0 ? "−" : ""}${Math.abs(rounded).toLocaleString("en-US", { maximumFractionDigits: 1 })}`; };
  const validDate = (value) => { if (typeof value !== "string" || !value) return null; const date = new Date(value); return Number.isFinite(date.getTime()) ? date : null; };
  const dateLabel = (value, options = {}) => { const date = validDate(value); return date ? date.toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", ...options }) : null; };
  const weeks = () => Array.isArray(state.data?.weeks) && state.data.weeks.length ? state.data.weeks : emptyWeeks;
  const states = () => Array.isArray(state.data?.states) && state.data.states.length ? state.data.states : fallbackStates;
  const race = () => states().find((s) => s.code === state.code) || states()[0] || fallbackStates[5];
  const threshold = () => Number.isInteger(state.data?.min_classified) && state.data.min_classified >= 20 ? state.data.min_classified : 20;
  function weekLabel(week, index) { return typeof week?.label === "string" && week.label ? week.label : `Week ${index + 1}`; }
  function periodLabel(week, index) {
    const start = validDate(week?.start_at), end = validDate(week?.end_at);
    if (start && end && end > start) return `${dateLabel(start.toISOString())}–${dateLabel(new Date(end.getTime() - 1).toISOString(), { year: "numeric" })}`;
    return weekLabel(week, index);
  }
  function cell(candidate, week) {
    const rows = Array.isArray(candidate?.weeks) ? candidate.weeks : [];
    const row = rows.find((item) => item?.week_id === week?.id) || null;
    const status = typeof row?.status === "string" ? row.status.toLowerCase() : "not_collected";
    const values = labels.map((label) => count(row?.[`${label}_count`]));
    const available = !pendingStatuses.has(status) && values.every((value) => value !== null);
    const classified = available ? values[0] + values[1] + values[2] : null;
    const total = available ? classified + values[3] : null;
    const partial = available && !completeStatuses.has(status);
    return { row, values, available, classified, total, fetched: pendingStatuses.has(status) ? null : count(row?.fetched), status, partial, net: available && classified >= threshold() ? 100 * (values[0] - values[1]) / classified : null };
  }
  function statusLabel(value) {
    if (completeStatuses.has(value)) return "Collected";
    if (pendingStatuses.has(value)) return "Not collected";
    if (["running", "collecting", "sampling", "in_progress", "backfill_running"].includes(value)) return "Collecting";
    if (value === "interrupted") return "Interrupted · partial";
    if (value === "partial") return "Partial coverage";
    if (value === "failed" || value === "error") return "Stopped";
    return "Partial coverage";
  }
  function selectedIndex() { const index = weeks().findIndex((week) => week.id === state.week); return index >= 0 ? index : weeks().length - 1; }
  function selectLatestWeek() {
    if (!state.followingLatest && weeks().some((week) => week.id === state.week)) return;
    const candidates = race().candidates || [];
    const index = weeks().reduce((latest, week, i) => candidates.some((candidate) => cell(candidate, week).available) ? i : latest, -1);
    state.week = weeks()[index >= 0 ? index : weeks().length - 1]?.id || null;
  }

  const apps = Array.from(root.querySelectorAll(".ms-app"));
  apps.forEach((app, index) => {
    app.innerHTML = `
      <header class="ms-top">
        <nav class="ms-topnav" aria-label="Main navigation"><div class="ms-tabs" role="tablist" aria-label="Website pages">
          <button type="button" class="ms-nav-button" id="process-tab-${index}" role="tab" aria-controls="process-panel-${index}" aria-selected="false" tabindex="-1" data-view="process">How it works</button>
          <button type="button" class="ms-nav-button" id="race-tab-${index}" role="tab" aria-controls="race-panel-${index}" aria-selected="true" data-view="overview">Race overview</button>
        </div></nav>
        <div class="ms-state-control"><label for="ms-state-${index}">State</label><select id="ms-state-${index}" data-state-select aria-label="Select a state"></select></div>
      </header>
      <main class="ms-content ms-overview-panel" id="race-panel-${index}" role="tabpanel" aria-labelledby="race-tab-${index}">
        <div class="ms-hero"><div><div class="ms-eyebrow">2026 U.S. Senate</div><h1 class="ms-race-title"></h1></div></div>
        <div class="ms-week-toolbar"><div><p class="ms-period-eyebrow">Selected observation</p><h2 class="ms-selected-period"></h2></div><div class="ms-week-control"><label for="ms-week-${index}">Week</label><select id="ms-week-${index}" data-week-select aria-label="Select a weekly observation"></select></div></div>
        <div class="ms-board">
          <div class="ms-candidates" aria-label="Selected week candidate comparison"></div>
          <section class="ms-panel ms-trendpanel" aria-label="Saved weekly sentiment trend"><div class="ms-panelhead"><div><h2>Weekly sentiment over time</h2></div></div><div class="ms-legend ms-candidate-legend"></div><div class="ms-chart"></div><p class="ms-chart-empty" hidden></p><div class="ms-chartmeta">−100 all against · 0 balanced · +100 all for. Gaps indicate no score; open circles indicate partial coverage.</div></section>
          <section class="ms-panel ms-mixpanel" aria-label="Selected week model label counts"><div class="ms-panelhead"><div><h2>Selected week label mix</h2><div class="ms-chartmeta ms-mix-period"></div></div><span class="ms-latest-count ms-chartmeta"></span></div><div class="ms-mix"></div><div class="ms-legend ms-label-legend"></div><div class="ms-mixfoot">Net sentiment uses for, against, and neutral judgments. Unclear is shown separately.</div></section>
        </div>
        <details class="ms-week-details"><summary>View weekly sample details</summary><div class="ms-table-scroll"><table><caption class="ms-sr-only">All saved weekly candidate results for the selected race. Missing observations are shown as dashes.</caption><thead><tr><th scope="col">Week (UTC)</th><th scope="col">Candidate</th><th scope="col">Net</th><th scope="col">Classified</th><th scope="col">Unclear</th><th scope="col">Post reads</th><th scope="col">Collection</th></tr></thead><tbody></tbody></table></div></details>
      </main>
      <main class="ms-content ms-methods-panel" id="process-panel-${index}" role="tabpanel" aria-labelledby="process-tab-${index}" hidden></main>`;
    const template = document.getElementById("process-template");
    if (template) app.querySelector(".ms-methods-panel").append(template.content.cloneNode(true));
    app.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view, true)));
    app.querySelector(".ms-tabs").addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      const buttons = Array.from(app.querySelectorAll("[data-view]")), current = buttons.indexOf(document.activeElement);
      if (current < 0) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (current + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus(); setView(buttons[next].dataset.view, true);
    });
    app.querySelector("[data-state-select]").addEventListener("change", (event) => { state.code = event.target.value; state.followingLatest = true; selectLatestWeek(); render(); try { localStorage.setItem("midterm-selected-state", state.code); } catch (_) { /* Optional preference storage. */ } });
    app.querySelector("[data-week-select]").addEventListener("change", (event) => { state.week = event.target.value; state.followingLatest = false; render(); });
    labels.forEach((label, i) => { const item = node("span"); const dot = node("i", "ms-dot"); dot.style.background = `var(--ms-${label})`; item.append(dot, document.createTextNode(labelNames[i])); app.querySelector(".ms-label-legend").append(item); });
    if (typeof ResizeObserver !== "undefined") new ResizeObserver(() => drawChart(app)).observe(app.querySelector(".ms-chart"));
  });

  function drawChart(app) {
    const box = app.querySelector(".ms-chart"), width = box.clientWidth;
    if (width < 100) return;
    const periods = weeks(), candidates = race().candidates || [], height = 290;
    const pad = { left: 42, right: 24, top: 26, bottom: 48 }, plotWidth = width - pad.left - pad.right, plotHeight = height - pad.top - pad.bottom;
    const x = (i) => pad.left + (periods.length > 1 ? i * plotWidth / (periods.length - 1) : plotWidth / 2);
    const y = (value) => pad.top + (100 - value) * plotHeight / 200;
    const svg = svgNode("svg", { viewBox: `0 0 ${width} ${height}`, height, role: "img", "aria-label": `${race().name} weekly net sentiment across ${periods.length} planned weeks. Only saved observations with at least ${threshold()} classified judgments have scores. See weekly sample details for all values.` });
    svg.append(svgNode("title", {}, "Weekly net sentiment from saved candidate/post judgments"));
    svg.append(svgNode("text", { x: pad.left, y: 13, class: "ms-axis-label" }, "Net sentiment"));
    [-100, -50, 0, 50, 100].forEach((value) => { svg.append(svgNode("line", { x1: pad.left, x2: width - pad.right, y1: y(value), y2: y(value), class: value === 0 ? "ms-zero" : "" })); svg.append(svgNode("text", { x: pad.left - 9, y: y(value) + 4, "text-anchor": "end" }, signed(value))); });
    svg.append(svgNode("line", { x1: x(selectedIndex()), x2: x(selectedIndex()), y1: pad.top, y2: height - pad.bottom, class: "ms-week-guide" }));
    periods.forEach((week, i) => {
      if (width < 450 && ![0, Math.round((periods.length - 1) / 3), Math.round(2 * (periods.length - 1) / 3), periods.length - 1].includes(i)) return;
      const label = dateLabel(week.start_at) || `W${i + 1}`;
      svg.append(svgNode("text", { x: x(i), y: height - 25, "text-anchor": "middle" }, label));
    });
    svg.append(svgNode("text", { x: pad.left + plotWidth / 2, y: height - 4, "text-anchor": "middle", class: "ms-axis-label" }, "Week starting (UTC)"));
    let visibleCount = 0;
    candidates.forEach((candidate, candidateIndex) => {
      const series = periods.map((week, i) => ({ ...cell(candidate, week), index: i, week }));
      let segment = [];
      const appendSegment = () => { if (segment.length > 1) svg.append(svgNode("path", { class: candidateIndex % 2 ? "ms-b" : "ms-a", d: segment.map((point, i) => `${i ? "L" : "M"}${x(point.index)},${y(point.net)}`).join(" ") })); segment = []; };
      series.forEach((point) => { if (point.net === null) appendSegment(); else segment.push(point); });
      appendSegment();
      series.forEach((point) => {
        if (point.net === null) return;
        visibleCount += 1;
        const dot = svgNode("circle", { cx: x(point.index), cy: y(point.net), r: point.index === selectedIndex() ? 4.8 : 3.6, class: `${candidateIndex % 2 ? "ms-point-b" : "ms-point-a"}${point.partial ? " ms-point-partial" : ""}`, tabindex: "0" });
        dot.append(svgNode("title", {}, `${candidate.name} · ${periodLabel(point.week, point.index)}: ${signed(point.net)} net sentiment; ${number(point.classified)} classified, ${number(point.values[3])} unclear, ${number(point.fetched)} post reads. ${statusLabel(point.status)}.`));
        svg.append(dot);
      });
    });
    box.replaceChildren(svg);
    const empty = app.querySelector(".ms-chart-empty");
    empty.hidden = visibleCount > 0;
    empty.textContent = state.loading ? "Loading saved weekly observations…" : state.error && !state.data ? "Saved results are unavailable. Refresh to try again." : `No eligible weekly scores yet. Collected observations appear here once they reach ${threshold()} classified judgments.`;
  }


  function renderCandidates(app, week, index) {
    const candidates = race().candidates || [], container = app.querySelector(".ms-candidates"); container.replaceChildren();
    candidates.forEach((candidate, candidateIndex) => {
      const point = cell(candidate, week), previous = index > 0 ? cell(candidate, weeks()[index - 1]) : null;
      const card = node("article", "ms-candidate");
      const person = node("div", "ms-person"), initials = node("div", "ms-initials", candidate.name.split(" ").filter(Boolean).map((word) => word[0]).slice(0, 2).join("")); initials.setAttribute("aria-hidden", "true");
      const identity = node("div"); identity.append(node("div", "ms-name", candidate.name), node("div", "ms-party", candidate.party === "D" ? "Democratic" : candidate.party === "R" ? "Republican" : candidate.party || "")); person.append(initials, identity);
      const sample = node("span", "ms-sample", `n=${point.available ? number(point.total) : "—"}`);
      sample.title = "Posts kept after filtering, including unclear judgments.";
      sample.setAttribute("aria-label", `Sample size: ${point.available ? number(point.total) : "not available"}`);
      const header = node("div", "ms-candidate-header"); header.append(person, sample); card.append(header);
      const scoreLine = node("div", "ms-scoreline"), score = node("div"), value = node("div", `ms-number${point.net === null ? " ms-number-pending" : ""}`, point.net !== null ? signed(point.net) : point.available ? "Not enough data" : "Not collected");
      score.append(value, node("div", "ms-scorelabel", point.net !== null ? "Weekly net sentiment" : point.available ? `${threshold()} classified judgments required` : "No saved observation for this week")); scoreLine.append(score);
      const delta = node("div", "ms-change");
      if (point.net !== null && previous?.net !== null && previous?.net !== undefined && !point.partial && !previous.partial) delta.append(document.createTextNode(`${signed(point.net - previous.net)} points`), node("br"), document.createTextNode("vs. previous week"));
      else if (point.partial) { delta.classList.add("ms-partial-label"); delta.textContent = "Partial coverage"; }
      else if (point.net !== null) delta.textContent = "No comparable prior week";
      scoreLine.append(delta); card.append(scoreLine);
      container.append(card);
    });
  }

  function renderMix(app, week, index) {
    const container = app.querySelector(".ms-mix"); container.replaceChildren();
    let total = 0, available = 0;
    (race().candidates || []).forEach((candidate) => {
      const point = cell(candidate, week), row = node("div", "ms-mixrow"); row.append(node("span", "ms-mixname", candidate.name));
      if (point.available) {
        total += point.total; available += 1;
        const track = node("div", "ms-track"); track.setAttribute("role", "img"); track.setAttribute("aria-label", `${candidate.name}: ${point.values.map((value, i) => `${number(value)} ${labelNames[i].toLowerCase()}`).join(", ")}. ${statusLabel(point.status)}.`);
        point.values.forEach((value, i) => { const segment = node("span", "ms-segment"); segment.style.width = `${point.total > 0 ? 100 * value / point.total : 0}%`; segment.style.background = `var(--ms-${labels[i]})`; segment.title = `${labelNames[i]}: ${number(value)} judgments`; track.append(segment); });
        row.append(track, node("span", "ms-count", number(point.total)));
      } else row.append(node("div", "ms-mix-missing", "No saved labels"), node("span", "ms-count", "—"));
      container.append(row);
    });
    app.querySelector(".ms-mix-period").textContent = periodLabel(week, index);
    app.querySelector(".ms-latest-count").textContent = available ? `${number(total)} retained judgments${available < (race().candidates || []).length ? " · partial race coverage" : ""}` : "Awaiting collection";
  }

  function renderDetails(app) {
    const body = app.querySelector(".ms-week-details tbody"); body.replaceChildren();
    weeks().forEach((week, i) => (race().candidates || []).forEach((candidate) => {
      const point = cell(candidate, week), row = node("tr");
      [periodLabel(week, i), candidate.name, point.net !== null ? signed(point.net) : point.available ? `Hidden (<${threshold()})` : "—", number(point.classified), point.available ? number(point.values[3]) : "—", number(point.fetched), statusLabel(point.status)].forEach((text) => row.append(node("td", "", text)));
      body.append(row);
    }));
  }

  function render() {
    if (!states().some((item) => item.code === state.code)) state.code = states()[0]?.code || "TX";
    selectLatestWeek();
    const index = selectedIndex(), week = weeks()[index], currentRace = race();
    apps.forEach((app) => {
      const stateSelect = app.querySelector("[data-state-select]"); stateSelect.replaceChildren(...states().map((item) => { const option = node("option", "", item.name); option.value = item.code; return option; })); stateSelect.value = state.code;
      const weekSelect = app.querySelector("[data-week-select]"); weekSelect.replaceChildren(...weeks().map((item, i) => { const option = node("option", "", periodLabel(item, i)); option.value = item.id; return option; })); weekSelect.value = state.week;
      app.querySelector(".ms-race-title").textContent = `${currentRace.name} Senate race`;
      app.querySelector(".ms-selected-period").textContent = periodLabel(week, index);
      const legend = app.querySelector(".ms-candidate-legend"); legend.replaceChildren(); (currentRace.candidates || []).forEach((candidate, i) => legend.append(node("span", `ms-series-${i % 2 ? "b" : "a"}`, candidate.name)));
      renderCandidates(app, week, index); renderMix(app, week, index); renderDetails(app); drawChart(app);
    });
  }

  function scheduleRefresh() {
    clearTimeout(timer);
    if (staticResults || document.hidden) return;
    if (state.data?.collection_finished === true && !state.error) return;
    const status = typeof state.data?.status === "string" ? state.data.status.toLowerCase() : "";
    if (activeStatuses.has(status) || pendingStatuses.has(status) || state.data?.collection_finished === false || state.error) timer = setTimeout(() => loadResults(), 30000);
  }
  async function loadResults() {
    if (fetching) return;
    fetching = true; state.loading = true; render();
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(root.dataset.resultsUrl || "/api/weekly-results", { cache: "no-store", credentials: "same-origin", signal: controller.signal, headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Saved results unavailable");
      const data = await response.json();
      if (!data || data.schema_version !== 1 || !Array.isArray(data.weeks) || !data.weeks.length || !Array.isArray(data.states) || !data.states.length) throw new Error("Unexpected results format");
      if (data.weeks.some((week) => !week || typeof week.id !== "string") || data.states.some((item) => !item || typeof item.code !== "string" || typeof item.name !== "string" || !Array.isArray(item.candidates) || item.candidates.some((candidate) => !candidate || typeof candidate.id !== "string" || typeof candidate.name !== "string"))) throw new Error("Unexpected results format");
      state.data = data; state.error = false; state.lastFetched = Date.now();
    } catch (_) { state.error = true; }
    finally { clearTimeout(timeout); fetching = false; state.loading = false; render(); scheduleRefresh(); }
  }
  function setView(view, changeUrl = false) {
    const process = view === "process";
    apps.forEach((app) => { app.querySelector(".ms-overview-panel").hidden = process; app.querySelector(".ms-methods-panel").hidden = !process; app.querySelector(".ms-state-control").hidden = process; app.querySelectorAll("[data-view]").forEach((button) => { const selected = button.dataset.view === (process ? "process" : "overview"); button.setAttribute("aria-selected", String(selected)); button.tabIndex = selected ? 0 : -1; }); if (!process) drawChart(app); });
    if (changeUrl) { history.replaceState(null, "", process ? "#how-it-works" : location.pathname); window.scrollTo({ top: 0, behavior: "instant" }); }
  }
  window.addEventListener("hashchange", () => setView(location.hash === "#how-it-works" ? "process" : "overview"));
  document.addEventListener("visibilitychange", () => { if (staticResults) return; clearTimeout(timer); if (!document.hidden && (!state.lastFetched || Date.now() - state.lastFetched >= 25000)) loadResults(); else scheduleRefresh(); });
  render(); setView(location.hash === "#how-it-works" ? "process" : "overview"); loadResults();
})();
