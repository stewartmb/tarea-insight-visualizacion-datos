import {FEATURES, LABELS, clamp} from "./math.js";
import {attachPointEvents, attachSummaryEvents, chartFrame, spreadLabels} from "./chart_utils.js";

export const SCALE_MODES = {
  normalized: "Normalizada 0–1 (rangos del dataset completo)",
  percentile: "Percentil dentro de la muestra (0–100 %)"
};

export class ParallelCoordinatesChart {
  constructor(container, records, store) {
    this.records = records;
    this.store = store;
    this.width = 1120;
    this.height = 500;
    this.margin = {top: 66, right: 150, bottom: 30, left: 34};
    this.dimensions = [...FEATURES];
    this.dragPositions = {};
    this.activeRanges = new Map();
    this.suppressBrushEvents = false;
    this.scaleMode = "normalized";
    this.inverted = new Set();
    // Values of the sample per feature, used by the percentile (rank) scale.
    this.sampleValues = Object.fromEntries(FEATURES.map(feature => [feature, records.map(record => record.original[feature])]));
    this.svg = chartFrame(container, this.width, this.height);
    this.x = d3.scalePoint().domain(this.dimensions).range([this.margin.left, this.width - this.margin.right]).padding(0.25);
    this.y = {};
    this.buildScales();
    this.line = d3.line();
    this.pathLayer = this.svg.append("g").attr("class", "parallel-paths");
    this.summaryLayer = this.svg.append("g").attr("class", "parallel-summaries");
    this.paths = this.pathLayer.selectAll("path").data(records, record => record.uid).join("path").attr("class", "profile-line").attr("d", record => this.path(record));
    attachPointEvents(this.paths, store);
    this.axisLayer = this.svg.append("g").attr("class", "parallel-axes");
    this.renderAxes();
    this.updateStyle();
    store.subscribe((state, reason) => {
      if (reason === "replay") this.clearBrushes();
      this.updateStyle();
      this.updateSummaryStyle();
    });
  }

  // ----- scaling -----------------------------------------------------------
  // Percentile rank of a value inside the sample (ties share the mid rank).
  percentileRank(feature, value) {
    const values = this.sampleValues[feature];
    const below = values.filter(other => other < value).length;
    const equal = values.filter(other => other === value).length;
    return (below + equal / 2) / values.length;
  }

  value(record, feature) {
    return this.scaleMode === "percentile" ? this.percentileRank(feature, record.original[feature]) : record.normalized[feature];
  }

  tickFormat() {
    return this.scaleMode === "percentile" ? d3.format(".0%") : d3.format(".2f");
  }

  buildScales() {
    for (const feature of FEATURES) {
      const range = [this.height - this.margin.bottom, this.margin.top];
      this.y[feature] = d3.scaleLinear().domain([0, 1]).range(this.inverted.has(feature) ? [...range].reverse() : range);
    }
  }

  setScaleMode(mode) {
    if (!SCALE_MODES[mode] || mode === this.scaleMode) return;
    this.scaleMode = mode;
    this.clearBrushes();
    this.buildScales();
    this.redraw(true);
  }

  toggleInvert(feature) {
    if (this.inverted.has(feature)) this.inverted.delete(feature); else this.inverted.add(feature);
    this.clearBrushes();
    this.buildScales();
    this.redraw(true);
    this.store.patch({}, "parallel-invert", true);
  }

  redraw(animate = false) {
    const self = this;
    this.axes.select(".dimension-axis").each(function(feature) {
      const axis = d3.axisLeft(self.y[feature]).ticks(5).tickFormat(self.tickFormat());
      const selection = d3.select(this);
      (animate ? selection.transition().duration(220) : selection).call(axis);
    });
    this.axes.select(".dimension-invert").classed("active", feature => this.inverted.has(feature));
    this.axes.select(".dimension-label").text(feature => `${LABELS[feature]}${this.inverted.has(feature) ? " ↓" : ""}`);
    (animate ? this.paths.transition().duration(220) : this.paths).attr("d", record => this.path(record));
    this.updateSummaries(animate);
  }

  // ----- geometry ----------------------------------------------------------
  position(feature) {
    return this.dragPositions[feature] ?? this.x(feature);
  }

  path(record) {
    return this.line(this.dimensions.map(feature => [this.position(feature), this.y[feature](this.value(record, feature))]));
  }

  setDimensions(dimensions) {
    this.dimensions = [...dimensions];
    this.x.domain(this.dimensions);
    // Applied without a transition: a pending transition would otherwise move
    // the axes back to their previous positions after this order is set.
    this.axes.attr("transform", feature => `translate(${this.x(feature)},0)`);
    this.paths.attr("d", record => this.path(record));
    this.updateSummaries();
  }

  // ----- summaries (reference profiles drawn as dashed lines) ----------------
  setSummaries(summaries = []) {
    this.summaries = summaries;
    this.updateSummaries();
  }

  labelDimension(summaries) {
    // Put labels on the axis where the reference profiles are most spread out.
    let best = {feature: this.dimensions[this.dimensions.length - 1], spread: -1};
    if (summaries.length < 2) return best.feature;
    this.dimensions.forEach(feature => {
      const [low, high] = d3.extent(summaries, summary => this.value(summary, feature));
      if (high - low > best.spread) best = {feature, spread: high - low};
    });
    return best.feature;
  }

  updateSummaries(animate = false) {
    const summaries = (this.summaries || []).filter(summary => this.dimensions.every(feature => Number.isFinite(this.value(summary, feature))));
    const lines = this.summaryLayer.selectAll("path.summary-line").data(summaries, summary => summary.id || summary.label).join("path").attr("class", "summary-line");
    (animate ? lines.transition().duration(220) : lines)
      .attr("d", summary => this.path(summary))
      .attr("stroke", summary => summary.color || "#17222e")
      .attr("stroke-width", summary => summary.width || 2.6)
      .attr("stroke-dasharray", "7 5")
      .attr("stroke-opacity", .95);
    attachSummaryEvents(lines, summary => {
      if (Number.isFinite(summary.decade)) this.store.toggleDecade(summary.decade);
    });
    const feature = this.labelDimension(summaries);
    const placements = summaries.map(summary => ({summary, y: this.y[feature](this.value(summary, feature))}));
    spreadLabels(placements, 13, this.margin.top - 4, this.height - this.margin.bottom + 4);
    const anchorX = this.position(feature);
    const rightmost = anchorX >= this.position(this.dimensions[this.dimensions.length - 1]) - 1;
    const labels = this.summaryLayer.selectAll("text.summary-label").data(placements, item => item.summary.id || item.summary.label).join("text").attr("class", "summary-label");
    (animate ? labels.transition().duration(220) : labels)
      .attr("x", anchorX + (rightmost ? 10 : 8))
      .attr("y", item => item.y)
      .attr("fill", item => item.summary.color || "#17222e")
      .text(item => item.summary.label);
    this.updateSummaryStyle();
  }

  updateSummaryStyle() {
    const focus = this.store.state.focusDecade;
    const dim = summary => focus !== null && Number.isFinite(summary.decade) && summary.decade !== focus;
    this.summaryLayer.selectAll("path.summary-line").classed("is-dim", dim).classed("is-focus", summary => focus !== null && summary.decade === focus);
    this.summaryLayer.selectAll("text.summary-label").classed("is-dim", item => dim(item.summary));
  }

  // ----- axes, reordering, inversion and brushing ----------------------------
  renderAxes() {
    const self = this;
    this.axes = this.axisLayer.selectAll("g.dimension").data(FEATURES, feature => feature).join(enter => {
      const group = enter.append("g").attr("class", "dimension");
      group.append("g").attr("class", "dimension-axis");
      group.append("text").attr("class", "dimension-label").attr("y", this.margin.top - 24).attr("text-anchor", "middle");
      group.append("text").attr("class", "dimension-invert").attr("y", this.margin.top - 44).attr("text-anchor", "middle").text("⇅")
        .append("title").text("Invertir este eje");
      group.append("g").attr("class", "dimension-brush");
      return group;
    }).attr("transform", feature => `translate(${this.x(feature)},0)`);

    this.axes.select(".dimension-axis").each(function(feature) {
      d3.select(this).call(d3.axisLeft(self.y[feature]).ticks(5).tickFormat(self.tickFormat()));
    });
    this.axes.select(".dimension-invert").on("click", (event, feature) => {
      event.stopPropagation();
      this.toggleInvert(feature);
    });
    this.axes.select(".dimension-label")
      .text(feature => LABELS[feature])
      .call(d3.drag()
        .on("start", (event, feature) => { this.dragPositions[feature] = this.x(feature); })
        .on("drag", (event, feature) => {
          // Pointer position in the SVG coordinate system: the dragged group moves
          // with the pointer, so its own coordinate system cannot be used.
          const [pointerX] = d3.pointer(event.sourceEvent, this.svg.node());
          this.dragPositions[feature] = clamp(pointerX, this.margin.left, this.width - this.margin.right);
          this.dimensions.sort((a, b) => this.position(a) - this.position(b));
          this.x.domain(this.dimensions);
          this.axes.attr("transform", item => `translate(${this.position(item)},0)`);
          this.paths.attr("d", record => this.path(record));
          this.updateSummaries();
        })
        .on("end", (event, feature) => {
          delete this.dragPositions[feature];
          this.axes.transition().duration(180).attr("transform", item => `translate(${this.x(item)},0)`);
          this.paths.transition().duration(180).attr("d", record => this.path(record));
          this.updateSummaries(true);
          this.store.patch({}, "parallel-order", true);
        }));

    this.brushes = {};
    this.axes.select(".dimension-brush").each(function(feature) {
      const brush = d3.brushY()
        .extent([[-13, self.margin.top], [13, self.height - self.margin.bottom]])
        .on("brush end", event => self.onBrush(feature, event.selection));
      self.brushes[feature] = brush;
      d3.select(this).call(brush);
    });
  }

  onBrush(feature, selection) {
    if (this.suppressBrushEvents) return;
    if (selection) {
      const values = selection.map(this.y[feature].invert).sort(d3.ascending);
      this.activeRanges.set(feature, values);
    } else {
      this.activeRanges.delete(feature);
    }
    if (!this.activeRanges.size) {
      this.store.patch({brushedIds: null}, "brush", true);
      return;
    }
    const ids = new Set(this.records.filter(record => {
      for (const [dimension, [minimum, maximum]] of this.activeRanges) {
        const value = this.value(record, dimension);
        if (value < minimum || value > maximum) return false;
      }
      return true;
    }).map(record => record.uid));
    this.store.patch({brushedIds: ids}, "brush", true);
  }

  brushedCount() {
    return this.store.state.brushedIds ? this.store.state.brushedIds.size : null;
  }

  updateStyle() {
    const hasSummaries = (this.summaries || []).length > 0;
    const state = this.store.state;
    this.paths
      .attr("stroke", record => this.store.color(record))
      .attr("stroke-opacity", record => {
        if (record.uid === state.selectedId || record.uid === state.hoverId) return 1;
        if (state.taskId === "task4" && state.focusDecade !== null) return record.decade === state.focusDecade ? 0.5 : 0.02;
        if (state.brushedIds && !state.brushedIds.has(record.uid)) return 0.02;
        if (!state.focusIds.has(record.uid)) return 0.05;
        return hasSummaries ? Math.min(0.16, this.store.opacity(record) * 0.18) : Math.min(0.58, this.store.opacity(record) * 0.46);
      })
      .attr("stroke-width", record => record.uid === state.selectedId ? 3.2 : record.uid === state.hoverId ? 2.5 : hasSummaries ? 0.75 : 1.05);
  }

  clearBrushes() {
    this.suppressBrushEvents = true;
    this.activeRanges.clear();
    for (const feature of FEATURES) {
      this.axes.filter(item => item === feature).select(".dimension-brush").call(this.brushes[feature].move, null);
    }
    this.suppressBrushEvents = false;
  }

  reset() {
    this.dimensions = [...FEATURES];
    this.x.domain(this.dimensions);
    this.inverted.clear();
    this.scaleMode = "normalized";
    this.buildScales();
    this.clearBrushes();
    this.axes.attr("transform", feature => `translate(${this.x(feature)},0)`);
    this.redraw(false);
  }
}
