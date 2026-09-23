import {FEATURES, LABELS} from "./math.js";
import {chartFrame, hideTooltip, moveTooltip, showTooltip, spreadLabels} from "./chart_utils.js";

// One colour per audio attribute (nominal encoding used only in this chart).
export const FEATURE_COLORS = {
  energy: "#e4572e",
  valence: "#f3a712",
  danceability: "#1b998b",
  acousticness: "#2e5eaa",
  instrumentalness: "#7d5ba6",
  speechiness: "#5c6b73"
};

// Supporting plot for Task 4: median of each attribute per decade, for the
// top 25 % most popular songs (solid) and for every song of the decade (dashed).
export class EvolutionChart {
  constructor(container, decades, store) {
    this.decades = decades;
    this.store = store;
    this.width = 600;
    this.height = 480;
    this.margin = {top: 26, right: 128, bottom: 46, left: 44};
    this.svg = chartFrame(container, this.width, this.height);
    this.x = d3.scalePoint().domain(decades.map(item => item.label)).range([this.margin.left, this.width - this.margin.right]).padding(0.35);
    this.y = d3.scaleLinear().domain([0, 1]).range([this.height - this.margin.bottom, this.margin.top]);
    this.focusLayer = this.svg.append("g");
    this.svg.append("g").attr("class", "axis subtle-axis").attr("transform", `translate(0,${this.height - this.margin.bottom})`)
      .call(d3.axisBottom(this.x));
    this.svg.append("g").attr("class", "axis subtle-axis").attr("transform", `translate(${this.margin.left},0)`)
      .call(d3.axisLeft(this.y).ticks(5).tickFormat(d3.format(".1f")));
    this.svg.append("text").attr("class", "axis-title").attr("x", this.width / 2).attr("y", this.height - 8).attr("text-anchor", "middle")
      .text("Década (dataset limpio completo)");
    this.svg.append("text").attr("class", "axis-title").attr("transform", "rotate(-90)").attr("x", -this.height / 2).attr("y", 13).attr("text-anchor", "middle")
      .text("Mediana del atributo (unidades originales 0–1)");
    this.series = FEATURES.map(feature => ({
      feature,
      color: FEATURE_COLORS[feature],
      popular: decades.map(item => ({decade: item, value: item.popular_profile.original[feature]})),
      all: decades.map(item => ({decade: item, value: item.profile.original[feature]}))
    }));
    this.render();
    this.renderInteractionColumns();
    store.subscribe(() => this.updateFocus());
    this.updateFocus();
  }

  render() {
    const line = d3.line().x(item => this.x(item.decade.label)).y(item => this.y(item.value));
    const layer = this.svg.append("g").attr("class", "evolution-lines");
    layer.selectAll("path.evolution-all").data(this.series, item => item.feature).join("path")
      .attr("class", "evolution-all").attr("d", item => line(item.all)).attr("stroke", item => item.color);
    layer.selectAll("path.evolution-popular").data(this.series, item => item.feature).join("path")
      .attr("class", "evolution-popular").attr("d", item => line(item.popular)).attr("stroke", item => item.color);
    const points = layer.selectAll("g.evolution-series").data(this.series, item => item.feature).join("g").attr("class", "evolution-series");
    points.selectAll("circle").data(item => item.popular.map(point => ({...point, feature: item.feature, color: item.color}))).join("circle")
      .attr("class", "evolution-point")
      .attr("cx", point => this.x(point.decade.label)).attr("cy", point => this.y(point.value)).attr("r", 3.2)
      .attr("fill", point => point.color)
      .on("mouseenter", (event, point) => {
        const all = point.decade.profile.original[point.feature];
        showTooltip(`<strong>${LABELS[point.feature]} · ${point.decade.label}</strong><em>${d3.format(",")(point.decade.count)} canciones · top 25 % = ${d3.format(",")(point.decade.popular_count)}</em><div><span>Top 25 % popular: <strong>${point.value.toFixed(3)}</strong></span><span>Toda la década: <strong>${all.toFixed(3)}</strong></span></div>`);
      })
      .on("mousemove", event => moveTooltip(event))
      .on("mouseleave", () => hideTooltip())
      .on("click", (event, point) => { event.stopPropagation(); this.store.toggleDecade(point.decade.decade); });
    // Labels at the right end, pushed apart when two lines finish close together.
    const placements = this.series.map(item => ({item, y: this.y(item.popular.at(-1).value)}));
    spreadLabels(placements, 13, this.margin.top, this.height - this.margin.bottom);
    layer.selectAll("text.evolution-label").data(placements, item => item.item.feature).join("text")
      .attr("class", "evolution-label")
      .attr("x", this.x(this.decades.at(-1).label) + 9).attr("y", item => item.y)
      .attr("fill", item => item.item.color)
      .text(item => LABELS[item.item.feature]);
  }

  renderInteractionColumns() {
    // Invisible columns make each decade clickable and hoverable as a whole.
    const step = this.x.step();
    this.columns = this.focusLayer.selectAll("rect.evolution-column").data(this.decades, item => item.decade).join("rect")
      .attr("class", "evolution-column")
      .attr("x", item => this.x(item.label) - step / 2).attr("y", this.margin.top - 6)
      .attr("width", step).attr("height", this.height - this.margin.top - this.margin.bottom + 6)
      .on("mouseenter", (event, item) => {
        const rows = FEATURES.map(feature => `<span>${LABELS[feature]}: <strong>${item.popular_profile.original[feature].toFixed(2)}</strong> / ${item.profile.original[feature].toFixed(2)}</span>`).join("");
        showTooltip(`<strong>${item.label} (${item.year_min}–${item.year_max})</strong><em>${d3.format(",")(item.count)} canciones · top 25 % con popularidad ≥ ${item.popular_cut.toFixed(0)}</em><div>${rows}</div><em>mediana top 25 % / mediana de toda la década · clic para enfocar la década</em>`);
      })
      .on("mousemove", event => moveTooltip(event))
      .on("mouseleave", () => hideTooltip())
      .on("click", (event, item) => { event.stopPropagation(); this.store.toggleDecade(item.decade); });
  }

  updateFocus() {
    const focus = this.store.state.focusDecade;
    this.columns.classed("is-focus", item => focus !== null && item.decade === focus);
  }
}
