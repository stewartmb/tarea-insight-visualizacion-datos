#!/usr/bin/env python3
"""Build the ZIP requested by the assignment (Flask application + data files).

Usage: python scripts/package_delivery.py [--output entrega_tarea_insight.zip]

The archive contains the application, the preparation script, the original and
processed data, the documentation and the tests. Virtual environments, caches
and git metadata are excluded.
"""

from __future__ import annotations

import argparse
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INCLUDE = ("app", "data", "docs", "scripts", "tests", "README.md", "package.json", "rubrica_tarea_insight.md")
EXCLUDED_PARTS = {".venv", "__pycache__", "node_modules", ".git", ".DS_Store", ".claude"}


def files_to_pack() -> list[Path]:
    selected: list[Path] = []
    for name in INCLUDE:
        path = ROOT / name
        if path.is_file():
            selected.append(path)
        elif path.is_dir():
            selected.extend(item for item in path.rglob("*") if item.is_file())
    for extra in ROOT.glob("Tarea_3_Multidimensional_Data_Visualization*.pdf"):
        selected.append(extra)
    return sorted(item for item in selected if not (EXCLUDED_PARTS & set(item.relative_to(ROOT).parts)) and not item.name.endswith(".pyc"))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "entrega_tarea_insight.zip")
    args = parser.parse_args()
    files = files_to_pack()
    with zipfile.ZipFile(args.output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for item in files:
            archive.write(item, Path("tarea_insight") / item.relative_to(ROOT))
    print(f"{len(files)} archivos empaquetados en {args.output} ({args.output.stat().st_size / 1_048_576:.1f} MB)")


if __name__ == "__main__":
    main()
