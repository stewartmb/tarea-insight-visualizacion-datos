import {LABELS} from "./math.js";
import {chartFrame, hideTooltip, moveTooltip, showTooltip} from "./chart_utils.js";

// Supporting plot: Pearson correlation between the six attributes on the
// complete cleaned dataset. It motivates the axis order of Parallel
// Coordinates (strongly related attributes are placed side by side).
export class CorrelationChart {
  constructor(container, correlations) {
    this.features = correlations.features;
    this.matrix = correlations.matrix;
    this.rows = correlations.rows;
    this.width = 600;
    this.height = 480;
    this.margin = {top: 80, right: 40, bottom: 50, left: 150};
    this.svg = chartFrame(container, this.width, this.height);
    const size = Math.min(this.width - this.margin.left - this.margin.right, this.height - this.margin.top - this.margin.bottom);
    this.band = d3.scaleBand().domain(this.features).range([0, size]).padding(0.06);
    this.color = d3.scaleSequential(d3.interpolateRdBu).domain([1, -1]);
    this.render(size);
  }

  render(size) {
    const group = this.svg.append("g").attr("transform", `translate(${this.margin.left},${this.margin.top})`);
    const cells = this.features.flatMap((row, i) => this.features.map((column, j) => ({row, column, value: this.matrix[i][j]})));
    const cell = group.selectAll("g.heat-cell").data(cells).join("g").attr("class", "heat-cell")
      .attr("transform", item => `translate(${this.band(item.column)},${this.band(item.row)})`);
    cell.append("rect")
      .attr("width", this.band.bandwidth()).attr("height", this.band.bandwidth())
      .attr("rx", 4)
      .attr("fill", item => this.color(item.value));
    cell.append("text")
      .attr("x", this.band.bandwidth() / 2).attr("y", this.band.bandwidth() / 2)
      .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
      .attr("fill", item => Math.abs(item.value) > 0.45 ? "#ffffff" : "#17222e")
      .text(item => item.value.toFixed(2));
    cell
      .on("mouseenter", (event, item) => showTooltip(`<strong>${LABELS[item.row]} × ${LABELS[item.column]}</strong><em>r de Pearson = ${item.value.toFixed(3)} · ${d3.format(",")(this.rows)} canciones</em>`))
      .on("mousemove", event => moveTooltip(event))
      .on("mouseleave", () => hideTooltip());
    group.selectAll("text.heat-row").data(this.features).join("text")
      .attr("class", "heat-row")
      .attr("x", -10).attr("y", feature => this.band(feature) + this.band.bandwidth() / 2)
      .attr("text-anchor", "end").attr("dominant-baseline", "middle")
      .text(feature => LABELS[feature]);
    group.selectAll("text.heat-column").data(this.features).join("text")
      .attr("class", "heat-column")
      .attr("transform", feature => `translate(${this.band(feature) + this.band.bandwidth() / 2},-8) rotate(-32)`)
      .attr("text-anchor", "start")
      .text(feature => LABELS[feature]);
    // Colour legend.
    const legendWidth = 180;
    const legendX = this.margin.left + (size - legendWidth) / 2;
    const legendY = this.margin.top + size + 22;
    const gradientId = "correlation-gradient";
    const gradient = this.svg.append("defs").append("linearGradient").attr("id", gradientId);
    gradient.selectAll("stop").data(d3.range(0, 1.0001, 0.1)).join("stop")
      .attr("offset", t => `${t * 100}%`).attr("stop-color", t => this.color(-1 + 2 * t));
    this.svg.append("rect").attr("x", legendX).attr("y", legendY).attr("width", legendWidth).attr("height", 10).attr("rx", 3).attr("fill", `url(#${gradientId})`);
    this.svg.append("text").attr("class", "axis-title").attr("x", legendX - 6).attr("y", legendY + 9).attr("text-anchor", "end").text("−1");
    this.svg.append("text").attr("class", "axis-title").attr("x", legendX + legendWidth + 6).attr("y", legendY + 9).text("+1");
    this.svg.append("text").attr("class", "axis-title").attr("x", legendX + legendWidth / 2).attr("y", legendY + 24).attr("text-anchor", "middle").text("correlación de Pearson");
  }
}
