# Tarea Insight — Visualización multidimensional de Spotify

Aplicación Flask + D3 v7 que responde cuatro tareas analíticas sobre el dataset de Spotify (Kaggle, 1921–2020) con las cuatro técnicas exigidas por el enunciado: **RadViz**, **Star Coordinates**, **Parallel Coordinates** y una proyección **MDS**, más dos gráficos de apoyo (evolución por década y matriz de correlación). Cada tarea tiene una técnica principal, vistas de apoyo, hallazgos con cifras calculadas a partir de los datos y una configuración reproducible.

| Tarea | Pregunta | Técnica principal | Apoyos |
|---|---|---|---|
| 1 | ¿En qué atributos se parecen o difieren dos canciones que podrían convivir en una playlist? | Parallel Coordinates | RadViz, matriz de correlación |
| 2 | ¿Cuáles son las diez canciones más similares a una seleccionada y qué atributos explican la semejanza? | MDS | Parallel Coordinates, métricas de calidad |
| 3 | ¿Qué canciones cumplen mejor un brief sonoro (energético, positivo y bailable) y qué atributos lo explican? | Star Coordinates | RadViz, Parallel Coordinates |
| 4 | ¿Cómo cambia el perfil sonoro de las canciones populares a través de las décadas y en qué se separan del resto de su época? | RadViz (trayectoria por décadas) | Evolución por década, Parallel Coordinates |

## Ejecutar

Requisito: Python 3.11 o superior (probado con 3.14). No necesita internet: D3 7.9.0 está guardado en `app/static/vendor/`.

```bash
cd tarea-insight-visualizacion-datos
python3 -m venv .venv
./.venv/bin/python -m pip install -r app/requirements.txt
./.venv/bin/python scripts/prepare_data.py   # opcional: los datos procesados ya están incluidos
./.venv/bin/python app/app.py
```

Abrir `http://127.0.0.1:5343`.

## Probar

```bash
./.venv/bin/python -m unittest discover -s tests -p 'test_*.py' -v
npm test
```

Las pruebas de Python cubren la normalización, el MDS clásico, la agrupación por décadas completas, el top 25 % por ranking, los hallazgos y el servidor Flask. Las de JavaScript (Node ≥ 20, sin dependencias) cubren distancias, vecinos, RadViz con suma cero, la escala de Star Coordinates y los cálculos de los hallazgos.

## Empaquetar la entrega

```bash
./.venv/bin/python scripts/package_delivery.py --output ~/Desktop/entrega_tarea_insight.zip
```

Genera el ZIP con la aplicación, los datos originales y procesados, la documentación y las pruebas (sin `.venv`, `.git` ni cachés). Sin `--output` se crea en la raíz del repositorio.

## Presentación

El guion de exposición (10–12 minutos), las preguntas probables y la lista de ensayo están en `docs/guion_presentacion.md`; todas sus cifras aparecen en el panel «Hallazgos» de la aplicación.

## Datos y reproducibilidad

- Fuente exacta enlazada en el PDF: https://www.kaggle.com/datasets/yamaerenay/spotify-dataset-1921-2020-160k-tracks?select=data.csv
- Archivo original: `data/original/data.csv` (170,653 canciones, 1921–2020).
- Unidad de observación: canción. Seis atributos: energía, valencia, bailabilidad, acústica, instrumentalidad y habla, normalizados a `[0,1]` con los rangos del conjunto limpio.
- Tareas 1–3: muestra aleatoria reproducible de 800 canciones (semilla 5343) para que la interacción y la matriz de distancias del MDS sean fluidas.
- Tarea 4: décadas completas del dataset limpio (1921–1929 = 1920s, …, 2020). En cada década el **top 25 % popular** se define por ranking de popularidad dentro de la propia década (empates resueltos por orden del archivo), de modo que el corte se adapta a la escala de popularidad de cada época.
- Salidas: `data/processed/analysis.json` (consumido por la aplicación), `data/processed/sample.csv` y `docs/auditoria_datos.json` (metadatos, calidad del MDS, correlaciones y hallazgos).

## Interacción

- **Mouseover**: tooltip con nombre, artista, año, popularidad y los seis atributos de cualquier canción o perfil agregado.
- **Clic**: fija una canción en las cuatro vistas; en la Tarea 4 enfoca una década (RadViz, evolución, Parallel Coordinates y tabla).
- **Brushing** en Parallel Coordinates: intervalos por eje, coordinados con las demás vistas.
- **Arrastre**: anclajes de RadViz, vectores de Star Coordinates (dirección y peso 0–1.5×) y ejes de Parallel Coordinates (reordenar). Cada eje se puede **invertir** (⇅) y la **escala** puede ser normalizada 0–1 o por percentil dentro de la muestra (0–100 %).
- **Restablecer vista** y **Reproducir este análisis** devuelven la configuración guardada de cada tarea.

## Recorrido de revisión

1. Tarea 1: comparar Canción A y B en Parallel Coordinates; leer los hallazgos (diferencia mayor, atributos coincidentes, percentil de la distancia) y la matriz de correlación que justifica el orden energía → acústica.
2. Tarea 2: seleccionar una canción, verificar el ranking de vecinas y cuántas conserva el plano MDS; revisar stress, correlación de distancias y vecindad.
3. Tarea 3: mover los vectores de Star Coordinates y observar qué candidatas se mantienen; comparar el perfil objetivo con el resto de la muestra.
4. Tarea 4: seguir la trayectoria 1920s → 2020s en RadViz, enfocar una década y contrastar el gráfico de evolución con la tabla de décadas.

## Archivos de entrega

- Aplicación: `app/` (Flask, plantilla, CSS y módulos D3: `radviz.js`, `star_coordinates.js`, `parallel_coordinates.js`, `mds_view.js`, `evolution_chart.js`, `correlation_chart.js`).
- Preparación de datos: `scripts/prepare_data.py`. Empaquetado: `scripts/package_delivery.py`.
- Datos originales y procesados: `data/`.
- Informe analítico, justificación visual, trazabilidad, matriz de rúbrica y guion de exposición: `docs/`.
- Pruebas: `tests/`.
- Rúbrica y enunciado: raíz de esta carpeta.

## Nota sobre «nodes and edges»

El enunciado menciona un ZIP con «data files (nodes and edges)», frase heredada de una actividad de redes. Este dataset y las cuatro técnicas son tabulares, así que la entrega incluye el CSV original y los datos procesados; no se fabricó una red. Conviene confirmarlo con el profesor.
