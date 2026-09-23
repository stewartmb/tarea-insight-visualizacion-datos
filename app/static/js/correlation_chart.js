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
    this.cell = size / this.features.length;
    // Diverging colour scale built with d3.scaleLinear: blue (−1), white (0), red (+1).
    this.color = d3.scaleLinear().domain([-1, 0, 1]).range(["#2166ac", "#f7f7f7", "#b2182b"]);
    this.render(size);
  }

  render(size) {
    const group = this.svg.append("g").attr("transform", `translate(${this.margin.left},${this.margin.top})`);
    const cells = [];
    this.features.forEach((row, i) => {
      this.features.forEach((column, j) => cells.push({row, column, i, j, value: this.matrix[i][j]}));
    });
    const gap = 2;
    const cell = group.selectAll("g.heat-cell").data(cells).join("g").attr("class", "heat-cell")
      .attr("transform", item => `translate(${item.j * this.cell},${item.i * this.cell})`);
    cell.append("rect")
      .attr("width", this.cell - gap).attr("height", this.cell - gap)
      .attr("rx", 4)
      .attr("fill", item => this.color(item.value));
    cell.append("text")
      .attr("x", (this.cell - gap) / 2).attr("y", (this.cell - gap) / 2)
      .attr("text-anchor", "middle").attr("dominant-baseline", "middle")
      .attr("fill", item => Math.abs(item.value) > 0.45 ? "#ffffff" : "#17222e")
      .text(item => item.value.toFixed(2));
    cell
      .on("mouseenter", (event, item) => showTooltip(`<strong>${LABELS[item.row]} × ${LABELS[item.column]}</strong><em>r de Pearson = ${item.value.toFixed(3)} · ${d3.format(",")(this.rows)} canciones</em>`))
      .on("mousemove", event => moveTooltip(event))
      .on("mouseleave", () => hideTooltip());
    group.selectAll("text.heat-row").data(this.features).join("text")
      .attr("class", "heat-row")
      .attr("x", -10).attr("y", (feature, i) => i * this.cell + (this.cell - gap) / 2)
      .attr("text-anchor", "end").attr("dominant-baseline", "middle")
      .text(feature => LABELS[feature]);
    group.selectAll("text.heat-column").data(this.features).join("text")
      .attr("class", "heat-column")
      .attr("transform", (feature, i) => `translate(${i * this.cell + (this.cell - gap) / 2},-8) rotate(-32)`)
      .attr("text-anchor", "start")
      .text(feature => LABELS[feature]);
    // Colour legend: a row of small rectangles coloured with the same scale.
    const steps = d3.range(-1, 1.001, 0.1);
    const stepWidth = 18;
    const legendX = this.margin.left + (size - steps.length * stepWidth) / 2;
    const legendY = this.margin.top + size + 22;
    this.svg.selectAll("rect.legend-step").data(steps).join("rect")
      .attr("class", "legend-step")
      .attr("x", (value, i) => legendX + i * stepWidth).attr("y", legendY)
      .attr("width", stepWidth).attr("height", 10)
      .attr("fill", value => this.color(value));
    this.svg.append("text").attr("class", "axis-title").attr("x", legendX - 6).attr("y", legendY + 9).attr("text-anchor", "end").text("−1");
    this.svg.append("text").attr("class", "axis-title").attr("x", legendX + steps.length * stepWidth + 6).attr("y", legendY + 9).text("+1");
    this.svg.append("text").attr("class", "axis-title").attr("x", legendX + steps.length * stepWidth / 2).attr("y", legendY + 24).attr("text-anchor", "middle").text("correlación de Pearson");
  }
}
