import {FEATURES, LABELS, featureDifferences, nearestProjected, nearestRecords, neighborhoodProfile, percentileOf} from "./math.js";
import {Store, TASK_COLORS} from "./state.js";
import {RadVizChart} from "./radviz.js";
import {StarCoordinatesChart} from "./star_coordinates.js";
import {ParallelCoordinatesChart, SCALE_MODES} from "./parallel_coordinates.js";
import {MDSChart} from "./mds_view.js";
import {EvolutionChart} from "./evolution_chart.js";
import {CorrelationChart} from "./correlation_chart.js";
import {escapeHtml} from "./chart_utils.js";

const fmt = d3.format(".3f");
const fmt2 = d3.format(".2f");
const pct = d3.format(".1%");
const pct0 = d3.format(".0%");
const int = d3.format(",");
const TASK_VIEWS = {
  task1: {primary: "parallel", visible: ["parallel", "radviz", "correlation"], order: ["energy", "acousticness", "valence", "danceability", "instrumentalness", "speechiness"]},
  task2: {primary: "mds", visible: ["mds", "quality", "parallel"]},
  task3: {primary: "star", visible: ["star", "radviz", "parallel"]},
  task4: {primary: "radviz", visible: ["radviz", "evolution", "parallel"]}
};

async function boot() {
  const response = await fetch("/api/data");
  if (!response.ok) throw new Error((await response.json()).error || "No se pudieron cargar los datos.");
  const data = await response.json();
  const store = new Store(data);
  const byId = new Map(data.records.map(record => [record.uid, record]));
  fillMetadata(data);
  fillTrackSelect(data.records, store.state.selectedId, store.state.selectedIdB);
  fillScaleSelect();
  const charts = {
    radviz: new RadVizChart("#radviz-chart", data.records, store),
    star: new StarCoordinatesChart("#star-chart", data.records, store),
    parallel: new ParallelCoordinatesChart("#parallel-chart", data.records, store),
    mds: new MDSChart("#mds-chart", data.records, store),
    evolution: new EvolutionChart("#evolution-chart", data.tasks.task4.decades, store),
    correlation: new CorrelationChart("#correlation-chart", data.correlations)
  };
  function configureTask(taskId) {
    const view = TASK_VIEWS[taskId];
    charts.radviz.reset(); charts.star.reset(); charts.parallel.reset();
    document.querySelector("#parallel-scale").value = "normalized";
    charts.parallel.setDimensions(view.order || FEATURES);
    charts.radviz.setSummaries(radvizSummaries(data, taskId, store));
    charts.star.setSummaries(taskId === "task3" ? targetSummary(data) : []);
    charts.parallel.setSummaries(taskId === "task1" ? pairRecords(data, store.state) : taskId === "task4" ? decadeSummaries(data, store, "popular") : []);
    document.querySelectorAll(".chart-card[data-chart]").forEach(card => {
      const visible = view.visible.includes(card.dataset.chart);
      card.hidden = !visible;
      card.style.display = visible ? "" : "none";
      // Grid order follows the task: primary technique first, then its supports.
      card.style.order = visible ? String(view.visible.indexOf(card.dataset.chart)) : "99";
      card.classList.toggle("primary-chart", card.dataset.chart === view.primary);
    });
    document.querySelectorAll(".chart-card[data-chart] .method-tag").forEach(tag => {
      const chart = tag.closest(".chart-card").dataset.chart;
      tag.textContent = chart === view.primary ? "Técnica principal" : ["evolution", "correlation", "quality"].includes(chart) ? "Gráfico de apoyo" : "Técnica de apoyo";
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
  document.querySelector("#parallel-scale").addEventListener("change", event => {
    charts.parallel.setScaleMode(event.target.value);
    store.patch({}, "parallel-scale", true);
  });
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
  store.subscribe((state, reason) => {
    if (reason === "hover") return;
    if (state.taskId === "task1" && reason === "selection") charts.parallel.setSummaries(pairRecords(data, state));
    document.querySelectorAll(".task-card").forEach(card => card.classList.toggle("active", card.dataset.task === state.taskId));
    const status = document.querySelector("#exploration-status");
    status.textContent = state.explorationChanged ? "Exploración modificada" : "Configuración guardada";
    status.classList.toggle("changed", state.explorationChanged);
    document.querySelector("#track-select").value = state.selectedId;
    document.querySelector("#track-select-b").value = state.selectedIdB;
    fillNarrative(data, state, byId);
    fillSelection(byId.get(state.selectedId));
    fillLegend(data, state, store);
    fillEvidence(data, state, store);
  });
  configureTask(store.state.taskId);
  fillNarrative(data, store.state, byId);
  fillSelection(byId.get(store.state.selectedId));
  fillLegend(data, store.state, store);
  fillEvidence(data, store.state, store);
}

function fillMetadata(data) {
  document.querySelector("#sample-count").textContent = int(data.metadata.sample_rows);
  document.querySelector("#year-range").textContent = `${data.metadata.year_min}–${data.metadata.year_max}`;
  document.querySelector("#quality-score").textContent = pct(data.quality.neighborhood_preservation);
  document.querySelector("#stress-value").textContent = fmt(data.quality.normalized_stress);
  document.querySelector("#correlation-value").textContent = fmt(data.quality.distance_correlation);
  document.querySelector("#neighborhood-value").textContent = pct(data.quality.neighborhood_preservation);
  document.querySelector("#clean-rows").textContent = int(data.metadata.clean_rows);
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

function fillScaleSelect() {
  d3.select("#parallel-scale").selectAll("option").data(Object.entries(SCALE_MODES)).join("option")
    .attr("value", entry => entry[0]).text(entry => entry[1]);
}

function and(a, b) {
  return `${a} ${/^h?i(?!e)/i.test(b) ? "e" : "y"} ${b}`;
}

function describe(record) {
  return `“${record.name}” de ${record.artist} (${record.year || "año n/d"})`;
}

function closerThanShare(data, distance) {
  const share = percentileOf(data.tasks.task1.distance_percentiles, distance);
  return share === null ? null : 1 - share;
}

function correlationBetween(data, a, b) {
  const i = data.correlations.features.indexOf(a), j = data.correlations.features.indexOf(b);
  return i >= 0 && j >= 0 ? data.correlations.matrix[i][j] : null;
}

function fillNarrative(data, state, byId) {
  const nodes = {
    kicker: document.querySelector("#analysis-kicker"), title: document.querySelector("#analysis-title"),
    result: document.querySelector("#analysis-result"), evidence: document.querySelector("#analysis-evidence"),
    what: document.querySelector("#analysis-what"), why: document.querySelector("#analysis-why"),
    how: document.querySelector("#analysis-how"), limit: document.querySelector("#analysis-limit")
  };
  let findings = [];
  if (state.taskId === "task1") {
    const left = byId.get(state.selectedId), right = byId.get(state.selectedIdB) || left;
    const differences = featureDifferences(left, right);
    const [d1, d2] = differences;
    const [s1, s2] = [...differences].reverse();
    const distance = Math.sqrt(differences.reduce((sum, item) => sum + item.value ** 2, 0));
    const closer = closerThanShare(data, distance);
    const verdict = closer === null ? "" : closer >= 0.9
      ? "Son más parecidas que el 90 % de las parejas posibles de la muestra: pueden convivir en una misma playlist según estas seis variables."
      : closer >= 0.5
        ? `Son más parecidas que el ${pct0(closer)} de las parejas de la muestra: compatibles, con un contraste visible en ${LABELS[d1.feature].toLowerCase()}.`
        : `Solo son más parecidas que el ${pct0(closer)} de las parejas de la muestra: convivirían únicamente en una playlist que admita contraste.`;
    nodes.kicker.textContent = "Tarea 1 · Comparar canciones";
    nodes.title.textContent = `${left.name} frente a ${right.name}`;
    nodes.result.textContent = `Las mayores diferencias entre ambas canciones aparecen en ${and(LABELS[d1.feature].toLowerCase(), LABELS[d2.feature].toLowerCase())}. ${verdict}`;
    nodes.evidence.textContent = `Distancia euclídea entre sus perfiles normalizados: ${fmt(distance)}. La tabla muestra la diferencia por atributo.`;
    findings = [
      `${describe(left)} tiene ${LABELS[d1.feature].toLowerCase()} ${fmt2(left.original[d1.feature])} frente a ${fmt2(right.original[d1.feature])} de ${describe(right)}; en ${LABELS[d2.feature].toLowerCase()} la diferencia es ${fmt2(left.original[d2.feature])} frente a ${fmt2(right.original[d2.feature])}.`,
      `Coinciden casi por completo en ${and(LABELS[s1.feature].toLowerCase(), LABELS[s2.feature].toLowerCase())} (diferencias normalizadas de ${fmt(s1.value)} y ${fmt(s2.value)}).`,
      `Contexto Spotify: popularidad ${left.popularity.toFixed(0)} frente a ${right.popularity.toFixed(0)}; ${Math.abs(left.year - right.year)} años de distancia entre lanzamientos.`,
      `En el dataset completo, energía y acústica tienen correlación r = ${fmt2(correlationBetween(data, "energy", "acousticness"))}: por eso van adyacentes en Parallel Coordinates, donde la relación se lee de un vistazo.`
    ];
    nodes.what.textContent = "Dos canciones y seis atributos cuantitativos normalizados.";
    nodes.why.textContent = "Decidir si una canción puede convivir con otra dentro de una playlist.";
    nodes.how.textContent = "Parallel Coordinates es principal porque permite seguir y comparar los dos perfiles en cada eje; RadViz resume su posición multidimensional y la matriz de correlación justifica el orden de los ejes.";
    nodes.limit.textContent = "La compatibilidad se evalúa solo con estas seis características; no mide transición armónica, letra ni gusto personal.";
  } else if (state.taskId === "task2") {
    const selected = byId.get(state.selectedId);
    const neighbors = nearestRecords(data.records, state.selectedId, 10);
    const first = neighbors[0];
    const profile = neighborhoodProfile(selected, neighbors);
    const [p1, p2] = profile;
    const farthest = profile[profile.length - 1];
    const years = neighbors.map(item => item.record.year).filter(Boolean);
    const artists = new Set(neighbors.map(item => item.record.artist));
    const projectedIds = new Set(nearestProjected(data.records, state.selectedId, 10).map(item => item.record.uid));
    const kept = neighbors.filter(item => projectedIds.has(item.record.uid)).length;
    const closer = first ? closerThanShare(data, first.distance) : null;
    nodes.kicker.textContent = "Tarea 2 · Buscar similitudes";
    nodes.title.textContent = `Diez canciones similares a “${selected.name}”`;
    nodes.result.textContent = first
      ? `La canción más cercana es ${describe(first.record)}, a distancia ${fmt(first.distance)}${closer === null ? "" : ` (más cerca que el ${pct0(closer)} de las parejas de la muestra)`}. Las diez vecinas se parecen sobre todo en ${and(LABELS[p1.feature].toLowerCase(), LABELS[p2.feature].toLowerCase())}.`
      : "No hay vecinas disponibles.";
    nodes.evidence.textContent = `Distancia euclídea sobre seis variables normalizadas. La proyección conserva ${pct(data.quality.neighborhood_preservation)} de las vecindades k=${data.quality.neighborhood_k} en promedio; para esta canción mantiene ${kept} de 10.`;
    findings = [
      `Las vecinas coinciden con la canción en ${and(LABELS[p1.feature].toLowerCase(), LABELS[p2.feature].toLowerCase())} (diferencia media de ${fmt(p1.value)} y ${fmt(p2.value)}) y se separan más en ${LABELS[farthest.feature].toLowerCase()} (${fmt(farthest.value)}).`,
      `Las diez vecinas abarcan de ${d3.min(years)} a ${d3.max(years)} y pertenecen a ${artists.size} artistas distintos: un mismo perfil de audio aparece en épocas y catálogos muy diferentes.`,
      `Popularidad mediana de las vecinas: ${d3.median(neighbors, item => item.record.popularity).toFixed(0)} frente a ${selected.popularity.toFixed(0)} de la canción consulta; el parecido sonoro no implica parecido en popularidad.`,
      `En el plano MDS ${kept} de las 10 vecinas siguen entre las 10 más cercanas: la proyección orienta la búsqueda pero el ranking se calcula en seis dimensiones.`
    ];
    nodes.what.textContent = "Una canción consulta y sus diez vecinas en seis variables normalizadas.";
    nodes.why.textContent = "Encontrar candidatas para ampliar una playlist manteniendo un perfil sonoro parecido.";
    nodes.how.textContent = "MDS es principal porque ordena por proximidad; Parallel Coordinates explica las diferencias atributo por atributo.";
    nodes.limit.textContent = "MDS muestra proximidad, no clusters; la similitud no incorpora género, gustos ni contexto de escucha.";
  } else if (state.taskId === "task3") {
    const task = data.tasks.task3;
    nodes.kicker.textContent = "Tarea 3 · Diseñar un perfil";
    nodes.title.textContent = "Playlist energética, positiva y bailable";
    nodes.result.textContent = `${task.target_size} canciones forman el conjunto inicial de candidatas para este brief sonoro. Su perfil mediano combina energía ${fmt2(task.target_profile.original.energy)}, valencia ${fmt2(task.target_profile.original.valence)} y bailabilidad ${fmt2(task.target_profile.original.danceability)} con acústica ${fmt2(task.target_profile.original.acousticness)}.`;
    nodes.evidence.textContent = `Perfil inicial: ${task.target_definition}. Star Coordinates permite cambiar el peso y la dirección de cada atributo para explorar otro brief.`;
    findings = task.findings;
    nodes.what.textContent = "Seis atributos de audio normalizados y un perfil objetivo explícito para una playlist.";
    nodes.why.textContent = "Explorar candidatas para un ambiente musical definido por atributos, no por una etiqueta de género inventada.";
    nodes.how.textContent = "Star Coordinates es principal porque permite cambiar dirección y peso de los atributos; RadViz y Parallel ayudan a verificar los perfiles.";
    nodes.limit.textContent = "El brief es una configuración inicial y no equivale a una emoción universal ni a una recomendación personalizada.";
  } else {
    const task = data.tasks.task4;
    const decades = task.decades;
    const focus = decades.find(item => item.decade === state.focusDecade);
    nodes.kicker.textContent = "Tarea 4 · Examinar evolución";
    nodes.title.textContent = "Perfil sonoro de las canciones populares a través de las décadas";
    nodes.result.textContent = task.findings[0] || `Se comparan perfiles agregados desde ${decades[0]?.label} hasta ${decades[decades.length - 1]?.label}.`;
    nodes.evidence.textContent = `${decades.length} décadas completas del dataset limpio (${int(data.metadata.clean_rows)} canciones). En cada década el top 25 % se define por ranking de popularidad dentro de la propia década; la trayectoria de RadViz une sus perfiles medianos en orden cronológico.`;
    findings = task.findings.slice(1);
    if (focus) {
      findings = [
        `${focus.label} (${focus.year_min}–${focus.year_max}): ${int(focus.count)} canciones; el top 25 % (${int(focus.popular_count)}) tiene popularidad ≥ ${focus.popular_cut.toFixed(0)}. Perfil popular: energía ${fmt2(focus.popular_profile.original.energy)}, acústica ${fmt2(focus.popular_profile.original.acousticness)}, bailabilidad ${fmt2(focus.popular_profile.original.danceability)}, valencia ${fmt2(focus.popular_profile.original.valence)}.`,
        ...findings
      ];
    }
    nodes.what.textContent = "Año, popularidad y seis atributos de audio; las canciones se agregan por décadas completas con suficiente observación.";
    nodes.why.textContent = "Explorar cómo cambia el catálogo popular y qué dimensiones explican diferencias temporales.";
    nodes.how.textContent = "RadViz es principal porque compara perfiles multidimensionales agregados y su trayectoria muestra la dirección del cambio; el gráfico de evolución detalla cada atributo y Parallel Coordinates compara los perfiles por década.";
    nodes.limit.textContent = "No se infiere causalidad histórica; la popularidad es la del catálogo de Spotify en 2020 y en las primeras décadas es mayoritariamente cero.";
  }
  d3.select("#analysis-findings").selectAll("li").data(findings).join("li").text(text => text);
}

function targetSummary(data) {
  const profile = data.tasks.task3.target_profile;
  return [{...profile, id: "target", series: "target", label: "Perfil objetivo", color: TASK_COLORS.target}];
}

function decadeSummaries(data, store, series) {
  return data.tasks.task4.decades.map(item => {
    const profile = series === "popular" ? item.popular_profile : item.profile;
    return {
      ...profile,
      id: `decade-${series}-${item.decade}`,
      series,
      label: series === "popular" ? item.label : `${item.label} (todas)`,
      decade: item.decade,
      order: item.decade,
      color: store.decadeColor(item.decade),
      width: 2.2
    };
  });
}

function radvizSummaries(data, taskId, store) {
  if (taskId === "task3") return targetSummary(data);
  if (taskId === "task4") return [...decadeSummaries(data, store, "all"), ...decadeSummaries(data, store, "popular")];
  return [];
}

function pairRecords(data, state) {
  return [state.selectedId, state.selectedIdB].map((uid, index) => {
    const record = data.records.find(item => item.uid === uid);
    return record ? {...record, id: `pair-${index}`, label: index === 0 ? "Canción A" : "Canción B", color: index === 0 ? TASK_COLORS.songA : TASK_COLORS.songB} : null;
  }).filter(Boolean);
}

function fillSelection(record) {
  if (!record) return;
  document.querySelector("#selected-name").textContent = record.name;
  document.querySelector("#selected-meta").textContent = `${record.artist} · ${record.year || "año no disponible"} · popularidad ${record.popularity.toFixed(0)}${record.explicit ? " · explícita" : ""}`;
  d3.select("#selected-features").selectAll("div").data(FEATURES).join("div")
    .html(feature => `<span>${LABELS[feature]}</span><strong>${fmt(record.original[feature])}</strong>`);
}

function fillLegend(data, state, store) {
  const taskId = state.taskId;
  let entries;
  if (taskId === "task1") {
    entries = [[TASK_COLORS.songA, "Canción A"], [TASK_COLORS.songB, "Canción B"], [TASK_COLORS.context, "Otras canciones (contexto tenue)"]];
  } else if (taskId === "task2") {
    entries = [[TASK_COLORS.selected, "Seleccionada"], [TASK_COLORS.neighbor, "10 vecinas"], [TASK_COLORS.context, "Resto"]];
  } else if (taskId === "task3") {
    entries = [[TASK_COLORS.candidate, `Candidatas al brief (${data.tasks.task3.target_size})`], [TASK_COLORS.target, "Perfil objetivo mediano"], [TASK_COLORS.context, "Otras canciones (tenues)"]];
  } else {
    entries = [
      ...data.tasks.task4.decades.map(item => [store.decadeColor(item.decade), item.label]),
      ["#17222e", "Trayectoria del top 25 % popular", "line"],
      ["#6b7b80", "Perfil de toda la década (hueco)", "hollow"]
    ];
  }
  const html = entry => `<i class="${entry[2] || ""}" style="${entry[2] === "hollow" ? `border-color:${entry[0]}` : `background:${entry[0]}`}"></i><span>${escapeHtml(entry[1])}</span>`;
  d3.select("#legend").selectAll("div").data(entries).join("div").html(html);
  d3.select("#active-legend").selectAll("div").data(entries).join("div").html(html);
  document.querySelector("#active-legend-note").textContent = taskId === "task1"
    ? "Las líneas finas son canciones; las entrecortadas son directamente Canción A y Canción B (no medianas)."
    : taskId === "task2"
      ? "El punto morado es la canción seleccionada; los naranjas son sus diez vecinas."
      : taskId === "task3"
        ? "Los puntos rosados son candidatas al brief; el marcador oscuro es su perfil mediano."
        : "El color ordena las décadas. La trayectoria une el perfil mediano del top 25 % de cada década; haz clic en una década para enfocarla en todas las vistas.";
}

function fillEvidence(data, state, store) {
  const title = document.querySelector("#evidence-title");
  const description = document.querySelector("#evidence-description");
  const content = d3.select("#evidence-content");
  content.html("");
  if (state.taskId === "task1") {
    title.textContent = "Cómo leer la comparación"; description.textContent = "Cada canción aparece como una línea fina. Las líneas entrecortadas corresponden directamente a Canción A y Canción B; no son medianas ni grupos artificiales. Los valores originales están en la escala 0–1 de Spotify.";
    const left = data.records.find(record => record.uid === state.selectedId), right = data.records.find(record => record.uid === state.selectedIdB) || left;
    addTable(content, ["Atributo", "Canción A", "Canción B", "Diferencia normalizada"], FEATURES.map(feature => [LABELS[feature], fmt(left.original[feature]), fmt(right.original[feature]), fmt(Math.abs(left.normalized[feature] - right.normalized[feature]))]));
  } else if (state.taskId === "task2") {
    title.textContent = "Ranking verificable de vecinas"; description.textContent = "El orden se calcula con distancia euclídea sobre las seis variables normalizadas; año y popularidad sirven de contexto.";
    addTable(content, ["#", "Canción", "Artista", "Año", "Popularidad", "Distancia"], nearestRecords(data.records, state.selectedId, 10).map((item, index) => [index + 1, item.record.name, item.record.artist, item.record.year || "—", item.record.popularity.toFixed(0), fmt(item.distance)]));
  } else if (state.taskId === "task3") {
    const task = data.tasks.task3;
    title.textContent = "Perfil objetivo frente al resto de la muestra"; description.textContent = `Medianas de las ${task.target_size} candidatas iniciales y de las demás canciones de la muestra; puedes modificar los ejes de Star Coordinates para explorar otro brief.`;
    addTable(content, ["Atributo", "Candidatas (mediana)", "Resto de la muestra", "Diferencia"], FEATURES.map(feature => [LABELS[feature], fmt(task.target_profile.original[feature]), fmt(task.rest_profile.original[feature]), d3.format("+.3f")(task.target_profile.original[feature] - task.rest_profile.original[feature])]));
  } else {
    title.textContent = "Décadas completas con evidencia suficiente"; description.textContent = "Cada fila agrega una década completa del dataset limpio (por ejemplo 1921–1929 = 1920s). El corte es la popularidad mínima del top 25 %; en las décadas con mayoría de ceros el corte es 0 o 1 y la comparación popular/no popular pierde sentido.";
    const rows = data.tasks.task4.decades.map(item => [
      item.label, int(item.count), int(item.popular_count), item.popular_cut.toFixed(0), pct0(item.popularity_zero_share),
      fmt2(item.popular_profile.original.energy), fmt2(item.popular_profile.original.acousticness), fmt2(item.popular_profile.original.danceability), fmt2(item.popular_profile.original.valence), fmt2(item.popular_profile.original.speechiness)
    ]);
    const table = addTable(content, ["Década", "Canciones", "Top 25 %", "Corte popularidad", "Con popularidad 0", "Energía", "Acústica", "Bailabilidad", "Valencia", "Habla"], rows);
    table.selectAll("tbody tr").data(data.tasks.task4.decades)
      .classed("is-focus", item => item.decade === state.focusDecade)
      .style("cursor", "pointer")
      .on("click", (event, item) => store.toggleDecade(item.decade));
    content.append("p").attr("class", "table-note").text("Las últimas cinco columnas son medianas del top 25 % popular en unidades originales 0–1. Haz clic en una fila para enfocar esa década.");
  }
}

function addTable(container, headers, rows) {
  const table = container.append("table").attr("class", "evidence-table");
  table.append("thead").append("tr").selectAll("th").data(headers).join("th").text(header => header);
  table.append("tbody").selectAll("tr").data(rows).join("tr").selectAll("td").data(row => row).join("td").text(value => value);
  return table;
}

boot().catch(error => {
  document.body.innerHTML = `<main class="fatal"><h1>No se pudo iniciar la aplicación</h1><p>${escapeHtml(error.message)}</p></main>`;
  console.error(error);
});
