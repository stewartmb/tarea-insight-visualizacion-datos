#!/usr/bin/env python3
"""Prepare the exact Spotify dataset referenced by the assignment.

Visual output is produced only by D3. This script performs reproducible
cleaning, sampling, classical MDS, decade aggregation and the numeric
findings that the interface and the report quote.
"""

from __future__ import annotations

import argparse
import ast
import csv
import hashlib
import json
import math
import random
from collections import Counter
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "data" / "original" / "data.csv"
DEFAULT_OUTPUT = ROOT / "data" / "processed" / "analysis.json"
SOURCE_URL = "https://www.kaggle.com/datasets/yamaerenay/spotify-dataset-1921-2020-160k-tracks?select=data.csv"
FEATURES = (
    "energy",
    "valence",
    "danceability",
    "acousticness",
    "instrumentalness",
    "speechiness",
)
LABELS = {
    "energy": "energía",
    "valence": "valencia",
    "danceability": "bailabilidad",
    "acousticness": "acústica",
    "instrumentalness": "instrumentalidad",
    "speechiness": "habla",
}
SEED = 5343
SAMPLE_LIMIT = 800
MIN_DECADE_COUNT = 20
POPULAR_SHARE = 0.25
TARGET_SIZE = 60


def minmax_normalize(
    values: np.ndarray, feature_names: tuple[str, ...] | list[str] | None = None
) -> tuple[np.ndarray, list[int], dict[str, dict[str, float]]]:
    names = list(feature_names or FEATURES[: values.shape[1]])
    if len(names) != values.shape[1]:
        raise ValueError("La cantidad de nombres no coincide con las columnas.")
    mins = values.min(axis=0)
    maxs = values.max(axis=0)
    active = [i for i, (lo, hi) in enumerate(zip(mins, maxs)) if hi > lo]
    if not active:
        raise ValueError("Todas las variables seleccionadas son constantes.")
    normalized = np.zeros_like(values, dtype=float)
    normalized[:, active] = (values[:, active] - mins[active]) / (maxs[active] - mins[active])
    ranges = {
        names[i]: {"min": float(mins[i]), "max": float(maxs[i]), "constant": i not in active}
        for i in range(len(names))
    }
    return normalized, active, ranges


def pairwise_distances(values: np.ndarray) -> np.ndarray:
    squared = np.sum(values * values, axis=1, keepdims=True)
    distances_squared = np.maximum(squared + squared.T - 2 * values @ values.T, 0.0)
    return np.sqrt(distances_squared)


def classical_mds(values: np.ndarray, dimensions: int = 2) -> tuple[np.ndarray, np.ndarray]:
    distances = pairwise_distances(values)
    distances_squared = distances**2
    row_mean = distances_squared.mean(axis=1, keepdims=True)
    column_mean = distances_squared.mean(axis=0, keepdims=True)
    grand_mean = distances_squared.mean()
    gram = -0.5 * (distances_squared - row_mean - column_mean + grand_mean)
    eigenvalues, eigenvectors = np.linalg.eigh(gram)
    order = np.argsort(eigenvalues)[::-1]
    positive = [i for i in order if eigenvalues[i] > 1e-12][:dimensions]
    if len(positive) < dimensions:
        raise ValueError("MDS no produjo dos autovalores positivos.")
    coordinates = eigenvectors[:, positive] * np.sqrt(eigenvalues[positive])
    return coordinates, eigenvalues[order]


def nearest_neighbor_indices(distances: np.ndarray, k: int) -> np.ndarray:
    n = len(distances)
    k = min(max(1, k), n - 1)
    adjusted = distances.copy()
    np.fill_diagonal(adjusted, np.inf)
    # mergesort makes ties deterministic.
    return np.argsort(adjusted, axis=1, kind="mergesort")[:, :k]


def projection_quality(original: np.ndarray, projected: np.ndarray, k: int = 10) -> dict[str, float | int]:
    high = pairwise_distances(original)
    low = pairwise_distances(projected)
    denominator = float(np.sum(high**2))
    normalized_stress = math.sqrt(float(np.sum((high - low) ** 2)) / denominator) if denominator else 0.0
    upper = np.triu_indices(len(original), 1)
    correlation = float(np.corrcoef(high[upper], low[upper])[0, 1]) if len(original) > 2 else 1.0
    k = min(k, len(original) - 1)
    high_neighbors = nearest_neighbor_indices(high, k)
    low_neighbors = nearest_neighbor_indices(low, k)
    preserved = [len(set(a).intersection(b)) / k for a, b in zip(high_neighbors, low_neighbors)]
    return {
        "normalized_stress": normalized_stress,
        "distance_correlation": correlation,
        "neighborhood_k": k,
        "neighborhood_preservation": float(np.mean(preserved)),
    }


def parse_artist(value: str) -> str:
    try:
        parsed = ast.literal_eval(value)
        if isinstance(parsed, list) and parsed:
            return ", ".join(str(item) for item in parsed)
    except (SyntaxError, ValueError):
        pass
    return value.strip("[]'\" ") or "Artista no disponible"


def numeric_column(rows: list[dict], key: str, default: float = 0.0) -> np.ndarray:
    values = []
    for row in rows:
        try:
            values.append(float(row.get(key) or default))
        except (TypeError, ValueError):
            values.append(default)
    return np.array(values, dtype=float)


def median_profile(matrix: np.ndarray, mask: np.ndarray) -> dict[str, float]:
    if not np.any(mask):
        return {feature: float("nan") for feature in FEATURES}
    medians = np.median(matrix[mask], axis=0)
    return {feature: float(medians[i]) for i, feature in enumerate(FEATURES)}


def profile_pair(original: np.ndarray, normalized: np.ndarray, mask: np.ndarray) -> dict:
    """Keep the two representations explicit for tables and D3 summaries."""
    return {
        "count": int(mask.sum()),
        "original": median_profile(original, mask),
        "normalized": median_profile(normalized, mask),
    }


def rank_split(popularity: np.ndarray, indices: np.ndarray, share: float = POPULAR_SHARE) -> tuple[np.ndarray, np.ndarray]:
    """Return the top and bottom `share` of `indices` ranked by popularity.

    The ranking is computed inside the group (a decade), so the cut adapts to
    the popularity scale of each period instead of favouring recent years.
    Ties are broken by the original row order (mergesort keeps it stable).
    """
    indices = np.asarray(indices)
    if len(indices) == 0:
        return indices, indices
    size = max(1, math.ceil(len(indices) * share))
    order = indices[np.argsort(-popularity[indices], kind="mergesort")]
    return order[:size], order[-size:]


def correlation_matrix(values: np.ndarray) -> dict:
    matrix = np.corrcoef(values, rowvar=False)
    return {
        "features": list(FEATURES),
        "matrix": [[float(cell) for cell in row] for row in matrix],
        "rows": int(len(values)),
    }


def decade_summaries(raw_rows: list[dict], full_values: np.ndarray, full_normalized: np.ndarray) -> list[dict]:
    """Aggregate every decade of the cleaned dataset (not only the sample)."""
    years = numeric_column(raw_rows, "year").astype(int)
    popularity = numeric_column(raw_rows, "popularity")
    row_decades = (years // 10) * 10
    profiles = []
    for decade in sorted({int(value) for value in row_decades[years > 0]}):
        decade_indices = np.flatnonzero(row_decades == decade)
        count = int(len(decade_indices))
        if count < MIN_DECADE_COUNT:
            continue
        popular_indices, nonpopular_indices = rank_split(popularity, decade_indices)
        decade_mask = np.zeros(len(raw_rows), dtype=bool)
        decade_mask[decade_indices] = True
        popular_mask = np.zeros(len(raw_rows), dtype=bool)
        popular_mask[popular_indices] = True
        nonpopular_mask = np.zeros(len(raw_rows), dtype=bool)
        nonpopular_mask[nonpopular_indices] = True
        decade_popularity = popularity[decade_indices]
        profiles.append(
            {
                "decade": decade,
                "label": f"{decade}s",
                "year_min": int(years[decade_indices].min()),
                "year_max": int(years[decade_indices].max()),
                "count": count,
                "popular_count": int(popular_mask.sum()),
                "nonpopular_count": int(nonpopular_mask.sum()),
                "popular_cut": float(popularity[popular_indices].min()),
                "nonpopular_cut": float(popularity[nonpopular_indices].max()),
                "popularity_median": float(np.median(decade_popularity)),
                "popularity_zero_share": float(np.mean(decade_popularity == 0)),
                "profile": profile_pair(full_values, full_normalized, decade_mask),
                "popular_profile": profile_pair(full_values, full_normalized, popular_mask),
                "nonpopular_profile": profile_pair(full_values, full_normalized, nonpopular_mask),
            }
        )
    return profiles


def decade_findings(decades: list[dict]) -> dict:
    """Numeric findings for the temporal task, derived only from the data."""
    if len(decades) < 2:
        return {"findings": [], "trend": {}}
    first, last = decades[0], decades[-1]
    popular = lambda item, feature: item["popular_profile"]["original"][feature]  # noqa: E731
    overall = lambda item, feature: item["profile"]["original"][feature]  # noqa: E731
    trend = {
        feature: {
            "first": popular(first, feature),
            "last": popular(last, feature),
            "delta": popular(last, feature) - popular(first, feature),
        }
        for feature in FEATURES
    }
    ordered = sorted(FEATURES, key=lambda feature: -abs(trend[feature]["delta"]))
    f1, f2 = ordered[0], ordered[1]
    shifts = [
        (decades[i], decades[i + 1], feature, popular(decades[i + 1], feature) - popular(decades[i], feature))
        for i in range(len(decades) - 1)
        for feature in FEATURES
    ]
    shift_from, shift_to, shift_feature, shift_delta = max(shifts, key=lambda item: abs(item[3]))
    weak = [item["label"] for item in decades if item["popular_cut"] <= 1]
    # The popular-vs-decade gap is only meaningful where popularity is not mostly zero.
    strong = [item for item in decades if item["popular_cut"] > 1] or decades
    gaps = [(item, feature, popular(item, feature) - overall(item, feature)) for item in strong for feature in FEATURES]
    gap_decade, gap_feature, gap_delta = max(gaps, key=lambda item: abs(item[2]))
    peaks = {feature: max(decades, key=lambda item: popular(item, feature)) for feature in FEATURES}
    speech_low = min(decades, key=lambda item: popular(item, "speechiness"))
    speech_ratio = popular(last, "speechiness") / max(popular(speech_low, "speechiness"), 1e-9)
    findings = [
        (
            f"Entre {first['label']} y {last['label']} el cambio más grande en el perfil de las canciones populares "
            f"está en {LABELS[f1]}: su mediana pasa de {trend[f1]['first']:.2f} a {trend[f1]['last']:.2f}. "
            f"Le sigue {LABELS[f2]} ({trend[f2]['first']:.2f} → {trend[f2]['last']:.2f})."
        ),
        (
            f"El salto más brusco entre décadas consecutivas ocurre en {LABELS[shift_feature]} de {shift_from['label']} "
            f"a {shift_to['label']} ({popular(shift_from, shift_feature):.2f} → {popular(shift_to, shift_feature):.2f})."
        ),
        (
            f"La década donde el top 25 % se separa más del conjunto es {gap_decade['label']}: su {LABELS[gap_feature]} "
            f"mediana es {popular(gap_decade, gap_feature):.2f} frente a {overall(gap_decade, gap_feature):.2f} en toda la década."
        ),
        (
            f"La bailabilidad mediana de las populares alcanza su máximo en {peaks['danceability']['label']} "
            f"({popular(peaks['danceability'], 'danceability'):.2f}) y la habla de {last['label']} "
            f"({popular(last, 'speechiness'):.2f}) es {speech_ratio:.1f} veces la de {speech_low['label']} "
            f"({popular(speech_low, 'speechiness'):.2f})"
            + (", consistente con el peso del rap y del pop urbano en el catálogo reciente." if speech_ratio >= 1.5 else ".")
        ),
    ]
    if weak:
        findings.append(
            f"En {', '.join(weak)} la mayoría de canciones tiene popularidad 0 en Spotify; allí el top 25 % equivale a las "
            "canciones que aún conservan alguna reproducción y debe leerse con cautela."
        )
    return {
        "findings": findings,
        "trend": trend,
        "largest_shift": {
            "feature": shift_feature,
            "from": shift_from["label"],
            "to": shift_to["label"],
            "delta": shift_delta,
        },
        "largest_popular_gap": {"decade": gap_decade["label"], "feature": gap_feature, "delta": gap_delta},
        "weak_popularity_decades": weak,
    }


def build_analysis(input_path: Path, sample_limit: int = SAMPLE_LIMIT, seed: int = SEED) -> dict:
    raw_rows: list[dict[str, str]] = []
    exact_seen: set[tuple[str, ...]] = set()
    exact_duplicates = 0
    invalid_rows = 0

    with input_path.open(newline="", encoding="utf-8") as stream:
        reader = csv.DictReader(stream)
        missing_columns = [column for column in (*FEATURES, "id", "name", "artists") if column not in (reader.fieldnames or [])]
        if missing_columns:
            raise ValueError(f"Faltan columnas requeridas: {', '.join(missing_columns)}")
        fieldnames = reader.fieldnames or []
        for row in reader:
            fingerprint = tuple(row.get(column, "") for column in fieldnames)
            if fingerprint in exact_seen:
                exact_duplicates += 1
                continue
            exact_seen.add(fingerprint)
            try:
                values = [float(row[feature]) for feature in FEATURES]
                if not all(math.isfinite(value) for value in values):
                    raise ValueError
            except (TypeError, ValueError):
                invalid_rows += 1
                continue
            row["_features"] = values
            raw_rows.append(row)

    full_values = np.array([row["_features"] for row in raw_rows], dtype=float)
    full_normalized, active_indices, ranges = minmax_normalize(full_values, FEATURES)
    active_features = [FEATURES[i] for i in active_indices]

    rng = random.Random(seed)
    sample_indices = sorted(rng.sample(range(len(raw_rows)), min(sample_limit, len(raw_rows))))
    sampled_rows = [raw_rows[i] for i in sample_indices]
    sample_original = full_values[sample_indices]
    sample_normalized = full_normalized[sample_indices]
    sample_active = sample_normalized[:, active_indices]

    coordinates, eigenvalues = classical_mds(sample_active)
    quality = projection_quality(sample_active, coordinates)

    id_counts: Counter[str] = Counter()
    uids: list[str] = []
    for index, row in zip(sample_indices, sampled_rows):
        base = row.get("id") or hashlib.sha1(f"{index}|{row.get('name')}|{row.get('artists')}".encode()).hexdigest()[:16]
        id_counts[base] += 1
        uids.append(base if id_counts[base] == 1 else f"{base}__{id_counts[base]}")

    sample_years = numeric_column(sampled_rows, "year").astype(int)
    sample_popularity = numeric_column(sampled_rows, "popularity")
    names = [row.get("name") or "Canción sin nombre" for row in sampled_rows]
    artists = [parse_artist(row.get("artists", "")) for row in sampled_rows]

    # A concrete playlist brief for the interactive Star Coordinates task:
    # energetic, positive and danceable, while avoiding excessive acousticness
    # and speechiness. The score is only a reproducible starting point; users
    # can change the axes/weights in the view.
    target_score = (
        sample_normalized[:, FEATURES.index("energy")]
        + sample_normalized[:, FEATURES.index("valence")]
        + sample_normalized[:, FEATURES.index("danceability")]
        - 0.5 * sample_normalized[:, FEATURES.index("acousticness")]
        - 0.25 * sample_normalized[:, FEATURES.index("speechiness")]
    )
    target_order = np.argsort(-target_score, kind="mergesort")
    target_indices = target_order[: min(TARGET_SIZE, len(target_order))]
    target_mask = np.zeros(len(sampled_rows), dtype=bool)
    target_mask[target_indices] = True

    default_index = max(
        range(len(sampled_rows)),
        key=lambda i: (float(sampled_rows[i].get("popularity") or 0), sampled_rows[i].get("name", "")),
    )
    high_distances = pairwise_distances(sample_active)
    default_neighbors = nearest_neighbor_indices(high_distances, 10)[default_index]
    contribution_values = np.mean((sample_active[default_neighbors] - sample_active[default_index]) ** 2, axis=0)
    contribution_total = float(contribution_values.sum()) or 1.0
    contributions = {
        active_features[i]: float(contribution_values[i] / contribution_total)
        for i in range(len(active_features))
    }
    upper = np.triu_indices(len(sample_active), 1)
    distance_percentiles = [float(value) for value in np.percentile(high_distances[upper], np.arange(0, 101))]

    records = []
    for position, (uid, row) in enumerate(zip(uids, sampled_rows)):
        original = {feature: float(sample_original[position, i]) for i, feature in enumerate(FEATURES)}
        normalized = {feature: float(sample_normalized[position, i]) for i, feature in enumerate(FEATURES)}
        year = int(sample_years[position])
        records.append(
            {
                "uid": uid,
                "spotify_id": row.get("id", ""),
                "name": names[position],
                "artist": artists[position],
                "year": year,
                "decade": (year // 10) * 10 if year else 0,
                "popularity": float(sample_popularity[position]),
                "explicit": row.get("explicit", "0") == "1",
                "original": original,
                "normalized": normalized,
                "mds": [float(coordinates[position, 0]), float(coordinates[position, 1])],
                "target_score": float(target_score[position]),
            }
        )

    # Task 3 findings: where do the candidates come from and what separates them.
    target_profile = profile_pair(sample_original, sample_normalized, target_mask)
    rest_profile = profile_pair(sample_original, sample_normalized, ~target_mask)
    candidate_decades = Counter(int(records[i]["decade"]) for i in target_indices)
    top_decade, top_decade_count = candidate_decades.most_common(1)[0]
    recent_share = float(np.mean(sample_years[target_indices] >= 1990))
    separation = {
        feature: target_profile["normalized"][feature] - rest_profile["normalized"][feature] for feature in FEATURES
    }
    most_positive = max(FEATURES, key=lambda feature: separation[feature])
    most_negative = min(FEATURES, key=lambda feature: separation[feature])
    examples = [f"“{names[i]}” de {artists[i]} ({sample_years[i]})" for i in target_indices[:3]]
    task3_findings = [
        (
            f"Las {int(target_mask.sum())} candidatas se concentran en los {top_decade}s ({top_decade_count} canciones) y el "
            f"{recent_share:.0%} es posterior a 1990: el brief energético, positivo y bailable describe sobre todo música reciente."
        ),
        (
            f"Su popularidad mediana en Spotify es {np.median(sample_popularity[target_indices]):.0f} frente a "
            f"{np.median(sample_popularity):.0f} en toda la muestra."
        ),
        (
            f"Lo que más separa a las candidatas del resto es {LABELS[most_positive]} (mediana "
            f"{target_profile['original'][most_positive]:.2f} frente a {rest_profile['original'][most_positive]:.2f}) y "
            f"{LABELS[most_negative]} ({target_profile['original'][most_negative]:.2f} frente a {rest_profile['original'][most_negative]:.2f})."
        ),
        f"Mayor puntaje del brief: {'; '.join(examples)}.",
    ]

    decades = decade_summaries(raw_rows, full_values, full_normalized)

    metadata = {
        "source_url": SOURCE_URL,
        "source_file": input_path.name,
        "unit": "canción",
        "original_rows": len(raw_rows) + exact_duplicates + invalid_rows,
        "exact_duplicates_removed": exact_duplicates,
        "invalid_rows_excluded": invalid_rows,
        "clean_rows": len(raw_rows),
        "sample_rows": len(sampled_rows),
        "sample_limit": sample_limit,
        "sample_seed": seed,
        "year_min": int(sample_years.min()),
        "year_max": int(sample_years.max()),
        "features_requested": list(FEATURES),
        "features_used": active_features,
        "constant_features_excluded": [FEATURES[i] for i in range(len(FEATURES)) if i not in active_indices],
        "ranges": ranges,
        "mds_positive_eigenvalues": int(np.sum(eigenvalues > 1e-12)),
    }
    tasks = {
        "task1": {
            "default_pair_uids": [uids[default_index], uids[int(default_neighbors[0])]],
            "distance_percentiles": distance_percentiles,
        },
        "task2": {
            "default_uid": uids[default_index],
            "neighbor_uids": [uids[i] for i in default_neighbors],
            "neighbor_distances": [float(high_distances[default_index, i]) for i in default_neighbors],
            "feature_contributions": contributions,
        },
        "task3": {
            "target_size": int(target_mask.sum()),
            "target_uids": [uids[index] for index in target_indices],
            "target_profile": target_profile,
            "rest_profile": rest_profile,
            "target_definition": "energía + valencia + bailabilidad − 0.5×acústica − 0.25×habla",
            "candidate_decades": {str(decade): count for decade, count in sorted(candidate_decades.items())},
            "findings": task3_findings,
        },
        "task4": {
            "min_decade_count": MIN_DECADE_COUNT,
            "popular_share": POPULAR_SHARE,
            "decades": decades,
            "eligible_decades": [item["decade"] for item in decades],
            **decade_findings(decades),
        },
    }
    return {
        "metadata": metadata,
        "quality": quality,
        "correlations": correlation_matrix(full_values),
        "tasks": tasks,
        "records": records,
    }


def write_outputs(analysis: dict, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(analysis, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    audit_path = ROOT / "docs" / "auditoria_datos.json"
    audit_path.write_text(
        json.dumps(
            {key: analysis[key] for key in ("metadata", "quality", "correlations", "tasks")},
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    csv_path = output_path.with_name("sample.csv")
    with csv_path.open("w", newline="", encoding="utf-8") as stream:
        columns = ["uid", "spotify_id", "name", "artist", "year", "decade", "popularity", "explicit", *FEATURES, "mds_x", "mds_y", "target_score"]
        writer = csv.DictWriter(stream, fieldnames=columns)
        writer.writeheader()
        for record in analysis["records"]:
            writer.writerow(
                {
                    "uid": record["uid"],
                    "spotify_id": record["spotify_id"],
                    "name": record["name"],
                    "artist": record["artist"],
                    "year": record["year"],
                    "decade": record["decade"],
                    "popularity": record["popularity"],
                    "explicit": int(record["explicit"]),
                    **record["original"],
                    "mds_x": record["mds"][0],
                    "mds_y": record["mds"][1],
                    "target_score": record["target_score"],
                }
            )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--sample-limit", type=int, default=SAMPLE_LIMIT)
    parser.add_argument("--seed", type=int, default=SEED)
    args = parser.parse_args()
    analysis = build_analysis(args.input, args.sample_limit, args.seed)
    write_outputs(analysis, args.output)
    print(json.dumps({"metadata": analysis["metadata"], "quality": analysis["quality"]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
