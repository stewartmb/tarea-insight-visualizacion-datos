import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "app"))
from app import app


class ApplicationTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_health_and_page(self):
        self.assertEqual(self.client.get("/health").get_json(), {"status": "ok", "data_ready": True})
        page = self.client.get("/")
        self.assertEqual(page.status_code, 200)
        for technique in (b"RadViz", b"Star Coordinates", b"Parallel Coordinates", b"MDS"):
            self.assertIn(technique, page.data)
        self.assertIn(b"parallel-scale", page.data)

    def test_analysis_payload(self):
        response = self.client.get("/api/data")
        self.assertEqual(response.status_code, 200)
        payload = json.loads(response.data)
        self.assertEqual(payload["metadata"]["sample_rows"], 800)
        self.assertEqual(set(payload["metadata"]["features_used"]), {
            "energy", "valence", "danceability", "acousticness", "instrumentalness", "speechiness"
        })
        self.assertEqual(len(payload["records"]), 800)
        task4 = payload["tasks"]["task4"]
        # Whole decades of the cleaned dataset, 1920s to 2020s.
        self.assertEqual(task4["eligible_decades"], list(range(1920, 2030, 10)))
        for decade in task4["decades"]:
            self.assertEqual(decade["year_min"] // 10 * 10, decade["decade"])
            self.assertEqual(decade["year_max"] // 10 * 10, decade["decade"])
            self.assertAlmostEqual(decade["popular_count"] / decade["count"], 0.25, delta=0.01)
        self.assertTrue(task4["findings"])
        self.assertEqual(len(payload["correlations"]["matrix"]), 6)


if __name__ == "__main__":
    unittest.main()
