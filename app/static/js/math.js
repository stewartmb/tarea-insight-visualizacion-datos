export const FEATURES = ["energy", "valence", "danceability", "acousticness", "instrumentalness", "speechiness"];

export const LABELS = {
  energy: "Energía",
  valence: "Valencia",
  danceability: "Bailabilidad",
  acousticness: "Acústica",
  instrumentalness: "Instrumentalidad",
  speechiness: "Habla"
};

// Fraction of the chart radius covered by a Star Coordinates axis of weight 1.
// The same factor scales the projected points, so a record with value 1 on a
// single axis lands exactly on that axis tip.
export const STAR_SCALE = 0.6;
export const STAR_MAX_WEIGHT = 1.5;

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

// Nearest records measured on the two projected MDS coordinates. Used to check
// how many high-dimensional neighbours the projection keeps close.
export function nearestProjected(records, selectedUid, count = 10) {
  const selected = records.find(record => record.uid === selectedUid);
  if (!selected) return [];
  return records
    .filter(record => record.uid !== selectedUid)
    .map(record => ({record, distance: Math.hypot(record.mds[0] - selected.mds[0], record.mds[1] - selected.mds[1])}))
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

// Star Coordinates: P = Σ v_i · w_i · (cos θ_i, sin θ_i). The result is in
// "axis units": multiply by radius × STAR_SCALE to obtain pixels, exactly the
// same factor used to draw the axis vectors.
export function starPoint(record, axes, features = FEATURES) {
  return {
    x: features.reduce((sum, feature) => sum + record.normalized[feature] * axes[feature].weight * Math.cos(axes[feature].angle), 0),
    y: features.reduce((sum, feature) => sum + record.normalized[feature] * axes[feature].weight * Math.sin(axes[feature].angle), 0)
  };
}

// Share (0–1) of reference values that are lower than or equal to `value`.
// `percentiles` holds the 0..100 percentiles of the pairwise distances.
export function percentileOf(percentiles, value) {
  if (!Array.isArray(percentiles) || !percentiles.length) return null;
  let below = 0;
  while (below < percentiles.length && percentiles[below] <= value) below += 1;
  return clamp(below / percentiles.length, 0, 1);
}

export function featureDifferences(a, b, features = FEATURES) {
  return features
    .map(feature => ({feature, value: Math.abs(a.normalized[feature] - b.normalized[feature])}))
    .sort((p, q) => q.value - p.value);
}

// Mean absolute normalized difference between a record and its neighbours,
// per feature, sorted from the most similar feature to the most different.
export function neighborhoodProfile(selected, neighbors, features = FEATURES) {
  return features
    .map(feature => {
      const total = neighbors.reduce((sum, item) => sum + Math.abs(item.record.normalized[feature] - selected.normalized[feature]), 0);
      return {feature, value: neighbors.length ? total / neighbors.length : 0};
    })
    .sort((p, q) => p.value - q.value);
}
