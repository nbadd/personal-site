(() => {
  "use strict";

  function initialize(root) {
    if (root.dataset.pwInitialized === "true") return;
    root.dataset.pwInitialized = "true";

    const find = (selector) => root.querySelector(selector);
    const all = (selector) => Array.from(root.querySelectorAll(selector));
    const write = (selector, value) => { const node = find(selector); if (node) node.textContent = value; };
    const colorFor = (label) => `var(--pw-${label})`;
    const formatCount = (value) => value.toLocaleString("en-US");
    const formatScore = (value) => {
      const rounded = Math.round(value * 10) / 10;
      return `${rounded > 0 ? "+" : rounded < 0 ? "−" : ""}${Math.abs(rounded).toLocaleString("en-US", { maximumFractionDigits: 1 })}`;
    };

    function boundedCount(input) {
      const value = Number(input.value);
      if (!Number.isFinite(value)) return 0;
      return Math.min(10000, Math.max(0, Math.floor(value)));
    }

    function updateCalculator() {
      const counts = {};
      all("[data-pw-count]").forEach((input) => { counts[input.dataset.pwCount] = boundedCount(input); });
      const total = counts.for + counts.against + counts.neutral + counts.unclear;
      const classified = counts.for + counts.against + counts.neutral;
      const eligible = classified >= 20;
      const score = classified > 0 ? 100 * (counts.for - counts.against) / classified : 0;
      const scoreNode = find("[data-pw-score]");
      const gauge = find("[data-pw-gauge]");
      const marker = find("[data-pw-gauge-marker]");

      write("[data-pw-total]", formatCount(total));
      write("[data-pw-unclear]", formatCount(counts.unclear));
      write("[data-pw-classified]", formatCount(classified));
      find("[data-pw-stack]").setAttribute("aria-label", `${formatCount(total)} judgments: ${formatCount(counts.for)} for, ${formatCount(counts.against)} against, ${formatCount(counts.neutral)} neutral, ${formatCount(counts.unclear)} unclear`);
      all("[data-pw-stack-segment]").forEach((segment) => {
        const count = counts[segment.dataset.pwStackSegment];
        segment.style.flexBasis = total > 0 ? `${100 * count / total}%` : "0%";
        segment.style.display = count > 0 ? "block" : "none";
      });

      scoreNode.classList.toggle("pw-score-withheld", !eligible);
      scoreNode.textContent = eligible ? formatScore(score) : "More data needed";
      scoreNode.style.color = !eligible ? "var(--ms-sub, #66796c)" : score < 0 ? colorFor("against") : score > 0 ? colorFor("for") : "var(--ms-ink, #213c31)";
      marker.style.display = eligible ? "block" : "none";
      marker.style.left = `${(score + 100) / 2}%`;
      gauge.setAttribute("aria-label", eligible ? `Net sentiment ${formatScore(score)} on a scale from minus 100 to plus 100` : `Net sentiment withheld: ${formatCount(classified)} classified judgments; at least 20 required`);

      write("[data-pw-score-description]", !eligible
        ? `${formatCount(classified)} of the 20 classified judgments required to show a score.`
        : score > 0 ? "More supportive than critical judgments in this sample."
        : score < 0 ? "More critical than supportive judgments in this sample."
        : "Supportive and critical judgments balance in this sample.");
      write("[data-pw-worked-formula]", eligible ? `= ${formatScore(score)}` : "= withheld");
      write("[data-pw-worked-counts]", eligible
        ? `100 × (${formatCount(counts.for)} − ${formatCount(counts.against)}) ÷ (${formatCount(counts.for)} + ${formatCount(counts.against)} + ${formatCount(counts.neutral)}) = ${formatScore(score)}`
        : "Net sentiment is withheld until at least 20 for + against + neutral judgments are available.");
      write("[data-pw-score-note]", eligible
        ? "Unclear judgments stay visible, but do not enter the denominator. This is net sentiment, not vote share."
        : "Unclear judgments do not count toward the 20-judgment threshold. This is a display safeguard, not a guarantee of statistical reliability.");
    }

    all("[data-pw-count]").forEach((input) => {
      input.addEventListener("input", () => {
        if (input.value !== "" && (!Number.isFinite(Number(input.value)) || Number(input.value) < 0 || Number(input.value) > 10000 || !Number.isInteger(Number(input.value)))) input.value = String(boundedCount(input));
        updateCalculator();
      });
      input.addEventListener("change", () => { input.value = String(boundedCount(input)); updateCalculator(); });
    });

    updateCalculator();
  }

  function start() { document.querySelectorAll("#process-workflow").forEach(initialize); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
