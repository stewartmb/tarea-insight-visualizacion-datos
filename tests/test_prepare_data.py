import sys
import unittest
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from prepare_data import classical_mds, minmax_normalize, projection_quality


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


if __name__ == "__main__":
    unittest.main()
