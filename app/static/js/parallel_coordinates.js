import {FEATURES, LABELS, clamp} from "./math.js";
import {attachPointEvents, chartFrame} from "./chart_utils.js";

export class ParallelCoordinatesChart {
  constructor(container, records, store) {
    this.records = records;
    this.store = store;
    this.width = 1120;
    this.height = 500;
    this.margin = {top: 62, right: 34, bottom: 30, left: 34};
    this.dimensions = [...FEATURES];
    this.dragPositions = {};
    this.activeRanges = new Map();
    this.suppressBrushEvents = false;
    this.svg = chartFrame(container, this.width, this.height);
    this.x = d3.scalePoint().domain(this.dimensions).range([this.margin.left, this.width - this.margin.right]).padding(0.25);
    this.y = Object.fromEntries(FEATURES.map(feature => [feature, d3.scaleLinear().domain([0, 1]).range([this.height - this.margin.bottom, this.margin.top])]));
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
    });
  }

  position(feature) {
    return this.dragPositions[feature] ?? this.x(feature);
  }

  path(record) {
    return this.line(this.dimensions.map(feature => [this.position(feature), this.y[feature](record.normalized[feature])]));
  }

  setDimensions(dimensions) {
    this.dimensions = [...dimensions];
    this.x.domain(this.dimensions);
    this.renderAxes();
    this.paths.attr("d", record => this.path(record));
    this.updateSummaries();
  }

  setSummaries(summaries = []) {
    this.summaries = summaries;
    this.updateSummaries();
  }

  updateSummaries() {
    const summaries = this.summaries || [];
    const halos = this.summaryLayer.selectAll("path.summary-halo").data(summaries, summary => summary.id || summary.label).join("path").attr("class", "summary-halo");
    halos.attr("d", summary => this.path(summary));
    const lines = this.summaryLayer.selectAll("path.summary-line").data(summaries, summary => summary.id || summary.label).join("path").attr("class", "summary-line");
    lines.attr("d", summary => this.path(summary))
      .attr("stroke", summary => summary.color || "#17222e")
      .attr("stroke-width", 2.6)
      .attr("stroke-dasharray", "7 5")
      .attr("stroke-opacity", .95);
    const labels = this.summaryLayer.selectAll("text.summary-label").data(summaries, summary => summary.id || summary.label).join("text").attr("class", "summary-label");
    labels
      .attr("x", summary => this.position(this.dimensions.at(-1)) + 9)
      .attr("y", summary => this.y[this.dimensions.at(-1)](summary.normalized[this.dimensions.at(-1)]))
      .attr("fill", summary => summary.color || "#17222e")
      .text(summary => `${summary.label} · mediana`);
  }

  renderAxes() {
    const self = this;
    this.axes = this.axisLayer.selectAll("g.dimension").data(FEATURES, feature => feature).join(enter => {
      const group = enter.append("g").attr("class", "dimension");
      group.append("g").attr("class", "dimension-axis");
      group.append("text").attr("class", "dimension-label").attr("y", this.margin.top - 27).attr("text-anchor", "middle");
      group.append("g").attr("class", "dimension-brush");
      return group;
    }).attr("transform", feature => `translate(${this.x(feature)},0)`);

    this.axes.select(".dimension-axis").each(function(feature) {
      d3.select(this).call(d3.axisLeft(self.y[feature]).ticks(5).tickFormat(d3.format(".1f")));
    });
    this.axes.select(".dimension-label")
      .text(feature => LABELS[feature])
      .call(d3.drag()
        .on("start", (event, feature) => { this.dragPositions[feature] = this.x(feature); })
        .on("drag", (event, feature) => {
          this.dragPositions[feature] = clamp(event.x, this.margin.left, this.width - this.margin.right);
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
          this.updateSummaries();
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
        const value = record.normalized[dimension];
        if (value < minimum || value > maximum) return false;
      }
      return true;
    }).map(record => record.uid));
    this.store.patch({brushedIds: ids}, "brush", true);
  }

  updateStyle() {
    const hasSummaries = (this.summaries || []).length > 0;
    this.paths
      .attr("display", record => this.store.state.focusIds.has(record.uid) ? null : "none")
      .attr("stroke", record => this.store.color(record))
      .attr("stroke-opacity", record => {
        if (record.uid === this.store.state.selectedId || record.uid === this.store.state.hoverId) return 1;
        return hasSummaries ? Math.min(0.16, this.store.opacity(record) * 0.18) : Math.min(0.58, this.store.opacity(record) * 0.46);
      })
      .attr("stroke-width", record => record.uid === this.store.state.selectedId ? 3.2 : record.uid === this.store.state.hoverId ? 2.5 : hasSummaries ? 0.75 : 1.05);
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
    this.clearBrushes();
    this.axes.transition().duration(180).attr("transform", feature => `translate(${this.x(feature)},0)`);
    this.paths.transition().duration(180).attr("d", record => this.path(record));
  }
}
