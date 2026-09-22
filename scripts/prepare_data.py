#!/usr/bin/env python3
"""Prepare the exact Spotify dataset referenced by the assignment.

Visual output is produced only by D3. This script performs reproducible
cleaning, sampling, classical MDS and analysis metrics.
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
SEED = 5343
SAMPLE_LIMIT = 800


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


def median_profile(matrix: np.ndarray, mask: np.ndarray) -> dict[str, float]:
    if not np.any(mask):
        return {feature: float("nan") for feature in FEATURES}
    medians = np.median(matrix[mask], axis=0)
    return {feature: float(medians[i]) for i, feature in enumerate(FEATURES)}


def representatives(matrix: np.ndarray, mask: np.ndarray, uids: list[str], count: int = 3) -> list[str]:
    indices = np.flatnonzero(mask)
    if len(indices) == 0:
        return []
    centroid = np.median(matrix[indices], axis=0)
    distances = np.linalg.norm(matrix[indices] - centroid, axis=1)
    return [uids[indices[i]] for i in np.argsort(distances, kind="mergesort")[:count]]


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

    energy = sample_original[:, FEATURES.index("energy")]
    valence = sample_original[:, FEATURES.index("valence")]
    energy_q1, energy_q3 = np.quantile(energy, [0.25, 0.75])
    valence_q1, valence_q3 = np.quantile(valence, [0.25, 0.75])
    low_energy = energy <= energy_q1
    high_energy = energy >= energy_q3
    energetic_somber = high_energy & (valence <= valence_q1)
    calm_positive = low_energy & (valence >= valence_q3)

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

    records = []
    for position, (uid, row) in enumerate(zip(uids, sampled_rows)):
        original = {feature: float(sample_original[position, i]) for i, feature in enumerate(FEATURES)}
        normalized = {feature: float(sample_normalized[position, i]) for i, feature in enumerate(FEATURES)}
        try:
            year = int(float(row.get("year") or 0))
        except ValueError:
            year = 0
        try:
            popularity = float(row.get("popularity") or 0)
        except ValueError:
            popularity = 0.0
        contrast = "other"
        if energetic_somber[position]:
            contrast = "energetic_somber"
        elif calm_positive[position]:
            contrast = "calm_positive"
        records.append(
            {
                "uid": uid,
                "spotify_id": row.get("id", ""),
                "name": row.get("name") or "Canción sin nombre",
                "artist": parse_artist(row.get("artists", "")),
                "year": year,
                "popularity": popularity,
                "original": original,
                "normalized": normalized,
                "mds": [float(coordinates[position, 0]), float(coordinates[position, 1])],
                "energy_band": "high" if high_energy[position] else "low" if low_energy[position] else "middle",
                "contrast": contrast,
            }
        )

    task1_low = median_profile(sample_original, low_energy)
    task1_high = median_profile(sample_original, high_energy)
    task3_a = median_profile(sample_original, energetic_somber)
    task3_b = median_profile(sample_original, calm_positive)

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
        "features_requested": list(FEATURES),
        "features_used": active_features,
        "constant_features_excluded": [FEATURES[i] for i in range(len(FEATURES)) if i not in active_indices],
        "ranges": ranges,
        "mds_positive_eigenvalues": int(np.sum(eigenvalues > 1e-12)),
    }
    tasks = {
        "task1": {
            "low_count": int(low_energy.sum()),
            "high_count": int(high_energy.sum()),
            "low_medians": task1_low,
            "high_medians": task1_high,
            "differences": {feature: task1_high[feature] - task1_low[feature] for feature in FEATURES},
            "low_representatives": representatives(sample_original, low_energy, uids),
            "high_representatives": representatives(sample_original, high_energy, uids),
        },
        "task2": {
            "default_uid": uids[default_index],
            "neighbor_uids": [uids[i] for i in default_neighbors],
            "neighbor_distances": [float(high_distances[default_index, i]) for i in default_neighbors],
            "feature_contributions": contributions,
        },
        "task3": {
            "energetic_somber_count": int(energetic_somber.sum()),
            "calm_positive_count": int(calm_positive.sum()),
            "energetic_somber_medians": task3_a,
            "calm_positive_medians": task3_b,
            "differences": {feature: task3_a[feature] - task3_b[feature] for feature in FEATURES},
            "energetic_somber_examples": representatives(sample_original, energetic_somber, uids),
            "calm_positive_examples": representatives(sample_original, calm_positive, uids),
        },
    }
    return {
        "metadata": metadata,
        "thresholds": {
            "energy_q1": float(energy_q1),
            "energy_q3": float(energy_q3),
            "valence_q1": float(valence_q1),
            "valence_q3": float(valence_q3),
        },
        "quality": quality,
        "tasks": tasks,
        "records": records,
    }


def write_outputs(analysis: dict, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(analysis, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    audit_path = ROOT / "docs" / "auditoria_datos.json"
    audit_path.write_text(
        json.dumps(
            {key: analysis[key] for key in ("metadata", "thresholds", "quality", "tasks")},
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    csv_path = output_path.with_name("sample.csv")
    with csv_path.open("w", newline="", encoding="utf-8") as stream:
        columns = ["uid", "spotify_id", "name", "artist", "year", "popularity", *FEATURES, "mds_x", "mds_y", "energy_band", "contrast"]
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
                    "popularity": record["popularity"],
                    **record["original"],
                    "mds_x": record["mds"][0],
                    "mds_y": record["mds"][1],
                    "energy_band": record["energy_band"],
                    "contrast": record["contrast"],
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
