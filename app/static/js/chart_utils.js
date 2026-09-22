import {FEATURES, LABELS} from "./math.js";

export function tooltipHtml(record) {
  const values = FEATURES.map(feature => `<span>${LABELS[feature]}: <strong>${record.original[feature].toFixed(3)}</strong></span>`).join("");
  return `<strong>${escapeHtml(record.name)}</strong><em>${escapeHtml(record.artist)} · ${record.year || "año n/d"}</em><div>${values}</div>`;
}

export function attachPointEvents(selection, store) {
  const tooltip = d3.select("#tooltip");
  selection
    .on("mouseenter", (event, record) => {
      store.hover(record.uid);
      tooltip.html(tooltipHtml(record)).classed("visible", true);
    })
    .on("mousemove", event => {
      tooltip.style("left", `${event.clientX + 16}px`).style("top", `${event.clientY + 14}px`);
    })
    .on("mouseleave", () => {
      store.hover(null);
      tooltip.classed("visible", false);
    })
    .on("click", (event, record) => {
      event.stopPropagation();
      store.select(record.uid);
    });
}

export function stylePoints(selection, store, baseRadius = 3) {
  selection
    .attr("display", record => store.state.focusIds.has(record.uid) ? null : "none")
    .attr("fill", record => store.color(record))
    .attr("fill-opacity", record => store.opacity(record))
    .attr("r", record => store.radius(record, baseRadius))
    .attr("stroke", record => record.uid === store.state.selectedId ? "#221b34" : "#ffffff")
    .attr("stroke-width", record => record.uid === store.state.selectedId ? 2 : 0.6)
    .classed("is-hovered", record => record.uid === store.state.hoverId);
}

export function chartFrame(container, width = 600, height = 480) {
  return d3.select(container).append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img")
    .attr("preserveAspectRatio", "xMidYMid meet");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[character]));
}
