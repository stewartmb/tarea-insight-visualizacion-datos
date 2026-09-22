import {FEATURES, LABELS, radvizPoint} from "./math.js";
import {attachPointEvents, chartFrame, stylePoints} from "./chart_utils.js";

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
    this.renderAnchors();
    this.points = this.pointLayer.selectAll("circle").data(records, record => record.uid).join("circle").attr("class", "data-point");
    attachPointEvents(this.points, store);
    this.updateGeometry(false);
    store.subscribe(() => this.updateStyle());
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

  updateGeometry(animate = true) {
    const positioned = new Map(this.records.map(record => [record.uid, radvizPoint(record, this.anchors)]));
    const target = animate ? this.points.transition().duration(180) : this.points;
    target
      .attr("cx", record => {
        const point = positioned.get(record.uid);
        return point ? this.center.x + point.x * this.radius : this.center.x;
      })
      .attr("cy", record => {
        const point = positioned.get(record.uid);
        return point ? this.center.y + point.y * this.radius : this.center.y;
      });
    this.points.attr("display", record => positioned.get(record.uid) ? null : "none");
    this.updateStyle();
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
