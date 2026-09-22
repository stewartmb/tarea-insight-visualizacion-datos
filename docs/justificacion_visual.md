# Justificación visual de la aplicación

## Principio general

La aplicación sigue WHAT–WHY–HOW. Primero define qué entidad y atributos se analizan; luego formula la tarea; finalmente elige el canal visual que ayuda a responderla. La posición se reserva para comparar valores o proximidades. El color identifica grupos categóricos de la tarea, no magnitudes continuas. La opacidad mantiene el contexto sin competir con el subconjunto seleccionado.

## Decisiones comunes

| Decisión | Justificación | Evidencia en la interfaz |
|---|---|---|
| Idioma | La exposición y el curso se desarrollan en español. Se mantienen los nombres RadViz, Star Coordinates, Parallel Coordinates y MDS porque son nombres técnicos del material y de las API. | Títulos, instrucciones, tareas y etiquetas en español; nombres de técnicas sin traducción artificial. |
| Color | El color codifica grupos nominales relacionados con la tarea: energía alta/baja, selección/vecinas o los dos contrastes. No codifica valores continuos. | Leyenda dinámica y paleta estable por tarea. |
| Posición | Es el canal principal porque permite comparar perfiles y proximidades con mayor precisión que color o tamaño. | Coordenadas de las líneas, puntos, anclajes y proyección. |
| Opacidad | Reduce el ruido de 800 registros sin eliminar el contexto. La selección y el elemento bajo el cursor conservan prioridad visual. | Brushing, mouseover y clic actualizan las cuatro vistas. |
| Texto | Identifica la pregunta, las variables, las unidades de lectura y la limitación de cada análisis. | Panel WHAT–WHY–HOW, títulos, leyenda, tooltip y tarjetas de justificación. |
| Escala | Los seis atributos se normalizan a `[0,1]` antes de combinarse o calcular distancias. | Ejes de Parallel Coordinates y valores de la selección. |

## RadViz

- **Qué representa:** la posición es un promedio ponderado de los seis atributos; cada anclaje representa una dimensión.
- **Por qué esa marca:** los puntos permiten comparar muchas canciones; las líneas desde el centro hacia los anclajes hacen visible la estructura radial.
- **Por qué esos canales:** la posición resume el balance multidimensional; los anclajes verdes separan la estructura de los datos; el color mantiene la categoría de la tarea.
- **Por qué la circunferencia:** establece una referencia geométrica común y evita que cada atributo tenga una escala de pantalla distinta.
- **Interacción:** mover un anclaje explora cómo cambia la lectura; no modifica los datos originales.
- **Precaución:** un punto cercano a un anclaje no debe leerse como causalidad; indica mayor contribución relativa en esta configuración.

## Star Coordinates

- **Qué representa:** cada atributo es un vector y la posición resulta de sumar sus contribuciones.
- **Por qué esa marca:** los puntos muestran simultáneamente los perfiles y las líneas muestran dirección y peso.
- **Por qué esos canales:** la dirección comunica orientación de la dimensión; la longitud del vector comunica su peso; los extremos arrastrables hacen visible la exploración.
- **Escala:** el radio de referencia se mantiene estable para que el desplazamiento responda al cambio de dirección o peso y no a un autoajuste.
- **Interacción:** cambiar un extremo modifica la proyección, no el valor normalizado de la canción.

## Parallel Coordinates

- **Qué representa:** cada línea es una canción; la altura en cada eje es el valor normalizado de un atributo.
- **Por qué esa marca:** la línea conserva el perfil completo y permite seguir combinaciones entre dimensiones.
- **Orden inicial en Tarea 1:** `Energía → Acústica → Valencia → Bailabilidad → Instrumentalidad → Habla`. Energía inicia la comparación y acústica queda adyacente porque es la diferencia más fuerte de la muestra; valencia y bailabilidad siguen para leer el contraste de perfil; instrumentalidad y habla completan la lectura.
- **Orden dependiente de la tarea:** el orden no es una verdad universal. Para comparar energía con acústica se recomienda arrastrar acústica junto a energía, porque las relaciones entre ejes adyacentes se inspeccionan con mayor facilidad. El profesor enfatizó que el orden de ejes cambia la lectura.
- **Brushing:** seleccionar un intervalo en un eje restringe por intersección los registros resaltados. Se mantienen los rangos por dimensión aunque los ejes se reordenen.
- **Color y opacidad:** el color conserva el grupo de la tarea; la opacidad permite distinguir el subconjunto brushed sin borrar las demás líneas.

## MDS

- **Qué representa:** la posición intenta conservar las distancias calculadas en las seis variables normalizadas.
- **Por qué esa marca:** el punto es adecuado para mostrar proximidad entre muchas canciones.
- **Ejes:** “Dimensión MDS 1” y “Dimensión MDS 2” no son energía, valencia ni otras variables originales; son coordenadas sintéticas de la proyección.
- **Color:** mantiene la codificación de la tarea para conectar la proyección con las demás vistas.
- **Evaluación:** stress, correlación de distancias y preservación de vecindad se muestran juntos porque evalúan propiedades distintas.
- **Precaución:** MDS no genera clusters. La cercanía es una aproximación y debe verificarse en Parallel Coordinates o Star Coordinates.

## Cómo se ve la consistencia entre vistas

Todas las vistas usan el mismo identificador de canción y comparten el estado de selección. Un clic o brushing no crea cuatro resultados distintos: resalta el mismo subconjunto en representaciones complementarias.

## Relación con el material de clase

- **WHAT:** seis atributos cuantitativos, unidad de observación canción y normalización.
- **WHY:** comparar perfiles, buscar similitudes y localizar combinaciones contrastantes.
- **HOW:** posición y líneas para comparar; color para categorías; texto y escalas para hacer explícita la lectura; interacción para explorar sin perder la configuración reproducible.
- **Criterio de orden:** el eje debe ordenarse de acuerdo con la relación que la tarea necesita hacer visible, no por una supuesta neutralidad del gráfico.
