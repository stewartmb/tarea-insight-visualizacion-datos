import {attachPointEvents, chartFrame, stylePoints} from "./chart_utils.js";

export class MDSChart {
  constructor(container, records, store) {
    this.records = records;
    this.store = store;
    const width = 600, height = 480;
    const margin = {top: 24, right: 28, bottom: 46, left: 52};
    this.svg = chartFrame(container, width, height);
    const maxAbs = d3.max(records.flatMap(record => record.mds.map(Math.abs))) || 1;
    const domain = [-maxAbs, maxAbs];
    this.x = d3.scaleLinear().domain(domain).range([margin.left, width - margin.right]);
    this.y = d3.scaleLinear().domain(domain).range([height - margin.bottom, margin.top]);
    this.svg.append("g").attr("class", "axis subtle-axis").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(this.x).ticks(5));
    this.svg.append("g").attr("class", "axis subtle-axis").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(this.y).ticks(5));
    this.svg.append("text").attr("class", "axis-title").attr("x", width / 2).attr("y", height - 9).attr("text-anchor", "middle").text("Dimensión MDS 1");
    this.svg.append("text").attr("class", "axis-title").attr("transform", "rotate(-90)").attr("x", -height / 2).attr("y", 15).attr("text-anchor", "middle").text("Dimensión MDS 2");
    this.points = this.svg.append("g").selectAll("circle").data(records, record => record.uid).join("circle")
      .attr("class", "data-point")
      .attr("cx", record => this.x(record.mds[0]))
      .attr("cy", record => this.y(record.mds[1]));
    attachPointEvents(this.points, store);
    this.updateStyle();
    store.subscribe(() => this.updateStyle());
  }

  updateStyle() { stylePoints(this.points, this.store, 3.2); }
}
