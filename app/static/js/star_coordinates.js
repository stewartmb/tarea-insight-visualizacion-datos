import {FEATURES, LABELS, STAR_MAX_WEIGHT, STAR_SCALE, clamp, starPoint} from "./math.js";
import {attachPointEvents, attachSummaryEvents, chartFrame, stylePoints} from "./chart_utils.js";

export class StarCoordinatesChart {
  constructor(container, records, store) {
    this.records = records;
    this.store = store;
    this.width = 600;
    this.height = 480;
    this.center = {x: 300, y: 240};
    this.radius = 178;
    // Pixels per "axis unit": an axis with weight 1 measures this many pixels
    // and a record with value 1 on that axis alone lands on its tip.
    this.unit = this.radius * STAR_SCALE;
    this.svg = chartFrame(container, this.width, this.height);
    this.svg.append("circle").attr("cx", this.center.x).attr("cy", this.center.y).attr("r", this.radius).attr("class", "radial-guide");
    this.svg.append("circle").attr("cx", this.center.x).attr("cy", this.center.y).attr("r", this.unit).attr("class", "radial-guide radial-guide-unit");
    this.svg.append("text").attr("class", "guide-label")
      .attr("x", this.center.x + this.radius + 4).attr("y", this.center.y + this.radius - 6)
      .text("anillo interior: alcance de un eje con peso 1");
    this.axes = this.defaultAxes();
    this.axisLayer = this.svg.append("g");
    this.pointLayer = this.svg.append("g");
    this.summaryLayer = this.svg.append("g").attr("class", "summary-layer");
    this.renderAxes();
    this.points = this.pointLayer.selectAll("circle").data(records, record => record.uid).join("circle").attr("class", "data-point");
    attachPointEvents(this.points, store);
    this.updateGeometry(false);
    store.subscribe(() => this.updateStyle());
  }

  defaultAxes() {
    return Object.fromEntries(FEATURES.map((feature, index) => [feature, {angle: -Math.PI / 2 + index * Math.PI * 2 / FEATURES.length, weight: 1}]));
  }

  tip(item) {
    return {
      x: this.center.x + Math.cos(item.angle) * this.unit * item.weight,
      y: this.center.y + Math.sin(item.angle) * this.unit * item.weight
    };
  }

  renderAxes() {
    const data = FEATURES.map(feature => ({feature, ...this.axes[feature]}));
    const groups = this.axisLayer.selectAll("g.star-axis").data(data, item => item.feature).join(enter => {
      const group = enter.append("g").attr("class", "star-axis");
      group.append("line"); group.append("circle").attr("r", 9); group.append("text");
      return group;
    });
    groups.select("line")
      .attr("x1", this.center.x).attr("y1", this.center.y)
      .attr("x2", item => this.tip(item).x)
      .attr("y2", item => this.tip(item).y);
    groups.select("circle")
      .attr("cx", item => this.tip(item).x)
      .attr("cy", item => this.tip(item).y)
      .call(d3.drag().on("drag", (event, item) => {
        const [x, y] = d3.pointer(event.sourceEvent, this.svg.node());
        const dx = x - this.center.x;
        const dy = y - this.center.y;
        this.axes[item.feature] = {
          angle: Math.atan2(dy, dx),
          weight: clamp(Math.hypot(dx, dy) / this.unit, 0, STAR_MAX_WEIGHT)
        };
        this.renderAxes(); this.updateGeometry(); this.store.patch({}, "star", true);
      }));
    groups.select("text")
      .text(item => `${LABELS[item.feature]} ${item.weight.toFixed(1)}×`)
      .attr("x", item => this.center.x + Math.cos(item.angle) * (this.unit * item.weight + 16))
      .attr("y", item => this.center.y + Math.sin(item.angle) * (this.unit * item.weight + 16))
      .attr("text-anchor", item => Math.cos(item.angle) > 0.2 ? "start" : Math.cos(item.angle) < -0.2 ? "end" : "middle")
      .attr("dominant-baseline", "middle");
  }

  project(record) {
    const point = starPoint(record, this.axes);
    return {x: this.center.x + point.x * this.unit, y: this.center.y + point.y * this.unit};
  }

  updateGeometry(animate = true) {
    const positions = new Map(this.records.map(record => [record.uid, this.project(record)]));
    const target = animate ? this.points.transition().duration(180) : this.points;
    target
      .attr("cx", record => positions.get(record.uid).x)
      .attr("cy", record => positions.get(record.uid).y);
    this.updateStyle();
    this.updateSummaries();
  }

  updateStyle() { stylePoints(this.points, this.store, 3.1); }

  setSummaries(summaries = []) {
    this.summaries = summaries;
    this.updateSummaries();
  }

  updateSummaries() {
    const positioned = (this.summaries || []).map(summary => ({...summary, point: this.project(summary)}));
    const marks = this.summaryLayer.selectAll("g.summary-mark").data(positioned, summary => summary.id || summary.label).join(enter => {
      const group = enter.append("g").attr("class", "summary-mark");
      group.append("circle").attr("r", 10);
      group.append("text");
      return group;
    });
    marks.attr("transform", summary => `translate(${summary.point.x},${summary.point.y})`);
    marks.select("circle").attr("fill", summary => summary.color || "#17222e");
    marks.select("text").text(summary => summary.label).attr("dy", -14);
    attachSummaryEvents(marks);
  }

  reset() {
    this.axes = this.defaultAxes(); this.renderAxes(); this.updateGeometry();
  }
}
