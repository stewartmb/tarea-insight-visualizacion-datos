"""Flask server for the Spotify multidimensional visualization.

The server only delivers the page, the static D3 modules and the precomputed
analysis produced by ``scripts/prepare_data.py``. Every chart is drawn in the
browser with D3.
"""

from pathlib import Path

from flask import Flask, jsonify, render_template


ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data" / "processed" / "analysis.json"

app = Flask(__name__)


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/data")
def data():
    if not DATA_FILE.exists():
        return jsonify({"error": "Ejecuta scripts/prepare_data.py antes de iniciar la aplicación."}), 503
    return app.response_class(DATA_FILE.read_bytes(), mimetype="application/json")


@app.get("/health")
def health():
    return jsonify({"status": "ok", "data_ready": DATA_FILE.exists()})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5343, debug=False)
