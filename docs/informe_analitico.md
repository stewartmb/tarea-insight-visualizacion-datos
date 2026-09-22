# Informe analítico — Perfiles musicales de Spotify

## Audiencia y propósito

La aplicación está dirigida a una persona que selecciona canciones para playlists y necesita comparar perfiles, encontrar similitudes y localizar combinaciones de características. La visualización es un medio para producir respuestas verificables. Esta idea sigue el énfasis de fundamentos del curso: el propósito es el insight y la gráfica ayuda a obtenerlo.

## Datos

La fuente es el `data.csv` del dataset Kaggle enlazado en el enunciado. Contiene 170,653 canciones entre 1921 y 2020. Para garantizar interacción fluida y permitir MDS clásico, se extrajo una muestra aleatoria reproducible de 800 registros con semilla 5343.

Se seleccionaron seis atributos cuantitativos: energía, valencia, bailabilidad, acústica, instrumentalidad y habla. Los valores se normalizaron a `[0,1]` con los mínimos y máximos del conjunto limpio completo. El análisis no utiliza género porque `data.csv` no contiene una relación género-canción verificable.

## Tarea 1 — Comparar perfiles de energía

**Pregunta:** ¿Cómo difieren las canciones de energía alta y baja en sus otras características?

Se definió energía baja como `≤ 0.253` y alta como `≥ 0.715`, los cuartiles de la muestra. Cada grupo contiene 200 canciones.

La diferencia más marcada aparece en acústica: la mediana es `0.956` para energía baja y `0.022` para energía alta, una diferencia de `-0.933` al restar alta menos baja. La valencia mediana aumenta de `0.337` a `0.583`, y la bailabilidad de `0.444` a `0.523`. Habla e instrumentalidad muestran diferencias medianas pequeñas en estos grupos.

Esto responde una comparación de perfiles. Parallel Coordinates muestra cada trayectoria y RadViz permite explorar el balance conjunto. La separación por cuartiles describe la muestra; no define categorías universales.

## Tarea 2 — Encontrar canciones similares

**Pregunta:** Para una canción seleccionada, ¿cuáles son las diez más similares y qué atributos explican la semejanza?

La configuración guardada selecciona **La Santa**, de Bad Bunny y Daddy Yankee (2020), por ser la canción de mayor popularidad dentro de la muestra. Se calculan distancias euclídeas usando las seis variables normalizadas. Su vecino más cercano es **Night by Night**, de Chromeo, con distancia `0.075`.

Entre los diez vecinos, instrumentalidad y habla presentan, en promedio, las menores diferencias cuadráticas respecto a la canción seleccionada. Esto identifica los atributos en los que el grupo cercano permanece más parecido; no significa que sean las únicas razones musicales de semejanza.

MDS sitúa canciones intentando conservar distancias. Parallel Coordinates y Star Coordinates permiten inspeccionar los perfiles originales que sustentan esa proximidad.

## Tarea 3 — Examinar combinaciones contrastantes

**Pregunta:** ¿Qué canciones combinan energía alta con valencia baja, o energía baja con valencia alta, y cómo difieren sus demás atributos?

Se localizaron 37 canciones de energía alta (`≥ 0.715`) y valencia baja (`≤ 0.299`), frente a 17 de energía baja (`≤ 0.253`) y valencia alta (`≥ 0.725`).

Además de las variables usadas para formar los grupos, la diferencia mediana más grande aparece en acústica: `0.004` para alta energía/baja valencia y `0.941` para baja energía/alta valencia. La bailabilidad mediana es `0.363` y `0.614`, respectivamente. Estos valores describen combinaciones menos intuitivas que una asociación simple entre energía y valencia.

Valencia es una característica provista por el dataset; el análisis no afirma conocer la emoción experimentada por cada oyente.

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
