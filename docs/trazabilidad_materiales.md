# Trazabilidad académica y decisiones

Fecha de implementación: 21 de septiembre de 2026. Las páginas indicadas son páginas físicas del PDF, contadas desde 1. Esta trazabilidad se estableció antes de implementar los componentes.

## Prioridad de fuentes

Enunciado y rúbrica → Observable original → PDFs (texto y diagramas) → transcripciones → consolidado de estudio → documentación técnica externa. Una función nueva no se atribuye al profesor. Las transcripciones se parafrasean: contienen errores de reconocimiento, especialmente en nombres de técnicas.

## Mapa de implementación

| Componente | Fuente y localizador | Reutilización / adaptación / desarrollo nuevo |
|---|---|---|
| RadViz | `multidimensional_visualization_ejercicio.js`, `_4`, `_new_data`, `_anchor_points`, `_14`; U2_T1 p.53; semana6_clase1 00:16–00:18 | Adaptación de normalización y promedio ponderado de anclajes. Desarrollo nuevo: selección, etiquetas, arrastre y tratamiento de suma cero. |
| Star Coordinates | Mismo notebook, `_19`, `_20`, `_21`; U2_T1 p.55–56; semana6_clase1 00:34–00:35 y 00:41:24–00:42:38 | Adaptación de combinación lineal de vectores. Desarrollo nuevo: puntos completos, pesos y controles de ángulos. |
| Parallel Coordinates | U2_T1 p.36–39; semana5_clase1 01:20:28–01:25:20 y 01:30:53–01:33:08 | Implementación nueva basada en representación teórica. Usa escalas, ejes y `d3.line` enseñados en los notebooks de barras y líneas. Brushing y arrastre son ampliaciones técnicas. |
| MDS | U2_T1 p.97 y p.102–105; semana6_clase1, explicación de distancias y 01:17:40–01:19:12 para calidad | Implementación nueva de MDS clásico con doble centrado y autodescomposición NumPy. No existe código MDS completo en los nueve notebooks inspeccionados. |
| Vecindad | Notebook multidimensional: `euclidean`, `kNearestNeighbors`, `neighborhoodPreservation` | Adaptación a Python para precálculo. Mismos índices, exclusión del propio punto y fracción de vecinos compartidos; desempates deterministas. |
| SVG y data join | `d_dd72e51d927a0f1a.js`; `d_7d5703c7f30132f2.js`; `d_0dd0a49165451966.js` | Patrones `selectAll`, `data`, `join`, `attr`, `scaleLinear`, ejes y `line` adaptados. |
| WHAT | U1_T2; tópico consolidado 02 | Canción como ítem, seis atributos cuantitativos, identificadores y metadatos. Normalización y muestra explicitadas. |
| WHY | U1_T3; tópico consolidado 03 | T1 comparar perfiles; T2 identificar similitud; T3 localizar combinaciones y comparar. Preguntas específicas desarrolladas para Spotify. |
| HOW y claridad | U1_T4; `claridad_ejercicio.js`; tópico 04 | Posición y líneas para comparación, color para grupos de la tarea, etiquetas y escalas constantes. |
| Insight | U1_T1; semana1_clase2 (bloque sobre propósito de insight); tópico 01 | Resultados numéricos y ejemplos interpretados sin convertir asociación en causalidad. |
| Gramática visual | U1_T4; ejercicio de claridad; semana5_clase1 01:20:28–01:33:08 sobre orden de ejes; tópico 04 | Justificación explícita de posición, líneas, color, opacidad, etiquetas, idioma y orden de Parallel Coordinates en `justificacion_visual.md` y en la interfaz. |

PDF principal: `../../../materiales/teoria/U2_T1_Multidimensional Data Visualization_Low Dimensional.pdf`.
Notebooks originales: `../../../observable_material/notebooks/`.
Transcripciones originales: `../../../transcripts/`.
Notebook web: https://observablehq.com/@visualizaciondatosutec/multidimensional-visualization-ejercicio (snapshot local @383).

## Correcciones al ejemplo de clase

- Los anclajes se distribuyen por `2πj/D` usando solo las dimensiones activas. No se usa el dominio completo que incluye `class`, ni se duplica 0 y 2π.
- Los valores originales nunca se sobrescriben al normalizar. Se excluyen dimensiones constantes y registros inválidos de forma explícita.
- RadViz con suma cero produce posición indefinida y un aviso, no coordenadas `NaN`.
- Las líneas SVG usan `x1,y1,x2,y2`; el fragmento `_21` usaba `x0/y0`, que no son extremos válidos de `<line>`.
- Las funciones de calidad se conectan a matrices reales; el ejemplo del notebook referencia `highDimensional` y `projection2D` sin definirlas en el snapshot.

## Precisión conceptual de MDS

Se implementa **MDS clásico**, que aproxima una matriz de productos internos mediante autodescomposición. No se afirma que ejecute una optimización iterativa del stress de la diapositiva. Para distancias euclídeas corresponde al subespacio principal de los datos centrados. Reportamos el error de distancias y la preservación de vecindad como diagnósticos, no como garantía de clusters ni de ausencia de distorsión.

## Ampliaciones documentadas

- Flask: servidor local exigido en las instrucciones de entrega.
- NumPy: cálculo numérico, ninguna visualización. https://numpy.org/doc/stable/reference/generated/numpy.linalg.eigh.html
- D3 7.9.0 local (major 7 como clase): https://d3js.org/
- Brushing: https://d3js.org/d3-brush
- Arrastre: https://d3js.org/d3-drag
- Estado coordinado, restauración de tareas, muestreo reproducible y pruebas: desarrollo para esta entrega.

## Enunciado: ambigüedades pendientes

El apartado general permite varios frameworks; el apartado de entrega menciona Flask. Se elige Flask. El texto solicita datos «nodes and edges», aunque las técnicas operan sobre una tabla. No se inventa una red: se incluyen tabla original y datos preparados, y se solicita aclaración antes de declarar la entrega final cerrada. La aplicación y el ZIP de revisión pueden verificarse mientras se resuelve este punto. Presentar presencialmente sigue siendo obligatorio.
# Rediseño de cuatro tareas analíticas

La aplicación separa la solución en cuatro preguntas y asigna una técnica principal a cada una:

| Tarea | Técnica principal | Evidencia implementada |
|---|---|---|
| 1. Energía alta/baja | Parallel Coordinates | orden `energía → acústica → valencia → bailabilidad → instrumentalidad → habla`, brushing y perfiles medianos |
| 2. Canciones similares | MDS | selección por canción, ranking de 10 vecinos, distancia euclídea y métricas de calidad |
| 3. Perfiles contrastantes | Star Coordinates | vectores arrastrables, pesos, centroides y comparación de grupos |
| 4. Evolución temporal | RadViz | perfiles medianos por década, cuartiles internos de popularidad y tabla de tamaños |

RadViz y Star Coordinates adaptan las fórmulas y patrones del notebook multidimensional. Parallel Coordinates y la preparación de MDS se desarrollan a partir de las técnicas y patrones D3 trabajados en clase; esa diferencia se mantiene explícita. La tarea 4 usa únicamente columnas presentes en el CSV y no incorpora género ni el Million Playlist Dataset.
