import {nearestRecords} from "./math.js";

export const TASK_COLORS = {
  songA: "#e4572e",
  songB: "#2878b5",
  selected: "#6f42c1",
  neighbor: "#ef9b20",
  candidate: "#c44569",
  target: "#17222e",
  context: "#cbd2d9"
};

export class Store {
  constructor(data) {
    this.data = data;
    const decades = data.tasks.task4?.decades || [];
    // Ordered colour scale for the decades (light for old, dark for recent):
    // d3.scaleLinear as in class, with colours as the output range.
    const first = decades.length ? decades[0].decade : 1920;
    const last = decades.length ? decades[decades.length - 1].decade : 2020;
    this.decadeScale = d3.scaleLinear().domain([first, (first + last) / 2, last]).range(["#e9c46a", "#2a9d8f", "#1d3557"]);
    this.decadeColors = new Map(decades.map(item => [item.decade, this.decadeScale(item.decade)]));
    this.listeners = new Set();
    this.state = {
      taskId: "task1",
      selectedId: data.tasks.task2.default_uid,
      selectedIdB: data.tasks.task1.default_pair_uids?.[1] || data.tasks.task2.default_uid,
      hoverId: null,
      focusIds: new Set(),
      neighborIds: new Set(),
      brushedIds: null,
      focusDecade: null,
      explorationChanged: false
    };
    this.replayTask("task1", false);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(reason = "state") {
    for (const listener of this.listeners) listener(this.state, reason);
  }

  patch(changes, reason = "explore", markChanged = true) {
    Object.assign(this.state, changes);
    if (markChanged) this.state.explorationChanged = true;
    this.emit(reason);
  }

  select(uid, markChanged = true) {
    const neighbors = nearestRecords(this.data.records, uid, 10);
    const neighborIds = new Set(neighbors.map(item => item.record.uid));
    const changes = {selectedId: uid, neighborIds};
    if (this.state.taskId === "task1") changes.focusIds = new Set([uid, this.state.selectedIdB]);
    if (this.state.taskId === "task2") changes.focusIds = new Set([uid, ...neighborIds]);
    this.patch(changes, "selection", markChanged);
  }

  hover(uid) {
    if (uid === this.state.hoverId) return;
    this.patch({hoverId: uid}, "hover", false);
  }

  // Task 4: clicking a decade (RadViz mark or evolution chart) focuses its songs everywhere.
  toggleDecade(decade) {
    const focusDecade = this.state.focusDecade === decade ? null : decade;
    this.patch({focusDecade}, "decade", true);
  }

  decadeColor(decade) {
    return this.decadeColors.get(decade) || "#4c78a8";
  }

  replayTask(taskId, emit = true) {
    const records = this.data.records;
    const selectedId = this.data.tasks.task2.default_uid;
    const pair = this.data.tasks.task1.default_pair_uids || [selectedId, selectedId];
    let focusIds;
    let neighborIds = new Set();
    if (taskId === "task1") {
      focusIds = new Set(pair);
    } else if (taskId === "task2") {
      neighborIds = new Set(nearestRecords(records, selectedId, 10).map(item => item.record.uid));
      focusIds = new Set([selectedId, ...neighborIds]);
    } else if (taskId === "task3") {
      focusIds = new Set(this.data.tasks.task3.target_uids || []);
    } else {
      const eligible = new Set(this.data.tasks.task4?.eligible_decades || []);
      focusIds = new Set(records.filter(record => eligible.has(record.decade)).map(record => record.uid));
    }
    Object.assign(this.state, {
      taskId,
      selectedId: taskId === "task1" ? pair[0] : selectedId,
      selectedIdB: pair[1],
      focusIds,
      neighborIds,
      brushedIds: null,
      hoverId: null,
      focusDecade: null,
      explorationChanged: false
    });
    if (emit) this.emit("replay");
  }

  color(record) {
    if (this.state.taskId === "task1") {
      return record.uid === this.state.selectedId ? TASK_COLORS.songA : record.uid === this.state.selectedIdB ? TASK_COLORS.songB : TASK_COLORS.context;
    }
    if (this.state.taskId === "task2") {
      return record.uid === this.state.selectedId ? TASK_COLORS.selected : this.state.neighborIds.has(record.uid) ? TASK_COLORS.neighbor : TASK_COLORS.context;
    }
    if (this.state.taskId === "task3") return this.state.focusIds.has(record.uid) ? TASK_COLORS.candidate : TASK_COLORS.context;
    return this.decadeColor(record.decade);
  }

  opacity(record) {
    if (record.uid === this.state.selectedId || record.uid === this.state.hoverId) return 1;
    if (this.state.brushedIds && !this.state.brushedIds.has(record.uid)) return 0.035;
    if (this.state.taskId === "task4") {
      if (this.state.focusDecade !== null) return record.decade === this.state.focusDecade ? 0.85 : 0.05;
      return this.state.focusIds.has(record.uid) ? 0.32 : 0.08;
    }
    return this.state.focusIds.has(record.uid) ? 0.76 : 0.16;
  }

  radius(record, base = 3) {
    if (record.uid === this.state.selectedId) return base + 3;
    if (record.uid === this.state.hoverId) return base + 2;
    return base;
  }
}
