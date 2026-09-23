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
// single axis lands exactly on that axis tip (step 4 of the class notebook:
// P_scaled = r · P).
export const STAR_SCALE = 0.6;
export const STAR_MAX_WEIGHT = 1.5;

export function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

// Same euclidean distance as the class notebook, over the six normalized features.
export function euclidean(a, b, features = FEATURES) {
  let sum = 0;
  for (let i = 0; i < features.length; i++) {
    const d = a[features[i]] - b[features[i]];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

// k nearest records, same idea as kNearestNeighbors in the notebook.
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

// RadViz (class notebook, step 3): P_i = Σ_j (x_ij / Σ_j x_ij) · S_j
export function radvizPoint(record, anchors, features = FEATURES) {
  let suma = 0, x = 0, y = 0;
  for (let j = 0; j < features.length; j++) {
    const value = record.normalized[features[j]];
    suma += value;
    x += value * anchors[features[j]].x;
    y += value * anchors[features[j]].y;
  }
  if (suma === 0) return null;
  return {x: x / suma, y: y / suma};
}

// Star Coordinates (class notebook, step 3): P_i = Σ_j x_ij · S_j, where the
// axis vector S_j has direction θ_j and length w_j (its weight). The result is
// in "axis units": multiply by radius × STAR_SCALE to obtain pixels, exactly
// the same factor used to draw the axis vectors.
export function starPoint(record, axes, features = FEATURES) {
  let x = 0, y = 0;
  for (let j = 0; j < features.length; j++) {
    const axis = axes[features[j]];
    const value = record.normalized[features[j]];
    x += value * axis.weight * Math.cos(axis.angle);
    y += value * axis.weight * Math.sin(axis.angle);
  }
  return {x, y};
}

// Share (0–1) of reference values that are lower than or equal to `value`.
// `percentiles` holds the 0..100 percentiles of the pairwise distances.
export function percentileOf(percentiles, value) {
  if (!Array.isArray(percentiles) || !percentiles.length) return null;
  const below = percentiles.filter(reference => reference <= value).length;
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
      let total = 0;
      neighbors.forEach(item => { total += Math.abs(item.record.normalized[feature] - selected.normalized[feature]); });
      return {feature, value: neighbors.length ? total / neighbors.length : 0};
    })
    .sort((p, q) => p.value - q.value);
}
