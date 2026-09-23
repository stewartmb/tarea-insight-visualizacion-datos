# Estado de la entrega

## Completado

- Dataset exacto recuperado desde el enlace incrustado en el enunciado; CSV original conservado y preparación reproducible (`scripts/prepare_data.py`).
- Cuatro tareas analíticas con hallazgos numéricos calculados a partir de los datos, ejemplos y limitaciones.
- Tarea 4 calculada por **décadas completas** del dataset limpio (1920s–2020s), con top 25 % popular definido por ranking dentro de cada década y trayectoria cronológica en RadViz.
- RadViz interactivo con anclajes arrastrables, trayectoria y enfoque por década.
- Star Coordinates interactivo con dirección y peso variables; ejes y puntos comparten la misma escala fija.
- Parallel Coordinates con reordenamiento por arrastre, inversión de ejes, dos modos de escala (normalizada y percentil) y brushing coordinado.
- MDS clásico con selección coordinada, diez vecinas y comprobación de vecinas conservadas en el plano.
- Gráficos de apoyo: evolución por década y matriz de correlación.
- Stress, correlación de distancias y preservación de vecindad.
- D3 v7 local, Flask, README, informe, justificación visual, trazabilidad, matriz de rúbrica y guion.
- Pruebas de cálculos (Python y JavaScript), servidor y carga; script de empaquetado del ZIP.

## Correcciones respecto a la versión anterior

- Las décadas se calculaban con un solo año (`year == 1930`); ahora agrupan la década completa.
- El «top 25 %» usaba el cuartil de popularidad, que en 1920–1949 incluía a toda la década; ahora se define por ranking dentro de cada década y se informa el corte y el porcentaje de ceros.
- Al reproducir una tarea, una transición pendiente devolvía los ejes de Parallel Coordinates al orden original; el arrastre usaba coordenadas del grupo desplazado. Ambos corregidos.
- Los vectores de Star Coordinates se dibujaban al triple de la escala de los puntos; ahora coinciden.
- README y `app.py` sin rutas locales ni nombres de carpeta obsoletos.

## Pendiente externo

- Confirmar con el profesor qué significa «data files (nodes and edges)» en una actividad tabular de Spotify. La entrega incluye el CSV original y los datos preparados; no se inventó una red.
- Realizar y ensayar la presentación presencial, requisito que solo puede completar el estudiante.
