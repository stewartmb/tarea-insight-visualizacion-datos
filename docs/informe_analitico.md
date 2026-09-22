# Informe analítico — Perfiles musicales de Spotify

## Audiencia y propósito

La aplicación está dirigida a una persona que selecciona canciones para playlists y necesita comparar perfiles, encontrar similitudes, diseñar un perfil objetivo y estudiar la evolución del catálogo. La visualización es un medio para producir respuestas verificables. Esta idea sigue el énfasis de fundamentos del curso: el propósito es el insight y la gráfica ayuda a obtenerlo.

## Datos

La fuente es el `data.csv` del dataset Kaggle enlazado en el enunciado. Contiene 170,653 canciones entre 1921 y 2020. Para garantizar interacción fluida y permitir MDS clásico, se extrajo una muestra aleatoria reproducible de 800 registros con semilla 5343.

Se seleccionaron seis atributos cuantitativos: energía, valencia, bailabilidad, acústica, instrumentalidad y habla. Los valores se normalizaron a `[0,1]` con los mínimos y máximos del conjunto limpio completo. El análisis no utiliza género porque `data.csv` no contiene una relación género-canción verificable.

## Tarea 1 — Comparar dos canciones para una playlist

**Pregunta:** ¿En qué atributos son similares o diferentes dos canciones que podrían convivir en una playlist?

La interfaz permite seleccionar una Canción A y una Canción B. Parallel Coordinates compara sus seis perfiles normalizados directamente; no se construyen grupos por umbrales de energía ni se dibujan medianas artificiales.

La tabla muestra la diferencia absoluta de cada atributo y la distancia euclídea entre ambos perfiles. Esto responde una decisión concreta de curaduría: si una canción mantiene un perfil suficientemente compatible con otra.

Las líneas entrecortadas representan directamente las dos canciones seleccionadas; las líneas finas son los registros comparados de la vista activa.

## Tarea 2 — Encontrar canciones similares

**Pregunta:** Para una canción seleccionada, ¿cuáles son las diez más similares y qué atributos explican la semejanza?

La configuración guardada selecciona **La Santa**, de Bad Bunny y Daddy Yankee (2020), por ser la canción de mayor popularidad dentro de la muestra. Se calculan distancias euclídeas usando las seis variables normalizadas. Su vecino más cercano es **Night by Night**, de Chromeo, con distancia `0.075`.

Entre los diez vecinos, instrumentalidad y habla presentan, en promedio, las menores diferencias cuadráticas respecto a la canción seleccionada. Esto identifica los atributos en los que el grupo cercano permanece más parecido; no significa que sean las únicas razones musicales de semejanza.

MDS sitúa canciones intentando conservar distancias. Parallel Coordinates y Star Coordinates permiten inspeccionar los perfiles originales que sustentan esa proximidad.

## Tarea 3 — Diseñar un perfil para una playlist

**Pregunta:** ¿Qué canciones cumplen mejor un objetivo energético, positivo y bailable, y qué atributos explican ese perfil?

La configuración inicial ordena candidatas mediante el brief `energía + valencia + bailabilidad − 0.5×acústica − 0.25×habla`. Se seleccionan 60 canciones como punto de partida reproducible, pero Star Coordinates permite cambiar pesos y direcciones para explorar otro objetivo.

El perfil mediano de las candidatas hace explícito qué combinación de atributos caracteriza el brief. El resultado no afirma que una canción sea universalmente positiva: describe una consulta de características de audio.

## Tarea 4 — Examinar evolución temporal y popularidad

**Pregunta:** ¿Cómo cambia el perfil sonoro de las canciones populares a través de las décadas y qué atributos explican esos cambios?

Esta tarea usa `year`, `release_date`, `popularity` y los seis atributos de audio que ya contiene el archivo. Se agrupan las canciones por década y se excluyen grupos con menos de 20 observaciones. La tabla y los perfiles agregados se calculan sobre las 170,653 filas limpias; las tareas interactivas de canción individual conservan la muestra reproducible de 800.

La popularidad se divide mediante cuartiles dentro de cada década, no con un corte global que favorecería a las épocas recientes. RadViz es la vista principal para comparar perfiles medianos de décadas; Parallel Coordinates sirve para inspeccionar dos periodos. Las conclusiones se restringen a las décadas visibles y no implican causalidad histórica.

## Calidad y limitaciones de MDS

- Stress normalizado: `0.263`.
- Correlación entre distancias originales y proyectadas: `0.909`.
- Preservación media de los diez vecinos: `31.6%`.

Las métricas capturan propiedades diferentes. La correlación global de distancias puede ser alta mientras solo una parte de los vecinos inmediatos permanece igual. La aplicación muestra ambas para evitar juzgar la proyección solo por su apariencia.

## Limitaciones generales

- Los resultados corresponden a una muestra de 800 canciones del dataset, no a todo Spotify.
- La distancia asigna el mismo peso inicial a las seis variables normalizadas.
- El dataset termina en 2020 y su popularidad corresponde a la versión publicada.
- Artista y año sirven como contexto; no se analizaron géneros porque no están vinculados de manera inequívoca en el archivo usado.
- Reordenar ejes y anclajes cambia la lectura, por lo que la aplicación conserva una configuración reproducible para cada tarea.
