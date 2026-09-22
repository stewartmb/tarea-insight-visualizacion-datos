import {FEATURES, LABELS, nearestRecords} from "./math.js";
import {Store} from "./state.js";
import {RadVizChart} from "./radviz.js";
import {StarCoordinatesChart} from "./star_coordinates.js";
import {ParallelCoordinatesChart} from "./parallel_coordinates.js";
import {MDSChart} from "./mds_view.js";

const fmt = d3.format(".3f");
const pct = d3.format(".1%");

async function boot() {
  const response = await fetch("/api/data");
  if (!response.ok) throw new Error((await response.json()).error || "No se pudieron cargar los datos.");
  const data = await response.json();
  const store = new Store(data);
  const byId = new Map(data.records.map(record => [record.uid, record]));

  fillMetadata(data);
  fillTrackSelect(data.records, store.state.selectedId);

  const charts = {
    radviz: new RadVizChart("#radviz-chart", data.records, store),
    star: new StarCoordinatesChart("#star-chart", data.records, store),
    parallel: new ParallelCoordinatesChart("#parallel-chart", data.records, store),
    mds: new MDSChart("#mds-chart", data.records, store)
  };

  function replay(taskId) {
    charts.radviz.reset(); charts.star.reset(); charts.parallel.reset();
    store.replayTask(taskId);
    document.querySelector("#track-select").value = store.state.selectedId;
  }

  document.querySelectorAll(".task-button").forEach(button => button.addEventListener("click", () => replay(button.dataset.task)));
  document.querySelector("#reset-button").addEventListener("click", () => replay(store.state.taskId));
  document.querySelector("#track-select").addEventListener("change", event => store.select(event.target.value));

  store.subscribe(state => {
    document.querySelectorAll(".task-card").forEach(card => card.classList.toggle("active", card.dataset.task === state.taskId));
    document.querySelector("#exploration-status").textContent = state.explorationChanged ? "Exploración modificada" : "Configuración guardada";
    document.querySelector("#exploration-status").classList.toggle("changed", state.explorationChanged);
    document.querySelector("#track-select").value = state.selectedId;
    fillNarrative(data, state, byId);
    fillSelection(byId.get(state.selectedId));
    fillLegend(state.taskId);
  });

  fillNarrative(data, store.state, byId);
  fillSelection(byId.get(store.state.selectedId));
  fillLegend(store.state.taskId);
}

function fillMetadata(data) {
  const years = data.records.map(record => record.year).filter(Boolean);
  document.querySelector("#sample-count").textContent = d3.format(",")(data.metadata.sample_rows);
  document.querySelector("#year-range").textContent = `${d3.min(years)}–${d3.max(years)}`;
  document.querySelector("#quality-score").textContent = pct(data.quality.neighborhood_preservation);
  document.querySelector("#stress-value").textContent = fmt(data.quality.normalized_stress);
  document.querySelector("#correlation-value").textContent = fmt(data.quality.distance_correlation);
  document.querySelector("#neighborhood-value").textContent = pct(data.quality.neighborhood_preservation);
}

function fillTrackSelect(records, selectedId) {
  const select = d3.select("#track-select");
  select.selectAll("option").data([...records].sort((a, b) => d3.ascending(a.name, b.name))).join("option")
    .attr("value", record => record.uid)
    .text(record => `${record.name} — ${record.artist}`);
  select.property("value", selectedId);
}

function fillNarrative(data, state, byId) {
  const nodes = {
    kicker: document.querySelector("#analysis-kicker"), title: document.querySelector("#analysis-title"),
    result: document.querySelector("#analysis-result"), evidence: document.querySelector("#analysis-evidence"),
    what: document.querySelector("#analysis-what"), why: document.querySelector("#analysis-why"),
    how: document.querySelector("#analysis-how"), limit: document.querySelector("#analysis-limit")
  };
  if (state.taskId === "task1") {
    const task = data.tasks.task1;
    const gaps = FEATURES.filter(feature => feature !== "energy").sort((a, b) => Math.abs(task.differences[b]) - Math.abs(task.differences[a]));
    const top = gaps.slice(0, 2);
    nodes.kicker.textContent = "Tarea 1 · Comparar y resumir";
    nodes.title.textContent = "Perfiles de energía alta y baja";
    nodes.result.textContent = `Al pasar del grupo de energía baja al de energía alta, la mediana de ${LABELS[top[0]].toLowerCase()} ${direction(task.differences[top[0]])} ${fmt(Math.abs(task.differences[top[0]]))} y la de ${LABELS[top[1]].toLowerCase()} ${direction(task.differences[top[1]])} ${fmt(Math.abs(task.differences[top[1]]))}.`;
    nodes.evidence.textContent = `${task.high_count} canciones están en el cuartil alto (energía ≥ ${fmt(data.thresholds.energy_q3)}) y ${task.low_count} en el bajo (energía ≤ ${fmt(data.thresholds.energy_q1)}).`;
    nodes.what.textContent = "Canciones, seis atributos cuantitativos y dos grupos definidos por cuartiles de energía.";
    nodes.why.textContent = "Comparar y resumir perfiles multidimensionales.";
    nodes.how.textContent = "Parallel Coordinates muestra perfiles; RadViz explora el balance entre dimensiones.";
    nodes.limit.textContent = "Los cuartiles describen esta muestra reproducible; no son categorías universales de Spotify.";
  } else if (state.taskId === "task2") {
    const selected = byId.get(state.selectedId);
    const neighbors = nearestRecords(data.records, state.selectedId, 10);
    const closest = neighbors.slice(0, 3).map(item => item.record.name).join(", ");
    const differences = FEATURES.map(feature => ({feature, value: d3.mean(neighbors, item => (item.record.normalized[feature] - selected.normalized[feature]) ** 2)})).sort((a, b) => a.value - b.value);
    nodes.kicker.textContent = "Tarea 2 · Identificar similitud";
    nodes.title.textContent = `Canciones similares a “${selected.name}”`;
    nodes.result.textContent = `Los tres vecinos más cercanos en las seis variables son ${closest}. Los atributos más parecidos dentro de los diez vecinos son ${LABELS[differences[0].feature].toLowerCase()} y ${LABELS[differences[1].feature].toLowerCase()}.`;
    nodes.evidence.textContent = `Distancia euclídea normalizada del vecino más cercano: ${fmt(neighbors[0]?.distance ?? 0)}. MDS conserva ${pct(data.quality.neighborhood_preservation)} de los 10 vecinos, en promedio.`;
    nodes.what.textContent = "Una canción objetivo y sus diez vecinos en seis variables normalizadas.";
    nodes.why.textContent = "Identificar canciones similares y explicar esa similitud.";
    nodes.how.textContent = "MDS muestra proximidad; Parallel y Star Coordinates permiten revisar el perfil.";
    nodes.limit.textContent = "La similitud depende de estas seis variables y no incorpora gustos, género ni contexto de escucha.";
  } else {
    const task = data.tasks.task3;
    const gaps = FEATURES.filter(feature => !["energy", "valence"].includes(feature)).sort((a, b) => Math.abs(task.differences[b]) - Math.abs(task.differences[a]));
    nodes.kicker.textContent = "Tarea 3 · Localizar y comparar";
    nodes.title.textContent = "Combinaciones contrastantes de energía y valencia";
    nodes.result.textContent = `${task.energetic_somber_count} canciones combinan energía alta y valencia baja; ${task.calm_positive_count} combinan energía baja y valencia alta. El primer grupo tiene ${fmt(Math.abs(task.differences[gaps[0]]))} ${task.differences[gaps[0]] >= 0 ? "más" : "menos"} de ${LABELS[gaps[0]].toLowerCase()} en la comparación de medianas.`;
    nodes.evidence.textContent = `Cortes: energía baja ≤ ${fmt(data.thresholds.energy_q1)}, alta ≥ ${fmt(data.thresholds.energy_q3)}; valencia baja ≤ ${fmt(data.thresholds.valence_q1)}, alta ≥ ${fmt(data.thresholds.valence_q3)}.`;
    nodes.what.textContent = "Dos subconjuntos definidos por extremos conjuntos de energía y valencia.";
    nodes.why.textContent = "Localizar combinaciones y comparar los demás atributos.";
    nodes.how.textContent = "Brushing, RadViz y Star Coordinates conectan selección, posición y contribución de variables.";
    nodes.limit.textContent = "Valencia es una característica acústica del dataset; no mide la emoción real de cada oyente.";
  }
}

function fillSelection(record) {
  if (!record) return;
  document.querySelector("#selected-name").textContent = record.name;
  document.querySelector("#selected-meta").textContent = `${record.artist} · ${record.year || "año no disponible"} · popularidad ${record.popularity.toFixed(0)}`;
  d3.select("#selected-features").selectAll("div").data(FEATURES).join("div")
    .html(feature => `<span>${LABELS[feature]}</span><strong>${fmt(record.original[feature])}</strong>`);
}

function fillLegend(taskId) {
  const entries = taskId === "task1"
    ? [["#e4572e", "Energía alta"], ["#2878b5", "Energía baja"], ["#cbd2d9", "Intermedia"]]
    : taskId === "task2"
      ? [["#6f42c1", "Seleccionada"], ["#ef9b20", "10 vecinas"], ["#cbd2d9", "Resto"]]
      : [["#c44569", "Alta energía, baja valencia"], ["#278c82", "Baja energía, alta valencia"], ["#cbd2d9", "Resto"]];
  d3.select("#legend").selectAll("div").data(entries).join("div").html(entry => `<i style="background:${entry[0]}"></i><span>${entry[1]}</span>`);
}

function direction(value) { return value >= 0 ? "aumenta" : "disminuye"; }

boot().catch(error => {
  document.body.innerHTML = `<main class="fatal"><h1>No se pudo iniciar la aplicación</h1><p>${error.message}</p></main>`;
  console.error(error);
});
