# Informe analítico — Perfiles musicales de Spotify

## Audiencia y propósito

La aplicación está dirigida a una persona que selecciona canciones para playlists y necesita comparar perfiles, encontrar similitudes, diseñar un perfil objetivo y estudiar la evolución del catálogo. La visualización es un medio para producir respuestas verificables: cada tarea termina con hallazgos numéricos calculados a partir de los datos (`scripts/prepare_data.py` y `app/static/js/main.js`), no con descripciones de los gráficos.

## Datos

La fuente es el `data.csv` del dataset Kaggle enlazado en el enunciado. Contiene 170,653 canciones entre 1921 y 2020, sin duplicados exactos ni filas inválidas en las seis variables de audio. Para garantizar interacción fluida y permitir MDS clásico (matriz de distancias cuadrática), las tareas 1–3 usan una muestra aleatoria reproducible de 800 registros con semilla 5343 (años 1923–2020). La tarea 4 agrega el dataset limpio completo por décadas.

Se seleccionaron seis atributos cuantitativos: energía, valencia, bailabilidad, acústica, instrumentalidad y habla. Los valores se normalizaron a `[0,1]` con los mínimos y máximos del conjunto limpio completo, conservando por separado los valores originales. El análisis no utiliza género porque `data.csv` no contiene una relación género-canción verificable; artista, año, popularidad y la marca «explícita» se usan como contexto.

### Correlaciones (dataset limpio completo)

| Par de atributos | r de Pearson |
|---|---:|
| Energía × Acústica | −0.75 |
| Valencia × Bailabilidad | 0.56 |
| Energía × Valencia | 0.35 |
| Acústica × Instrumentalidad | 0.33 |
| Bailabilidad × Habla | 0.24 |

La correlación fuerte entre energía y acústica justifica que ambos ejes queden adyacentes en Parallel Coordinates y explica por qué los anclajes de energía y acústica «tiran» en direcciones opuestas en RadViz.

## Tarea 1 — Comparar dos canciones para una playlist

**Pregunta:** ¿En qué atributos son similares o diferentes dos canciones que podrían convivir en una playlist?

La interfaz permite seleccionar una Canción A y una Canción B. Parallel Coordinates compara sus seis perfiles normalizados directamente (líneas entrecortadas); el resto de la muestra se mantiene como contexto tenue. La tabla muestra la diferencia por atributo y la distancia euclídea, y esa distancia se ubica en la distribución de las 319,600 distancias entre parejas de la muestra (percentiles precalculados).

**Hallazgos de la configuración guardada** — “La Santa” (Bad Bunny, Daddy Yankee, 2020) frente a “Night by Night” (Chromeo, 2010):

- Las mayores diferencias aparecen en bailabilidad (0.74 frente a 0.68) y energía (0.87 frente a 0.90); coinciden casi por completo en habla e instrumentalidad.
- Su distancia normalizada es 0.075: son más parecidas que el 99 % de las parejas posibles de la muestra, de modo que pueden convivir en una playlist según estas seis variables.
- Contexto Spotify: popularidad 84 frente a 41 y diez años de distancia entre lanzamientos; un reguetón de 2020 y un tema de nu-disco de 2010 comparten casi el mismo perfil de audio.

## Tarea 2 — Encontrar canciones similares

**Pregunta:** Para una canción seleccionada, ¿cuáles son las diez más similares y qué atributos explican la semejanza?

La configuración guardada selecciona **La Santa**, la canción de mayor popularidad dentro de la muestra. Se calculan distancias euclídeas usando las seis variables normalizadas con igual peso. La aplicación mide, para cada vecina, la diferencia media por atributo y comprueba cuántas de las diez vecinas siguen entre las diez más cercanas en el plano MDS.

**Hallazgos:**

- Su vecina más cercana es **Night by Night**, de Chromeo, a distancia 0.075. Las diez vecinas coinciden con la canción sobre todo en instrumentalidad y habla (diferencia media 0.008 y 0.019) y se separan más en bailabilidad (0.085).
- Las vecinas abarcan de 1980 a 2018 y pertenecen a diez artistas distintos: un mismo perfil de audio aparece en épocas y catálogos muy diferentes.
- Su popularidad mediana es 45 frente a 84 de la canción consulta: el parecido sonoro no implica parecido en popularidad.
- En el plano MDS solo 4 de las 10 vecinas siguen entre las 10 más cercanas. La proyección orienta la búsqueda, pero el ranking se calcula en seis dimensiones; por eso la tabla de vecinas es la evidencia principal y MDS la vista de exploración.

## Tarea 3 — Diseñar un perfil para una playlist

**Pregunta:** ¿Qué canciones cumplen mejor un objetivo energético, positivo y bailable, y qué atributos explican ese perfil?

La configuración inicial ordena candidatas mediante el brief `energía + valencia + bailabilidad − 0.5×acústica − 0.25×habla` y selecciona 60 canciones como punto de partida reproducible. Star Coordinates permite cambiar pesos y direcciones para explorar otro objetivo; el marcador oscuro es el perfil mediano de las candidatas.

**Hallazgos:**

- Las 60 candidatas se concentran en los 1990s (15 canciones) y el 58 % es posterior a 1990: el brief describe sobre todo música reciente.
- Su popularidad mediana en Spotify es 41 frente a 34 en toda la muestra.
- Lo que más separa a las candidatas del resto es la valencia (mediana 0.88 frente a 0.48) y la acústica (0.04 frente a 0.55). El perfil mediano de las candidatas combina energía 0.81, valencia 0.88 y bailabilidad 0.72.
- Mayor puntaje del brief: “Tú No Eres Para Mi” de Fanny Lu (2008), “Nolia Clap” de Juvenile, Wacko & Skip (2004) y “If I Never See Your Face Again” de Maroon 5 (2007): pop latino, rap sureño y pop-rock convergen en el mismo perfil de audio.

## Tarea 4 — Examinar evolución temporal y popularidad

**Pregunta:** ¿Cómo cambia el perfil sonoro de las canciones populares a través de las décadas y en qué se separan del resto de su época?

Esta tarea usa `year`, `popularity` y los seis atributos de audio del archivo completo. Las canciones se agrupan por **décadas completas** (1921–1929 forman los 1920s, …, 2020 forma los 2020s) y se excluyen grupos con menos de 20 observaciones; las once décadas superan ese mínimo (de 2,030 canciones en 2020 a 20,000 en los 1970s). En cada década, el **top 25 % popular** se define por ranking de popularidad dentro de la propia década (empates resueltos por orden del archivo), no con un corte global que favorecería a las épocas recientes. RadViz une los perfiles medianos del top 25 % en orden cronológico (trayectoria) y muestra en hueco el perfil de toda la década; el gráfico de evolución detalla cada atributo y Parallel Coordinates superpone los once perfiles.

**Hallazgos:**

- Entre 1920s y 2020s el cambio más grande en el perfil de las canciones populares está en la acústica: su mediana pasa de 0.95 a 0.13. Le sigue la energía (0.19 → 0.66). La trayectoria de RadViz se desplaza del anclaje de acústica hacia energía, valencia y bailabilidad.
- El salto más brusco entre décadas consecutivas ocurre en acústica de 1960s a 1970s (0.63 → 0.32), coherente con la electrificación del pop y el rock de esos años.
- Entre las décadas con señal de popularidad, el top 25 % se separa más del conjunto en los 1960s: su acústica mediana es 0.63 frente a 0.70 en toda la década. En el resto de décadas las populares siguen de cerca el perfil general de su época.
- La bailabilidad mediana de las populares alcanza su máximo en 2020s (0.72) y la habla de 2020s (0.08) es 2.1 veces la de 1960s (0.04), consistente con el peso del rap y del pop urbano en el catálogo reciente.
- En 1920s, 1930s y 1940s la mayoría de canciones tiene popularidad 0 en Spotify (70–75 %); allí el top 25 % equivale a las canciones que aún conservan alguna reproducción y debe leerse con cautela. La tabla de la tarea muestra el corte y el porcentaje de ceros de cada década.

## Calidad y limitaciones de MDS

- Stress normalizado: `0.263`.
- Correlación entre distancias originales y proyectadas: `0.909`.
- Preservación media de los diez vecinos: `31.6%`.

Las métricas capturan propiedades diferentes. La correlación global de distancias puede ser alta mientras solo una parte de los vecinos inmediatos permanece igual; la Tarea 2 lo muestra caso por caso (4 de 10 vecinas conservadas para “La Santa”). La aplicación muestra ambas para evitar juzgar la proyección solo por su apariencia.

## Limitaciones generales

- Las tareas 1–3 corresponden a una muestra de 800 canciones del dataset, no a todo Spotify; la tarea 4 usa el dataset completo pero su popularidad es la del catálogo en 2020.
- La distancia asigna el mismo peso inicial a las seis variables normalizadas.
- Artista y año sirven como contexto; no se analizaron géneros porque no están vinculados de manera inequívoca en el archivo usado.
- Reordenar ejes, invertirlos, cambiar la escala o mover anclajes cambia la lectura, por lo que la aplicación conserva una configuración reproducible para cada tarea y marca cualquier exploración como «modificada».
