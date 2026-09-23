import csv
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from prepare_data import (
    FEATURES,
    build_analysis,
    classical_mds,
    decade_findings,
    decade_summaries,
    minmax_normalize,
    projection_quality,
    rank_split,
)


def synthetic_rows(count_per_year: int = 4, years=range(1921, 1941)):
    """Small deterministic dataset: popularity grows with the year, acousticness falls."""
    rows = []
    for year in years:
        for i in range(count_per_year):
            rows.append(
                {
                    "id": f"{year}-{i}",
                    "name": f"song {year}-{i}",
                    "artists": "['Artist']",
                    "year": str(year),
                    "popularity": str((year - 1920) * 2 + i),
                    "energy": str(0.2 + (year - 1920) * 0.02),
                    "valence": "0.5",
                    "danceability": str(0.4 + i * 0.05),
                    "acousticness": str(0.9 - (year - 1920) * 0.02),
                    "instrumentalness": "0.0",
                    "speechiness": "0.05",
                }
            )
    return rows


class DataPreparationTests(unittest.TestCase):
    def test_minmax_preserves_zero_and_one(self):
        values = np.array([[2.0, 5.0], [4.0, 5.0], [6.0, 5.0]])
        normalized, active, ranges = minmax_normalize(values, ("energy", "valence"))
        self.assertEqual(active, [0])
        np.testing.assert_allclose(normalized[:, 0], [0.0, 0.5, 1.0])
        self.assertTrue(ranges["valence"]["constant"])

    def test_mds_recovers_planar_distances(self):
        square = np.array([[0.0, 0.0], [1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])
        projected, _ = classical_mds(square)
        quality = projection_quality(square, projected, k=2)
        self.assertLess(quality["normalized_stress"], 1e-10)
        self.assertAlmostEqual(quality["distance_correlation"], 1.0, places=10)

    def test_rank_split_takes_top_and_bottom_quarter_by_ranking(self):
        popularity = np.array([5.0, 1.0, 9.0, 3.0, 7.0, 0.0, 8.0, 2.0])
        indices = np.arange(len(popularity))
        top, bottom = rank_split(popularity, indices, 0.25)
        self.assertEqual(sorted(popularity[top].tolist()), [8.0, 9.0])
        self.assertEqual(sorted(popularity[bottom].tolist()), [0.0, 1.0])

    def test_rank_split_is_deterministic_with_ties(self):
        popularity = np.zeros(8)
        top, bottom = rank_split(popularity, np.arange(8), 0.25)
        self.assertEqual(top.tolist(), [0, 1])
        self.assertEqual(bottom.tolist(), [6, 7])

    def test_decades_group_every_year_of_the_decade(self):
        rows = synthetic_rows()
        values = np.array([[float(row[feature]) for feature in FEATURES] for row in rows])
        normalized, _, _ = minmax_normalize(values, FEATURES)
        decades = decade_summaries(rows, values, normalized)
        self.assertEqual([item["decade"] for item in decades], [1920, 1930])
        # 1921–1929 are nine years with four songs each: the whole decade, not the year 1920 alone.
        self.assertEqual(decades[0]["count"], 36)
        self.assertEqual((decades[0]["year_min"], decades[0]["year_max"]), (1921, 1929))
        self.assertEqual(decades[1]["count"], 40)
        self.assertEqual(decades[0]["popular_count"], 9)
        # Popularity grows with the year, so the top 25 % of the 1920s comes from its latest years.
        self.assertGreaterEqual(decades[0]["popular_cut"], 14)
        self.assertLess(decades[1]["popular_profile"]["original"]["acousticness"], decades[0]["popular_profile"]["original"]["acousticness"])

    def test_decade_findings_quote_the_largest_change(self):
        rows = synthetic_rows()
        values = np.array([[float(row[feature]) for feature in FEATURES] for row in rows])
        normalized, _, _ = minmax_normalize(values, FEATURES)
        summary = decade_findings(decade_summaries(rows, values, normalized))
        self.assertIn("1920s", summary["findings"][0])
        self.assertIn("1930s", summary["findings"][0])
        self.assertEqual(summary["largest_shift"]["from"], "1920s")
        self.assertEqual(summary["largest_shift"]["to"], "1930s")

    def test_build_analysis_end_to_end_on_synthetic_csv(self):
        rows = synthetic_rows()
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "data.csv"
            with path.open("w", newline="", encoding="utf-8") as stream:
                writer = csv.DictWriter(stream, fieldnames=list(rows[0].keys()))
                writer.writeheader()
                writer.writerows(rows)
            analysis = build_analysis(path, sample_limit=40, seed=1)
        self.assertEqual(analysis["metadata"]["sample_rows"], 40)
        self.assertEqual(len(analysis["records"]), 40)
        self.assertEqual(len(analysis["tasks"]["task1"]["distance_percentiles"]), 101)
        self.assertEqual(analysis["correlations"]["features"], list(FEATURES))
        self.assertEqual(analysis["tasks"]["task4"]["eligible_decades"], [1920, 1930])
        self.assertTrue(analysis["tasks"]["task3"]["findings"])


if __name__ == "__main__":
    unittest.main()
