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
  fillTrackSelect(data.records, store.state.selectedId, store.state.selectedIdB);
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
    charts.parallel.setSummaries(taskId === "task1" ? pairRecords(data, store.state) : []);
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
    document.querySelector("#track-select-b").style.display = taskId === "task1" ? "" : "none";
    document.querySelector(".second-track-label").style.display = taskId === "task1" ? "" : "none";
  }
  function replay(taskId) {
    store.replayTask(taskId, false);
    configureTask(taskId);
    document.querySelector("#track-select").value = store.state.selectedId;
    document.querySelector("#track-select-b").value = store.state.selectedIdB;
    store.emit("replay");
  }
  document.querySelectorAll(".task-button").forEach(button => button.addEventListener("click", () => replay(button.dataset.task)));
  document.querySelector("#reset-button").addEventListener("click", () => replay(store.state.taskId));
  document.querySelector("#track-select").addEventListener("change", event => {
    if (store.state.taskId === "task1") {
      store.patch({selectedId: event.target.value, focusIds: new Set([event.target.value, store.state.selectedIdB])}, "selection-pair", true);
      charts.parallel.setSummaries(pairRecords(data, store.state));
    } else {
      store.select(event.target.value);
    }
  });
  document.querySelector("#track-select-b").addEventListener("change", event => {
    const uid = event.target.value;
    const focusIds = new Set([store.state.selectedId, uid]);
    store.patch({selectedIdB: uid, focusIds}, "selection-pair", true);
    charts.parallel.setSummaries(pairRecords(data, store.state));
  });
  store.subscribe(state => {
    document.querySelectorAll(".task-card").forEach(card => card.classList.toggle("active", card.dataset.task === state.taskId));
    const status = document.querySelector("#exploration-status");
    status.textContent = state.explorationChanged ? "Exploración modificada" : "Configuración guardada";
    status.classList.toggle("changed", state.explorationChanged);
    document.querySelector("#track-select").value = state.selectedId;
    document.querySelector("#track-select-b").value = state.selectedIdB;
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

function fillTrackSelect(records, selectedId, selectedIdB) {
  const options = [...records].sort((a, b) => d3.ascending(a.name, b.name));
  d3.select("#track-select").selectAll("option").data(options).join("option")
    .attr("value", record => record.uid).text(record => `${record.name} — ${record.artist}`);
  d3.select("#track-select-b").selectAll("option").data(options).join("option")
    .attr("value", record => record.uid).text(record => `${record.name} — ${record.artist}`);
  d3.select("#track-select").property("value", selectedId);
  d3.select("#track-select-b").property("value", selectedIdB);
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
    const left = byId.get(state.selectedId), right = byId.get(state.selectedIdB);
    const differences = FEATURES.map(feature => ({feature, value: right ? Math.abs(left.normalized[feature] - right.normalized[feature]) : 0})).sort((a, b) => b.value - a.value);
    nodes.kicker.textContent = "Tarea 1 · Comparar canciones";
    nodes.title.textContent = `${left.name} frente a ${right?.name || "Canción B"}`;
    nodes.result.textContent = `Las mayores diferencias entre ambas canciones aparecen en ${LABELS[differences[0].feature].toLowerCase()} y ${LABELS[differences[1].feature].toLowerCase()}.`;
    nodes.evidence.textContent = `La distancia euclídea entre sus perfiles normalizados es ${fmt(Math.sqrt(differences.reduce((sum, item) => sum + item.value ** 2, 0)))}. La tabla muestra la diferencia por atributo.`;
    nodes.what.textContent = "Dos canciones y seis atributos cuantitativos normalizados.";
    nodes.why.textContent = "Decidir si una canción puede convivir con otra dentro de una playlist.";
    nodes.how.textContent = "Parallel Coordinates es principal porque permite seguir y comparar los dos perfiles en cada eje; RadViz resume su posición multidimensional.";
    nodes.limit.textContent = "La compatibilidad se evalúa solo con estas seis características; no mide transición armónica, letra ni gusto personal.";
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
    nodes.kicker.textContent = "Tarea 3 · Diseñar un perfil";
    nodes.title.textContent = "Playlist energética, positiva y bailable";
    nodes.result.textContent = `${task.target_uids.length} canciones forman el conjunto inicial de candidatas para este brief sonoro. Star Coordinates permite explorar qué ocurre cuando se cambia el peso de cada atributo.`;
    nodes.evidence.textContent = `Perfil inicial: ${task.target_definition}. La tabla resume la mediana de las candidatas seleccionadas.`;
    nodes.what.textContent = "Seis atributos de audio normalizados y un perfil objetivo explícito para una playlist.";
    nodes.why.textContent = "Explorar candidatas para un ambiente musical definido por atributos, no por una etiqueta de género inventada.";
    nodes.how.textContent = "Star Coordinates es principal porque permite cambiar dirección y peso de los atributos; RadViz y Parallel ayudan a verificar los perfiles.";
    nodes.limit.textContent = "El brief es una configuración inicial y no equivale a una emoción universal ni a una recomendación personalizada.";
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
  if (taskId === "task3") return [
    {...data.tasks.task3.target_profile, id: "target", label: "Perfil objetivo", color: "#17222e"}
  ].map(item => ({...item, ...item.normalized}));
  if (taskId === "task4") return data.tasks.task4.decades.map(item => ({
    id: `decade-${item.decade}`, label: item.label,
    color: d3.interpolateViridis((item.decade - data.tasks.task4.decades[0].decade) / Math.max(1, data.tasks.task4.decades.at(-1).decade - data.tasks.task4.decades[0].decade)),
    ...item.profile, ...item.profile.normalized
  }));
  return [];
}

function pairRecords(data, state) {
  return [state.selectedId, state.selectedIdB].map((uid, index) => {
    const record = data.records.find(item => item.uid === uid);
    return record ? {...record, id: `pair-${index}`, label: `${index === 0 ? "Canción A" : "Canción B"} · perfil`, color: index === 0 ? "#e4572e" : "#2878b5"} : null;
  }).filter(Boolean);
}

function fillSelection(record) {
  if (!record) return;
  document.querySelector("#selected-name").textContent = record.name;
  document.querySelector("#selected-meta").textContent = `${record.artist} · ${record.year || "año no disponible"} · popularidad ${record.popularity.toFixed(0)}`;
  d3.select("#selected-features").selectAll("div").data(FEATURES).join("div")
    .html(feature => `<span>${LABELS[feature]}</span><strong>${fmt(record.original[feature])}</strong>`);
}

function fillLegend(taskId) {
  const entries = taskId === "task1" ? [["#e4572e", "Canción A"], ["#2878b5", "Canción B"]]
    : taskId === "task2" ? [["#6f42c1", "Seleccionada"], ["#ef9b20", "10 vecinas"], ["#cbd2d9", "Resto"]]
      : taskId === "task3" ? [["#c44569", "Candidatas al perfil objetivo"], ["#17222e", "Perfil objetivo mediano"]]
        : [["#4c78a8", "Canciones"], ["#35a779", "Perfil de década"], ["#cbd2d9", "Contexto"]];
  const html = entry => `<i style="background:${entry[0]}"></i><span>${entry[1]}</span>`;
  d3.select("#legend").selectAll("div").data(entries).join("div").html(html);
  d3.select("#active-legend").selectAll("div").data(entries).join("div").html(html);
  document.querySelector("#active-legend-note").textContent = taskId === "task1"
    ? "Las líneas finas son canciones; las entrecortadas comparan directamente los perfiles de Canción A y Canción B."
    : taskId === "task2"
      ? "El punto morado es la canción seleccionada; los naranjas son sus diez vecinas."
      : taskId === "task3"
        ? "Los puntos rosados son candidatas al brief; el marcador oscuro es su perfil mediano."
        : "El color ordena las décadas. Los puntos grandes no se usan: cada perfil agregado se identifica por color, contorno y tooltip.";
}

function fillEvidence(data, state) {
  const title = document.querySelector("#evidence-title");
  const description = document.querySelector("#evidence-description");
  const content = d3.select("#evidence-content");
  content.html("");
  if (state.taskId === "task1") {
    title.textContent = "Cómo leer la comparación"; description.textContent = "Cada canción aparece como una línea fina. Las líneas entrecortadas y ligeramente marcadas corresponden directamente a Canción A y Canción B; no son medianas ni grupos artificiales.";
    const left = data.records.find(record => record.uid === state.selectedId), right = data.records.find(record => record.uid === state.selectedIdB);
    addTable(content, ["Atributo", "Canción A", "Canción B", "Diferencia absoluta"], FEATURES.map(feature => [LABELS[feature], fmt(left.original[feature]), fmt(right.original[feature]), fmt(Math.abs(left.normalized[feature] - right.normalized[feature]))]));
  } else if (state.taskId === "task2") {
    title.textContent = "Ranking verificable de vecinos"; description.textContent = "El orden se calcula con distancia euclídea sobre las seis variables normalizadas.";
    addTable(content, ["#", "Canción", "Artista", "Distancia"], nearestRecords(data.records, state.selectedId, 10).map((item, index) => [index + 1, item.record.name, item.record.artist, fmt(item.distance)]));
  } else if (state.taskId === "task3") {
    const task = data.tasks.task3;
    title.textContent = "Perfil objetivo y candidatas"; description.textContent = "El perfil mediano resume las 60 candidatas iniciales; puedes modificar los ejes de Star Coordinates para explorar otro brief.";
    addTable(content, ["Atributo", "Perfil objetivo mediano"], FEATURES.map(feature => [LABELS[feature], fmt(task.target_profile.original[feature])]));
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
