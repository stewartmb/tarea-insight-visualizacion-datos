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
        self.assertIn(b"Parallel Coordinates", page.data)

    def test_analysis_payload(self):
        response = self.client.get("/api/data")
        self.assertEqual(response.status_code, 200)
        payload = json.loads(response.data)
        self.assertEqual(payload["metadata"]["sample_rows"], 800)
        self.assertEqual(set(payload["metadata"]["features_used"]), {
            "energy", "valence", "danceability", "acousticness", "instrumentalness", "speechiness"
        })
        self.assertEqual(len(payload["records"]), 800)


if __name__ == "__main__":
    unittest.main()
