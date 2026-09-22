import {nearestRecords} from "./math.js";

export class Store {
  constructor(data) {
    this.data = data;
    this.listeners = new Set();
    this.state = {
      taskId: "task1",
      selectedId: data.tasks.task2.default_uid,
      hoverId: null,
      focusIds: new Set(),
      neighborIds: new Set(),
      brushedIds: null,
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
    if (this.state.taskId === "task2") changes.focusIds = new Set([uid, ...neighborIds]);
    this.patch(changes, "selection", markChanged);
  }

  hover(uid) {
    this.patch({hoverId: uid}, "hover", false);
  }

  replayTask(taskId, emit = true) {
    const records = this.data.records;
    const selectedId = this.data.tasks.task2.default_uid;
    let focusIds;
    let neighborIds = new Set();
    if (taskId === "task1") {
      focusIds = new Set(records.filter(record => record.energy_band !== "middle").map(record => record.uid));
    } else if (taskId === "task2") {
      neighborIds = new Set(nearestRecords(records, selectedId, 10).map(item => item.record.uid));
      focusIds = new Set([selectedId, ...neighborIds]);
    } else if (taskId === "task3") {
      focusIds = new Set(records.filter(record => record.contrast !== "other").map(record => record.uid));
    } else {
      const eligible = new Set((this.data.tasks.task4?.eligible_decades || []).slice(-4));
      focusIds = new Set(records.filter(record => eligible.has(record.decade)).map(record => record.uid));
    }
    Object.assign(this.state, {
      taskId,
      selectedId,
      focusIds,
      neighborIds,
      brushedIds: null,
      hoverId: null,
      explorationChanged: false
    });
    if (emit) this.emit("replay");
  }

  color(record) {
    if (this.state.taskId === "task1") {
      return record.energy_band === "high" ? "#e4572e" : record.energy_band === "low" ? "#2878b5" : "#cbd2d9";
    }
    if (this.state.taskId === "task2") {
      return record.uid === this.state.selectedId ? "#6f42c1" : this.state.neighborIds.has(record.uid) ? "#ef9b20" : "#cbd2d9";
    }
    if (this.state.taskId === "task3") return record.contrast === "energetic_somber" ? "#c44569" : record.contrast === "calm_positive" ? "#278c82" : "#cbd2d9";
    return "#4c78a8";
  }

  opacity(record) {
    if (record.uid === this.state.selectedId || record.uid === this.state.hoverId) return 1;
    if (this.state.brushedIds && !this.state.brushedIds.has(record.uid)) return 0.035;
    return this.state.focusIds.has(record.uid) ? 0.76 : 0.12;
  }

  radius(record, base = 3) {
    if (record.uid === this.state.selectedId) return base + 3;
    if (record.uid === this.state.hoverId) return base + 2;
    return base;
  }
}
