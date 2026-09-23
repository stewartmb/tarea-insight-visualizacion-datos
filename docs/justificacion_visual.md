# Justificación visual de la aplicación

## Principio general

La aplicación sigue WHAT–WHY–HOW. Primero define qué entidad y atributos se analizan; luego formula la tarea; finalmente elige el canal visual que ayuda a responderla. La posición se reserva para comparar valores o proximidades. El color identifica grupos categóricos de la tarea (o, en las décadas, un orden temporal); solo el mapa de correlación codifica una magnitud con color y lo hace con una leyenda divergente explícita. La opacidad mantiene el contexto sin competir con el subconjunto seleccionado.

## Decisiones comunes

| Decisión | Justificación | Evidencia en la interfaz |
|---|---|---|
| Idioma | La exposición y el curso se desarrollan en español. Se mantienen los nombres RadViz, Star Coordinates, Parallel Coordinates y MDS porque son nombres técnicos del material y de las API. | Títulos, instrucciones, tareas y etiquetas en español; nombres de técnicas sin traducción artificial. |
| Color | Categorías nominales relacionadas con la tarea: Canción A/B, selección/vecinas, candidatas/perfil objetivo. Para las décadas se usa una escala de color ordenada (de arena a azul marino, construida con `d3.scaleLinear`), porque el tiempo es una variable ordinal. | Leyenda dinámica y paleta estable por tarea. |
| Posición | Canal principal porque permite comparar perfiles y proximidades con mayor precisión que color o tamaño. | Coordenadas de líneas, puntos, anclajes, trayectoria y proyección. |
| Contexto | Las canciones que no participan en la pregunta se dibujan en gris tenue y pequeñas; el subconjunto de la tarea, en color y encima. Sin contexto, RadViz o MDS con dos u once puntos no ofrecen referencia. | Todas las vistas de puntos y líneas. |
| Texto | Identifica la pregunta, las variables, las unidades de lectura, los hallazgos y la limitación de cada análisis. | Panel WHAT–WHY–HOW, hallazgos, títulos, leyenda, tooltip y tarjetas de justificación. |
| Escala | Los seis atributos se normalizan a `[0,1]` antes de combinarse o calcular distancias; Parallel Coordinates ofrece además una escala por percentil dentro de la muestra. | Ejes de Parallel Coordinates, tooltips en unidades originales. |
| Orden de las vistas | La técnica principal de cada tarea aparece primero y con borde destacado; las de apoyo después. | Etiqueta «Técnica principal / Técnica de apoyo / Gráfico de apoyo». |

## RadViz (principal en la Tarea 4; apoyo en 1 y 3)

- **Qué representa:** la posición es un promedio ponderado de los seis atributos; cada anclaje representa una dimensión.
- **Por qué esa marca:** los puntos permiten comparar muchas canciones; las líneas desde el centro hacia los anclajes hacen visible la estructura radial.
- **Trayectoria por décadas:** en la Tarea 4 los perfiles medianos del top 25 % popular se unen en orden cronológico. Una línea entre marcadores ordenados comunica dirección de cambio mejor que once puntos sueltos: se lee de un vistazo que el catálogo popular se desplaza del anclaje de acústica hacia energía, valencia y bailabilidad. Los perfiles de toda la década aparecen como marcadores huecos unidos por una línea punteada, para comprobar si las populares se apartan de su época.
- **Etiquetas:** siempre se rotula la primera y la última década; las intermedias solo cuando hay espacio, y todas tienen tooltip. Un clic en una década la enfoca en todas las vistas.
- **Interacción:** mover un anclaje explora cómo cambia la lectura; no modifica los datos originales.
- **Precaución:** un punto cercano a un anclaje no debe leerse como causalidad; indica mayor contribución relativa en esta configuración.

## Star Coordinates (principal en la Tarea 3)

- **Qué representa:** cada atributo es un vector y la posición resulta de sumar sus contribuciones (`P = Σ vᵢ·wᵢ·(cos θᵢ, sin θᵢ)`).
- **Por qué esa marca:** los puntos muestran simultáneamente los perfiles y las líneas muestran dirección y peso.
- **Escala fija y coherente:** los vectores dibujados y las posiciones de los puntos usan el mismo factor. Una canción con valor 1 en un solo atributo cae exactamente en la punta de ese eje; el anillo interior marca el alcance de un eje con peso 1. El radio de referencia no se autoajusta, de modo que el desplazamiento observado responde solo al cambio de dirección o peso (0–1.5×).
- **Interacción:** cambiar un extremo modifica la proyección, no el valor normalizado de la canción. El marcador oscuro (perfil mediano de las candidatas) se recalcula con cada cambio.

## Parallel Coordinates (principal en la Tarea 1; apoyo en 2, 3 y 4)

- **Qué representa:** cada línea es una canción; la altura en cada eje es el valor del atributo en la escala elegida.
- **Por qué esa marca:** la línea conserva el perfil completo y permite seguir combinaciones entre dimensiones.
- **Orden inicial en Tarea 1:** `Energía → Acústica → Valencia → Bailabilidad → Instrumentalidad → Habla`. Energía y acústica quedan adyacentes porque son las variables más correlacionadas del dataset (r = −0.75, mapa de correlación); valencia y bailabilidad (r = 0.56) siguen para leer el carácter sonoro; instrumentalidad y habla completan la lectura.
- **Orden dependiente de la tarea:** el orden no es una verdad universal. Los ejes se reordenan arrastrando su nombre; las relaciones entre ejes adyacentes se inspeccionan con mayor facilidad.
- **Inversión de ejes (⇅):** invertir un eje convierte cruces en líneas paralelas cuando dos variables están negativamente correlacionadas (por ejemplo, invertir acústica junto a energía) y es una operación de lectura, no de datos.
- **Escalado:** «Normalizada 0–1» usa los rangos del dataset completo y es comparable entre vistas; «Percentil dentro de la muestra» sustituye cada valor por su rango (0–100 %), lo que separa los valores concentrados cerca de cero (habla, instrumentalidad) y permite leer si una canción está, por ejemplo, en el 90 % superior de bailabilidad. El brushing se reinicia al cambiar de escala porque los intervalos dejan de ser comparables.
- **Brushing:** seleccionar un intervalo en un eje restringe por intersección los registros resaltados en las cuatro vistas. Se mantienen los rangos por dimensión aunque los ejes se reordenen.
- **Perfiles de referencia:** en la Tarea 1 las líneas entrecortadas son directamente Canción A y B; en la Tarea 4 son los perfiles medianos del top 25 % de cada década, rotulados en el eje donde más se separan.

## MDS (principal en la Tarea 2)

- **Qué representa:** la posición intenta conservar las distancias calculadas en las seis variables normalizadas.
- **Por qué esa marca:** el punto es adecuado para mostrar proximidad entre muchas canciones.
- **Ejes:** “Dimensión MDS 1” y “Dimensión MDS 2” no son energía, valencia ni otras variables originales; son coordenadas sintéticas de la proyección.
- **Evaluación:** stress, correlación de distancias y preservación de vecindad se muestran juntos porque evalúan propiedades distintas; la Tarea 2 informa además cuántas de las diez vecinas de la canción seleccionada siguen entre las diez más cercanas del plano.
- **Precaución:** MDS no genera clusters. La cercanía es una aproximación y debe verificarse en Parallel Coordinates o Star Coordinates.

## Gráficos de apoyo

- **Evolución por década (Tarea 4):** una línea por atributo, continua para el top 25 % popular y punteada para toda la década, en unidades originales 0–1. Es la vista más precisa para leer magnitudes que RadViz solo resume; el color por atributo es nominal y se rotula al final de cada línea. Hover sobre una columna muestra los seis valores; clic enfoca la década.
- **Correlación entre atributos (Tarea 1):** mapa de calor 6×6 con escala divergente azul–rojo y valores impresos. Fundamenta el orden de los ejes de Parallel Coordinates y ayuda a interpretar por qué ciertos anclajes de RadViz se oponen.

## Cómo se ve la consistencia entre vistas

Todas las vistas usan el mismo identificador de canción y comparten el estado de selección, la década enfocada y el brushing. Un clic o brushing no crea cuatro resultados distintos: resalta el mismo subconjunto en representaciones complementarias. La insignia «Configuración guardada / Exploración modificada» distingue la respuesta reproducible de la exploración libre.

## Relación con el material de clase

- **WHAT:** seis atributos cuantitativos, unidad de observación canción y normalización.
- **WHY:** comparar perfiles, buscar similitudes, diseñar un perfil objetivo y estudiar evolución temporal.
- **HOW:** posición y líneas para comparar; color para categorías u orden temporal; texto y escalas para hacer explícita la lectura; interacción para explorar sin perder la configuración reproducible.
- **Criterio de orden:** el eje debe ordenarse de acuerdo con la relación que la tarea necesita hacer visible (aquí, con evidencia de correlación), no por una supuesta neutralidad del gráfico.
