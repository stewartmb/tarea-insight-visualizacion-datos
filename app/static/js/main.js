import {FEATURES, LABELS, nearestRecords} from "./math.js";
import {Store} from "./state.js";
import {RadVizChart} from "./radviz.js";
import {StarCoordinatesChart} from "./star_coordinates.js";
import {ParallelCoordinatesChart} from "./parallel_coordinates.js";
import {MDSChart} from "./mds_view.js";

const fmt = d3.format(".3f");
const pct = d3.format(".1%");
const TASK_VIEWS = {
  task1: {primary: "parallel", visible: ["parallel", "radviz"], order: ["energy", "acousticness", "valence", "danceability", "instrumentalness", "speechiness"]},
  task2: {primary: "mds", visible: ["mds", "parallel", "quality"]},
  task3: {primary: "star", visible: ["star", "radviz", "parallel"]},
  task4: {primary: "radviz", visible: ["radviz", "parallel"]}
};

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
  function configureTask(taskId) {
    const view = TASK_VIEWS[taskId];
    charts.radviz.reset(); charts.star.reset(); charts.parallel.reset();
    charts.parallel.setDimensions(view.order || FEATURES);
    charts.radviz.setSummaries(summaryRecords(data, taskId));
    charts.star.setSummaries(taskId === "task3" ? summaryRecords(data, taskId) : []);
    charts.parallel.setSummaries(taskId === "task1" || taskId === "task3" ? summaryRecords(data, taskId) : []);
    document.querySelectorAll(".chart-card[data-chart]").forEach(card => {
      const visible = view.visible.includes(card.dataset.chart);
      card.hidden = !visible;
      card.style.display = visible ? "" : "none";
      card.classList.toggle("primary-chart", card.dataset.chart === view.primary);
    });
    document.querySelectorAll(".chart-card[data-chart] .method-tag").forEach(tag => {
      const chart = tag.closest(".chart-card").dataset.chart;
      tag.textContent = chart === view.primary ? "Técnica principal" : "Técnica de apoyo";
    });
  }
  function replay(taskId) {
    store.replayTask(taskId, false);
    configureTask(taskId);
    document.querySelector("#track-select").value = store.state.selectedId;
    store.emit("replay");
  }
  document.querySelectorAll(".task-button").forEach(button => button.addEventListener("click", () => replay(button.dataset.task)));
  document.querySelector("#reset-button").addEventListener("click", () => replay(store.state.taskId));
  document.querySelector("#track-select").addEventListener("change", event => store.select(event.target.value));
  store.subscribe(state => {
    document.querySelectorAll(".task-card").forEach(card => card.classList.toggle("active", card.dataset.task === state.taskId));
    const status = document.querySelector("#exploration-status");
    status.textContent = state.explorationChanged ? "Exploración modificada" : "Configuración guardada";
    status.classList.toggle("changed", state.explorationChanged);
    document.querySelector("#track-select").value = state.selectedId;
    fillNarrative(data, state, byId);
    fillSelection(byId.get(state.selectedId));
    fillLegend(state.taskId);
    fillEvidence(data, state);
  });
  configureTask(store.state.taskId);
  fillNarrative(data, store.state, byId);
  fillSelection(byId.get(store.state.selectedId));
  fillLegend(store.state.taskId);
  fillEvidence(data, store.state);
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
  d3.select("#track-select").selectAll("option").data([...records].sort((a, b) => d3.ascending(a.name, b.name))).join("option")
    .attr("value", record => record.uid).text(record => `${record.name} — ${record.artist}`);
  d3.select("#track-select").property("value", selectedId);
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
    nodes.kicker.textContent = "Tarea 1 · Comparar perfiles";
    nodes.title.textContent = "Energía alta frente a energía baja";
    nodes.result.textContent = `La comparación de perfiles muestra que ${LABELS[gaps[0]].toLowerCase()} y ${LABELS[gaps[1]].toLowerCase()} son las dimensiones que más separan ambos grupos.`;
    nodes.evidence.textContent = `${task.high_count} canciones están en el cuartil alto (≥ ${fmt(data.thresholds.energy_q3)}) y ${task.low_count} en el bajo (≤ ${fmt(data.thresholds.energy_q1)}).`;
    nodes.what.textContent = "Canciones y seis atributos cuantitativos; energía define dos grupos mediante cuartiles.";
    nodes.why.textContent = "Comparar perfiles completos para segmentar o construir playlists.";
    nodes.how.textContent = "Parallel Coordinates es principal porque conserva el perfil por atributo; RadViz resume los grupos.";
    nodes.limit.textContent = "Los cuartiles describen esta muestra reproducible, no categorías universales de Spotify.";
  } else if (state.taskId === "task2") {
    const selected = byId.get(state.selectedId);
    const neighbors = nearestRecords(data.records, state.selectedId, 10);
    nodes.kicker.textContent = "Tarea 2 · Buscar similitudes";
    nodes.title.textContent = `Diez canciones similares a “${selected.name}”`;
    nodes.result.textContent = `La canción más cercana es “${neighbors[0]?.record.name || "—"}”; la tabla permite verificar la distancia y los atributos que explican el ranking.`;
    nodes.evidence.textContent = `Distancia euclídea normalizada del primer vecino: ${fmt(neighbors[0]?.distance ?? 0)}. La proyección conserva ${pct(data.quality.neighborhood_preservation)} de las vecindades k=${data.quality.neighborhood_k}.`;
    nodes.what.textContent = "Una canción consulta y sus diez vecinas en seis variables normalizadas.";
    nodes.why.textContent = "Encontrar candidatas para ampliar una playlist manteniendo un perfil sonoro parecido.";
    nodes.how.textContent = "MDS es principal porque ordena por proximidad; Parallel Coordinates explica las diferencias atributo por atributo.";
    nodes.limit.textContent = "MDS muestra proximidad, no clusters; la similitud no incorpora género, gustos ni contexto de escucha.";
  } else if (state.taskId === "task3") {
    const task = data.tasks.task3;
    const gaps = FEATURES.filter(feature => !["energy", "valence"].includes(feature)).sort((a, b) => Math.abs(task.differences[b]) - Math.abs(task.differences[a]));
    nodes.kicker.textContent = "Tarea 3 · Explicar contrastes";
    nodes.title.textContent = "Perfiles contrastantes para una playlist";
    nodes.result.textContent = `${task.energetic_somber_count} canciones combinan energía alta con valencia baja y ${task.calm_positive_count} energía baja con valencia alta; ${LABELS[gaps[0]].toLowerCase()} es el atributo que más cambia entre sus medianas.`;
    nodes.evidence.textContent = `Cortes: energía ≤ ${fmt(data.thresholds.energy_q1)} / ≥ ${fmt(data.thresholds.energy_q3)} y valencia ≤ ${fmt(data.thresholds.valence_q1)} / ≥ ${fmt(data.thresholds.valence_q3)}.`;
    nodes.what.textContent = "Dos subconjuntos definidos por extremos conjuntos de energía y valencia.";
    nodes.why.textContent = "Seleccionar canciones que cambien el ambiente o formen dos segmentos contrastantes.";
    nodes.how.textContent = "Star Coordinates es principal porque muestra la contribución vectorial; RadViz y Parallel sirven para contrastar perfiles.";
    nodes.limit.textContent = "Valencia es una característica del dataset y no mide por sí sola la emoción de cada oyente.";
  } else {
    const decades = data.tasks.task4.decades;
    nodes.kicker.textContent = "Tarea 4 · Examinar evolución";
    nodes.title.textContent = "Perfil sonoro y popularidad a través de las décadas";
    nodes.result.textContent = `Se comparan perfiles agregados desde ${decades[0]?.label || "—"} hasta ${decades.at(-1)?.label || "—"}; la tabla informa cuántas canciones sostienen cada conclusión.`;
    nodes.evidence.textContent = `${decades.length} décadas superan el mínimo de ${data.tasks.task4.min_decade_count} canciones. La popularidad se divide por cuartiles dentro de cada década.`;
    nodes.what.textContent = "Año, popularidad y seis atributos de audio; las canciones se agregan por décadas con suficiente observación.";
    nodes.why.textContent = "Explorar cómo cambia el catálogo y qué dimensiones explican diferencias temporales.";
    nodes.how.textContent = "RadViz es principal porque compara perfiles multidimensionales agregados; Parallel apoya dos décadas seleccionadas.";
    nodes.limit.textContent = "No se interpretan décadas pequeñas ni se infiere causalidad histórica; el análisis se limita a esta muestra.";
  }
}

function summaryRecords(data, taskId) {
  if (taskId === "task1") return [
    {...data.tasks.task1.profiles.high, id: "high", label: "Energía alta", color: "#e4572e"},
    {...data.tasks.task1.profiles.low, id: "low", label: "Energía baja", color: "#2878b5"}
  ].map(item => ({...item, ...item.normalized}));
  if (taskId === "task3") return [
    {...data.tasks.task3.profiles.energetic_somber, id: "somber", label: "Alta energía · baja valencia", color: "#c44569"},
    {...data.tasks.task3.profiles.calm_positive, id: "positive", label: "Baja energía · alta valencia", color: "#278c82"}
  ].map(item => ({...item, ...item.normalized}));
  if (taskId === "task4") return data.tasks.task4.decades.map(item => ({
    id: `decade-${item.decade}`, label: item.label,
    color: d3.interpolateViridis((item.decade - data.tasks.task4.decades[0].decade) / Math.max(1, data.tasks.task4.decades.at(-1).decade - data.tasks.task4.decades[0].decade)),
    ...item.profile, ...item.profile.normalized
  }));
  return [];
}

function fillSelection(record) {
  if (!record) return;
  document.querySelector("#selected-name").textContent = record.name;
  document.querySelector("#selected-meta").textContent = `${record.artist} · ${record.year || "año no disponible"} · popularidad ${record.popularity.toFixed(0)}`;
  d3.select("#selected-features").selectAll("div").data(FEATURES).join("div")
    .html(feature => `<span>${LABELS[feature]}</span><strong>${fmt(record.original[feature])}</strong>`);
}

function fillLegend(taskId) {
  const entries = taskId === "task1" ? [["#e4572e", "Energía alta"], ["#2878b5", "Energía baja"], ["#17222e", "Perfil mediano"]]
    : taskId === "task2" ? [["#6f42c1", "Seleccionada"], ["#ef9b20", "10 vecinas"], ["#cbd2d9", "Resto"]]
      : taskId === "task3" ? [["#c44569", "Alta energía · baja valencia"], ["#278c82", "Baja energía · alta valencia"], ["#17222e", "Perfil mediano"]]
        : [["#4c78a8", "Canciones"], ["#35a779", "Perfil de década"], ["#cbd2d9", "Contexto"]];
  d3.select("#legend").selectAll("div").data(entries).join("div").html(entry => `<i style="background:${entry[0]}"></i><span>${entry[1]}</span>`);
}

function fillEvidence(data, state) {
  const title = document.querySelector("#evidence-title");
  const description = document.querySelector("#evidence-description");
  const content = d3.select("#evidence-content");
  content.html("");
  if (state.taskId === "task1") {
    title.textContent = "Medianas por grupo"; description.textContent = "La línea gruesa representa el perfil agregado; las líneas suaves conservan la variabilidad de las canciones.";
    const task = data.tasks.task1;
    addTable(content, ["Atributo", "Energía baja", "Energía alta", "Diferencia"], FEATURES.map(feature => [LABELS[feature], fmt(task.low_medians[feature]), fmt(task.high_medians[feature]), fmt(task.differences[feature])]));
  } else if (state.taskId === "task2") {
    title.textContent = "Ranking verificable de vecinos"; description.textContent = "El orden se calcula con distancia euclídea sobre las seis variables normalizadas.";
    addTable(content, ["#", "Canción", "Artista", "Distancia"], nearestRecords(data.records, state.selectedId, 10).map((item, index) => [index + 1, item.record.name, item.record.artist, fmt(item.distance)]));
  } else if (state.taskId === "task3") {
    title.textContent = "Atributos que construyen el contraste"; description.textContent = "Los centroides medianos evitan que la sobreposición oculte la comparación.";
    const task = data.tasks.task3;
    addTable(content, ["Atributo", "Alta energía · baja valencia", "Baja energía · alta valencia", "Diferencia"], FEATURES.map(feature => [LABELS[feature], fmt(task.energetic_somber_medians[feature]), fmt(task.calm_positive_medians[feature]), fmt(task.differences[feature])]));
  } else {
    title.textContent = "Décadas con evidencia suficiente"; description.textContent = "Solo se muestran décadas con al menos 20 canciones del dataset limpio; popularidad se compara dentro de cada década.";
    addTable(content, ["Década", "Canciones", "Cuartil popular", "Cuartil no popular", "Corte popularidad"], data.tasks.task4.decades.map(item => [item.label, item.count, item.popular_count, item.nonpopular_count, fmt(item.popularity_q3)]));
  }
}

function addTable(container, headers, rows) {
  const table = container.append("table").attr("class", "evidence-table");
  table.append("thead").append("tr").selectAll("th").data(headers).join("th").text(header => header);
  table.append("tbody").selectAll("tr").data(rows).join("tr").selectAll("td").data(row => row).join("td").text(value => value);
}

boot().catch(error => {
  document.body.innerHTML = `<main class="fatal"><h1>No se pudo iniciar la aplicación</h1><p>${error.message}</p></main>`;
  console.error(error);
});
