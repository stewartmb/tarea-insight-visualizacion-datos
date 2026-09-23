import {FEATURES, LABELS} from "./math.js";

export function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[character]));
}

export function tooltipHtml(record) {
  const values = FEATURES.map(feature => `<span>${LABELS[feature]}: <strong>${record.original[feature].toFixed(3)}</strong></span>`).join("");
  const popularity = Number.isFinite(record.popularity) ? ` · popularidad ${record.popularity.toFixed(0)}` : "";
  return `<strong>${escapeHtml(record.name)}</strong><em>${escapeHtml(record.artist)} · ${record.year || "año n/d"}${popularity}</em><div>${values}</div>`;
}

export function summaryTooltipHtml(summary) {
  const source = summary.original || summary.normalized || {};
  const values = FEATURES.filter(feature => Number.isFinite(source[feature]))
    .map(feature => `<span>${LABELS[feature]}: <strong>${source[feature].toFixed(3)}</strong></span>`).join("");
  const count = Number.isFinite(summary.count) ? `<em>mediana de ${d3.format(",")(summary.count)} canciones</em>` : "";
  return `<strong>${escapeHtml(summary.label)}</strong>${count}<div>${values}</div>`;
}

const tooltip = () => d3.select("#tooltip");

export function showTooltip(html) {
  tooltip().html(html).classed("visible", true);
}

export function moveTooltip(event) {
  const node = tooltip().node();
  const width = node ? node.offsetWidth : 0;
  const left = event.clientX + 16 + width > window.innerWidth ? event.clientX - width - 12 : event.clientX + 16;
  tooltip().style("left", `${Math.max(8, left)}px`).style("top", `${event.clientY + 14}px`);
}

export function hideTooltip() {
  tooltip().classed("visible", false);
}

export function attachPointEvents(selection, store) {
  selection
    .on("mouseenter", (event, record) => {
      store.hover(record.uid);
      showTooltip(tooltipHtml(record));
    })
    .on("mousemove", event => moveTooltip(event))
    .on("mouseleave", () => {
      store.hover(null);
      hideTooltip();
    })
    .on("click", (event, record) => {
      event.stopPropagation();
      store.select(record.uid);
    });
}

export function attachSummaryEvents(selection, onClick = null) {
  selection
    .on("mouseenter", (event, summary) => showTooltip(summaryTooltipHtml(summary)))
    .on("mousemove", event => moveTooltip(event))
    .on("mouseleave", () => hideTooltip())
    .on("click", (event, summary) => {
      event.stopPropagation();
      if (onClick) onClick(summary);
    });
}

export function stylePoints(selection, store, baseRadius = 3) {
  const state = store.state;
  const inFocus = record => state.focusIds.has(record.uid) || record.uid === state.selectedId || record.uid === state.hoverId;
  selection
    .attr("fill", record => store.color(record))
    .attr("fill-opacity", record => store.opacity(record))
    .attr("r", record => inFocus(record) ? store.radius(record, baseRadius) : baseRadius - 0.9)
    .attr("stroke", record => record.uid === state.selectedId ? "#221b34" : "#ffffff")
    .attr("stroke-width", record => record.uid === state.selectedId ? 2 : inFocus(record) ? 0.6 : 0)
    .classed("is-hovered", record => record.uid === state.hoverId)
    .classed("is-context", record => !inFocus(record));
  // Draw the focused records above the context.
  selection.filter(record => inFocus(record)).raise();
}

export function chartFrame(container, width = 600, height = 480) {
  return d3.select(container).append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img")
    .attr("preserveAspectRatio", "xMidYMid meet");
}

// Push labels apart vertically so that none overlap (items need a mutable `y`).
export function spreadLabels(items, minimumGap = 12, lower = -Infinity, upper = Infinity) {
  const sorted = [...items].sort((a, b) => a.y - b.y);
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i].y - sorted[i - 1].y < minimumGap) sorted[i].y = sorted[i - 1].y + minimumGap;
  }
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    if (sorted[i].y > upper) sorted[i].y = upper;
    if (i < sorted.length - 1 && sorted[i + 1].y - sorted[i].y < minimumGap) sorted[i].y = sorted[i + 1].y - minimumGap;
  }
  for (const item of sorted) item.y = Math.max(lower, item.y);
  return items;
}
