import {FEATURES, LABELS, radvizPoint} from "./math.js";
import {attachPointEvents, attachSummaryEvents, chartFrame, stylePoints} from "./chart_utils.js";

const SERIES_STYLE = {
  popular: {radius: 5.6, fill: summary => summary.color, stroke: "#17222e", strokeWidth: 1.4, label: true},
  all: {radius: 3.4, fill: () => "#ffffff", stroke: "#6b7b80", strokeWidth: 1.4, label: false},
  target: {radius: 6.2, fill: summary => summary.color, stroke: "#ffffff", strokeWidth: 1.6, label: true}
};

export class RadVizChart {
  constructor(container, records, store) {
    this.records = records;
    this.store = store;
    this.width = 600;
    this.height = 480;
    this.center = {x: 300, y: 240};
    this.radius = 176;
    this.svg = chartFrame(container, this.width, this.height).on("click", () => store.hover(null));
    this.group = this.svg.append("g");
    this.group.append("circle")
      .attr("cx", this.center.x).attr("cy", this.center.y).attr("r", this.radius)
      .attr("class", "radial-boundary");
    this.anchors = this.defaultAnchors();
    this.anchorLayer = this.group.append("g").attr("class", "anchor-layer");
    this.pointLayer = this.group.append("g").attr("class", "point-layer");
    this.trajectoryLayer = this.group.append("g").attr("class", "trajectory-layer");
    this.summaryLayer = this.group.append("g").attr("class", "summary-layer");
    this.renderAnchors();
    this.points = this.pointLayer.selectAll("circle").data(records, record => record.uid).join("circle").attr("class", "data-point");
    attachPointEvents(this.points, store);
    this.updateGeometry(false);
    store.subscribe(() => { this.updateStyle(); this.updateSummaryStyle(); });
  }

  defaultAnchors() {
    return Object.fromEntries(FEATURES.map((feature, index) => {
      const angle = -Math.PI / 2 + index * Math.PI * 2 / FEATURES.length;
      return [feature, {angle, x: Math.cos(angle), y: Math.sin(angle)}];
    }));
  }

  renderAnchors() {
    const anchorData = FEATURES.map(feature => ({feature, ...this.anchors[feature]}));
    const groups = this.anchorLayer.selectAll("g.anchor").data(anchorData, item => item.feature).join(enter => {
      const group = enter.append("g").attr("class", "anchor");
      group.append("line");
      group.append("circle").attr("r", 8).attr("tabindex", 0);
      group.append("text");
      return group;
    });
    groups.select("line")
      .attr("x1", this.center.x).attr("y1", this.center.y)
      .attr("x2", item => this.center.x + item.x * this.radius)
      .attr("y2", item => this.center.y + item.y * this.radius);
    groups.select("circle")
      .attr("cx", item => this.center.x + item.x * this.radius)
      .attr("cy", item => this.center.y + item.y * this.radius)
      .call(d3.drag().on("drag", (event, item) => {
        const [x, y] = d3.pointer(event.sourceEvent, this.svg.node());
        const angle = Math.atan2(y - this.center.y, x - this.center.x);
        this.anchors[item.feature] = {angle, x: Math.cos(angle), y: Math.sin(angle)};
        this.renderAnchors();
        this.updateGeometry();
        this.store.patch({}, "radviz", true);
      }));
    groups.select("text")
      .text(item => LABELS[item.feature])
      .attr("x", item => this.center.x + item.x * (this.radius + 19))
      .attr("y", item => this.center.y + item.y * (this.radius + 19))
      .attr("text-anchor", item => item.x > 0.25 ? "start" : item.x < -0.25 ? "end" : "middle")
      .attr("dominant-baseline", "middle");
  }

  project(point) {
    return {x: this.center.x + point.x * this.radius, y: this.center.y + point.y * this.radius};
  }

  updateGeometry(animate = true) {
    const positioned = new Map(this.records.map(record => [record.uid, radvizPoint(record, this.anchors)]));
    const target = animate ? this.points.transition().duration(180) : this.points;
    target
      .attr("cx", record => {
        const point = positioned.get(record.uid);
        return point ? this.project(point).x : this.center.x;
      })
      .attr("cy", record => {
        const point = positioned.get(record.uid);
        return point ? this.project(point).y : this.center.y;
      });
    this.points.attr("display", record => positioned.get(record.uid) ? null : "none");
    this.updateStyle();
    this.updateSummaries();
  }

  // summaries: {id, label, color, series: popular|all|target, order, decade?, normalized, original?, count?}
  setSummaries(summaries = []) {
    this.summaries = summaries;
    this.updateSummaries();
  }

  updateSummaries() {
    const summaries = (this.summaries || [])
      .map(summary => ({...summary, series: summary.series || "target", point: radvizPoint(summary, this.anchors)}))
      .filter(summary => summary.point)
      .map(summary => ({...summary, pixel: this.project(summary.point)}));

    // One trajectory per ordered series (chronological decades).
    const grouped = {};
    summaries.forEach(summary => {
      if (!Number.isFinite(summary.order)) return;
      if (!grouped[summary.series]) grouped[summary.series] = [];
      grouped[summary.series].push(summary);
    });
    const bySeries = Object.keys(grouped)
      .map(series => ({series, items: grouped[series].sort((a, b) => a.order - b.order)}))
      .filter(group => group.items.length > 1);
    const line = d3.line().x(item => item.pixel.x).y(item => item.pixel.y);
    this.trajectoryLayer.selectAll("path.trajectory").data(bySeries, group => group.series).join("path")
      .attr("class", group => `trajectory trajectory-${group.series}`)
      .attr("d", group => line(group.items));

    // Labels: always the first and the last decade; the rest only when there is room.
    const labelled = new Set();
    for (const group of bySeries) {
      if (!SERIES_STYLE[group.series]?.label) continue;
      let last = null;
      group.items.forEach((item, index) => {
        const isEnd = index === 0 || index === group.items.length - 1;
        const far = !last || Math.hypot(item.pixel.x - last.pixel.x, item.pixel.y - last.pixel.y) >= 26;
        if (isEnd || far) { labelled.add(item.id); last = item; }
      });
    }
    for (const summary of summaries) {
      if (!Number.isFinite(summary.order) && SERIES_STYLE[summary.series]?.label) labelled.add(summary.id);
    }

    const marks = this.summaryLayer.selectAll("g.summary-mark").data(summaries, summary => summary.id || summary.label).join(enter => {
      const group = enter.append("g").attr("class", "summary-mark");
      group.append("circle");
      group.append("text");
      return group;
    });
    marks
      .attr("class", summary => `summary-mark summary-${summary.series}`)
      .attr("transform", summary => `translate(${summary.pixel.x},${summary.pixel.y})`)
      .style("pointer-events", "all");
    marks.select("circle")
      .attr("r", summary => SERIES_STYLE[summary.series].radius)
      .attr("fill", summary => SERIES_STYLE[summary.series].fill(summary))
      .attr("stroke", summary => SERIES_STYLE[summary.series].stroke === "#6b7b80" ? (summary.color || "#6b7b80") : SERIES_STYLE[summary.series].stroke)
      .attr("stroke-width", summary => SERIES_STYLE[summary.series].strokeWidth);
    // Push each label outwards, away from the centre, so it does not sit on the trajectory.
    const direction = summary => {
      const dx = summary.pixel.x - this.center.x, dy = summary.pixel.y - this.center.y;
      const length = Math.hypot(dx, dy) || 1;
      return {x: dx / length, y: dy / length, offset: SERIES_STYLE[summary.series].radius + 9};
    };
    marks.select("text")
      .text(summary => labelled.has(summary.id) ? summary.label : "")
      .attr("x", summary => direction(summary).x * direction(summary).offset)
      .attr("y", summary => direction(summary).y * direction(summary).offset)
      .attr("text-anchor", summary => direction(summary).x > 0.3 ? "start" : direction(summary).x < -0.3 ? "end" : "middle")
      .attr("dominant-baseline", summary => direction(summary).y > 0.3 ? "hanging" : direction(summary).y < -0.3 ? "auto" : "middle");
    attachSummaryEvents(marks, summary => {
      if (Number.isFinite(summary.decade)) this.store.toggleDecade(summary.decade);
    });
    this.updateSummaryStyle();
  }

  updateSummaryStyle() {
    const focus = this.store.state.focusDecade;
    this.summaryLayer.selectAll("g.summary-mark")
      .classed("is-dim", summary => focus !== null && Number.isFinite(summary.decade) && summary.decade !== focus)
      .classed("is-focus", summary => focus !== null && summary.decade === focus);
  }

  updateStyle() {
    stylePoints(this.points, this.store, 3.1);
  }

  reset() {
    this.anchors = this.defaultAnchors();
    this.renderAnchors();
    this.updateGeometry();
  }
}
