export const FEATURES = ["energy", "valence", "danceability", "acousticness", "instrumentalness", "speechiness"];

export const LABELS = {
  energy: "Energía",
  valence: "Valencia",
  danceability: "Bailabilidad",
  acousticness: "Acústica",
  instrumentalness: "Instrumentalidad",
  speechiness: "Habla"
};

export function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

export function euclidean(a, b, features = FEATURES) {
  return Math.sqrt(features.reduce((sum, feature) => sum + (a[feature] - b[feature]) ** 2, 0));
}

export function nearestRecords(records, selectedUid, count = 10) {
  const selected = records.find(record => record.uid === selectedUid);
  if (!selected) return [];
  return records
    .filter(record => record.uid !== selectedUid)
    .map(record => ({record, distance: euclidean(selected.normalized, record.normalized)}))
    .sort((a, b) => a.distance - b.distance || a.record.uid.localeCompare(b.record.uid))
    .slice(0, count);
}

export function radvizPoint(record, anchors, features = FEATURES) {
  const weights = features.map(feature => record.normalized[feature]);
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (total === 0) return null;
  return {
    x: features.reduce((sum, feature, index) => sum + anchors[feature].x * weights[index], 0) / total,
    y: features.reduce((sum, feature, index) => sum + anchors[feature].y * weights[index], 0) / total
  };
}

export function starPoint(record, axes, features = FEATURES) {
  const divisor = features.length;
  return {
    x: features.reduce((sum, feature) => sum + record.normalized[feature] * axes[feature].weight * Math.cos(axes[feature].angle), 0) / divisor,
    y: features.reduce((sum, feature) => sum + record.normalized[feature] * axes[feature].weight * Math.sin(axes[feature].angle), 0) / divisor
  };
}
