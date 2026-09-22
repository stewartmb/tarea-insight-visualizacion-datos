# Tarea Insight — Visualización multidimensional de Spotify

Aplicación Flask y D3 para responder cuatro tareas analíticas mediante RadViz, Star Coordinates, Parallel Coordinates y MDS. Cada vista tiene una técnica principal y apoyos justificados. Se desarrolló a partir del enunciado, la rúbrica y el material de clase. Consulta `docs/trazabilidad_materiales.md` para diferenciar código adaptado y código nuevo.

## Ejecutar

Requisito: Python 3.11 o superior.

```bash
cd Tarea_Insight
python3 -m venv .venv
./.venv/bin/python -m pip install -r app/requirements.txt
./.venv/bin/python scripts/prepare_data.py
./.venv/bin/python app/app.py
```

Abrir `http://127.0.0.1:5343`.

D3 7.9.0 está guardado localmente. La aplicación no necesita internet durante la exposición.

## Probar

```bash
./.venv/bin/python -m unittest discover -s tests -p 'test_*.py' -v
npm test
```

## Datos y reproducibilidad

- Fuente exacta enlazada en el PDF: https://www.kaggle.com/datasets/yamaerenay/spotify-dataset-1921-2020-160k-tracks?select=data.csv
- Archivo original: `data/original/data.csv`.
- Unidad de observación: canción.
- Seis variables: energía, valencia, bailabilidad, acústica, instrumentalidad y habla.
- Muestra aleatoria reproducible: máximo 800 registros, semilla 5343.
- Salidas: `data/processed/analysis.json` y `data/processed/sample.csv`.
- Auditoría: `docs/auditoria_datos.json`.

El preprocesamiento conserva el original, valida valores, normaliza con los rangos del conjunto limpio y calcula MDS clásico. La aplicación no llama MDS “clustering”.

## Recorrido de revisión

1. Reproducir Tarea 1 y comparar energía alta/baja en Parallel Coordinates y RadViz.
2. Reproducir Tarea 2, seleccionar una canción y observar sus diez vecinas en las cuatro vistas.
3. Reproducir Tarea 3 y revisar combinaciones de energía/valencia con Star Coordinates.
4. Reproducir Tarea 4 y comparar décadas en RadViz y la tabla de evidencia.
5. Arrastrar ejes para explicar por qué el orden y el peso afectan la lectura.
6. Mostrar las métricas de stress, correlación de distancias y preservación de vecindad.

## Archivos de entrega

- Aplicación: `app/`.
- Preparación: `scripts/prepare_data.py`.
- Datos originales y procesados: `data/`.
- Informe, trazabilidad, matriz de rúbrica y guion: `docs/`.
- Justificación de colores, canales, idioma y orden de ejes: `docs/justificacion_visual.md`.
- Pruebas: `tests/`.
- Rúbrica y enunciado: raíz de esta carpeta.

## Pendiente administrativo

El enunciado menciona un ZIP con archivos «nodes and edges», aunque el dataset y las cuatro técnicas son tabulares. No se fabricó una red. Debe aclararse con el profesor si esa frase pertenece a otra actividad o si espera un formato adicional.
