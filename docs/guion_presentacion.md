# Guion completo de exposición — Tarea Insight

## Propósito del guion

Este libreto está preparado para una exposición de **10 a 12 minutos**. Integra de forma natural los cinco aspectos evaluados: claridad, profundidad analítica, justificación del diseño, precisión técnica y cobertura de las cuatro tareas. No conviene mencionar repetidamente la rúbrica; debes demostrarla mediante las preguntas, las cifras, las decisiones y la interacción.

Las partes entre comillas son el discurso sugerido. Las indicaciones entre corchetes son acciones y **no se leen**.

---

## 0. Preparación antes de empezar

1. Ejecutar la aplicación y abrir `http://127.0.0.1:5343`.
2. Usar el navegador a pantalla completa y comprobar que se ven los títulos sin ampliar la página.
3. Pulsar **Restablecer vista** y luego **Reproducir este análisis** en la Tarea 1.
4. Comprobar que la insignia indique **Configuración guardada**.
5. No comenzar con un filtro o un eje desplazado de una demostración anterior.

---

## 1. Apertura: problema, audiencia y recorrido — 50 segundos

[Mostrar la cabecera y las cuatro tarjetas de tareas. No bajar todavía a los gráficos.]

> “Buenos días. Mi trabajo se llama *Perfiles musicales de Spotify*. Está pensado para una persona que crea playlists y necesita comparar perfiles de audio, encontrar canciones similares, descubrir combinaciones contrastantes y estudiar la evolución temporal del catálogo.
>
> En lugar de elegir primero un gráfico, partí de cuatro preguntas analíticas. Después definí qué datos necesitaba y finalmente seleccioné las técnicas de representación. Es decir, seguí el marco WHAT–WHY–HOW trabajado en clase.
>
> La aplicación responde esas cuatro preguntas con cuatro técnicas multidimensionales: RadViz, Star Coordinates, Parallel Coordinates y una proyección MDS. Durante la demostración mostraré no solo cómo se ven, sino qué respuesta aporta cada una y qué limitaciones tiene.”

**Idea que debe quedar clara:** existe una audiencia, un propósito y cuatro preguntas. Las visualizaciones son medios para responderlas.

---

## 2. Datos y preparación — 1 minuto

[Señalar el resumen superior: 800 canciones, rango temporal y vecindad MDS. Luego bajar brevemente a “Método y alcance” si hace falta.]

> “Utilicé el archivo `data.csv` exacto del dataset de Spotify enlazado en el enunciado. La unidad de observación es una canción. El archivo contiene 170 mil 653 registros entre 1921 y 2020.
>
> Para que las interacciones y el cálculo de MDS fueran fluidos, trabajé con una muestra aleatoria reproducible de 800 canciones, usando la semilla 5343. Esto significa que el análisis se puede volver a generar con los mismos registros; no es una selección manual de canciones favorables.
>
> Seleccioné seis atributos cuantitativos: energía, valencia, bailabilidad, acústica, instrumentalidad y habla. Antes del análisis verifiqué duplicados, valores faltantes y rangos. Los atributos se normalizaron entre cero y uno mediante min–max, conservando por separado los valores originales.
>
> La normalización es necesaria porque la distancia y las técnicas de proyección deben comparar atributos en una escala común. Además, no incorporé género porque el archivo `data.csv` no ofrece una relación inequívoca entre cada canción y un género; preferí no crear una unión que no pudiera justificar.”

Si el profesor pide la fórmula:

> “Para cada atributo usé: valor normalizado igual a valor menos mínimo, dividido entre máximo menos mínimo. Los mínimos y máximos se calcularon sobre el conjunto limpio completo, no solo sobre la muestra.”

---

## 3. Tarea 1: comparar perfiles de energía — 1 minuto 40 segundos

[Pulsar **Reproducir este análisis** en la tarjeta 1. Señalar la pregunta, el resultado y los bloques WHAT–WHY–HOW. Después bajar a Parallel Coordinates y RadViz.]

> “La primera pregunta es: ¿cómo difieren las canciones de energía alta y baja en sus otras características?
>
> Para responderla utilicé los cuartiles de la muestra. Energía baja corresponde a valores menores o iguales a 0.253 y energía alta a valores mayores o iguales a 0.715. Así comparo dos grupos del mismo tamaño: 200 canciones en cada uno.
>
> El hallazgo más fuerte no está únicamente en energía, que define los grupos, sino en acústica. La mediana baja de 0.956 en el grupo de energía baja a 0.022 en el grupo de energía alta: una disminución aproximada de 0.933. A la vez, la valencia mediana aumenta de 0.337 a 0.583 y la bailabilidad de 0.444 a 0.523.
>
> Parallel Coordinates es útil aquí porque cada línea conserva el perfil de una canción a través de las seis dimensiones. Esto permite ver simultáneamente la distribución y las combinaciones individuales. RadViz complementa esa lectura al resumir el balance entre atributos mediante anclajes alrededor de una circunferencia.
>
> Por lo tanto, en esta muestra, las canciones de alta energía se distinguen sobre todo por una acústica mucho menor y, en mediana, por mayor valencia y bailabilidad. No presento esos cortes como categorías universales: son cuartiles definidos para esta muestra reproducible.”

[Pasar el cursor sobre una línea o punto y luego hacer clic en una canción. Señalar que el nombre y los seis valores aparecen en “Selección coordinada”.]

> “El mouseover permite identificar cada observación y el clic conserva la misma canción en todas las vistas. Así puedo verificar que el patrón agregado también corresponde a perfiles reales, no solo a una media o una mediana.”

**No decir:** “la energía causa menor acústica”. Hablar de asociación o diferencia observada.

---

## 4. Demostración breve de Parallel Coordinates — 55 segundos

[En Parallel Coordinates, arrastrar el título de un eje para colocarlo junto a otro. Luego aplicar un brushing corto sobre un eje y finalmente restablecer la vista.]

> “El orden de los ejes en Parallel Coordinates afecta qué relaciones son fáciles de percibir. Por eso los ejes se pueden reordenar manualmente. Al colocar energía junto a acústica, la relación entre ambas resulta más directa de inspeccionar.
>
> También implementé brushing por eje. Al seleccionar un intervalo, las mismas canciones se resaltan de manera coordinada en Parallel Coordinates, RadViz, Star Coordinates y MDS. La aplicación cambia la etiqueta a *Exploración modificada* para distinguir una exploración libre del análisis guardado y reproducible.”

[Pulsar **Restablecer vista** o volver a **Reproducir este análisis** antes de continuar.]

---

## 5. Tarea 2: encontrar canciones similares — 2 minutos

[Pulsar **Reproducir este análisis** en la tarjeta 2. Verificar que se seleccione “La Santa”. Señalar MDS y luego la canción seleccionada.]

> “La segunda pregunta es: para una canción seleccionada, ¿cuáles son las diez más similares y qué atributos explican esa semejanza?
>
> La configuración reproducible parte de *La Santa*, de Bad Bunny y Daddy Yankee, porque es la canción de mayor popularidad dentro de la muestra. La similitud se calcula con distancia euclídea sobre los seis atributos normalizados y con el mismo peso inicial para todos.
>
> Su vecino más cercano es *Night by Night*, de Chromeo, con una distancia normalizada de 0.075. Entre los diez vecinos, instrumentalidad y habla presentan en promedio las menores diferencias cuadráticas respecto a la canción seleccionada. Esto indica en qué atributos ese grupo cercano se mantiene más parecido; no significa que sean las únicas razones musicales de similitud.
>
> MDS proyecta a dos dimensiones las distancias calculadas en seis dimensiones. Los puntos cercanos representan perfiles similares según estas variables. Los ejes de MDS no son energía ni valencia: son coordenadas de la proyección y no deben interpretarse como atributos originales.”

[Pasar el cursor sobre puntos cercanos a la selección en MDS. Hacer clic en uno y mostrar que la selección se actualiza en todas las vistas.]

> “No uso MDS como un algoritmo de clustering. Lo utilizo para inspeccionar proximidades. Después verifico esa proximidad en Parallel Coordinates y Star Coordinates, donde sí puedo observar el perfil de atributos que la produjo.”

[Señalar el panel de Calidad MDS.]

> “También evalué la proyección en lugar de juzgarla solo por su apariencia. El stress normalizado es 0.263; la correlación entre distancias originales y proyectadas es 0.909; y la preservación promedio de los diez vecinos es 31.6 por ciento.
>
> Estas métricas no se contradicen. La correlación resume la relación global entre muchas distancias, mientras que la preservación de vecindad pregunta cuántos vecinos inmediatos se conservaron. La proyección mantiene bastante bien la estructura global, pero cambia una parte importante de los vecinos locales; por eso toda interpretación de cercanía debe contrastarse con las vistas de atributos.”

---

## 6. Tarea 3: combinaciones contrastantes — 1 minuto 30 segundos

[Pulsar **Reproducir este análisis** en la tarjeta 3. Señalar pregunta y resultado.]

> “La tercera pregunta busca casos menos evidentes: ¿qué canciones combinan energía alta con valencia baja, o energía baja con valencia alta, y cómo difieren sus otros atributos?
>
> Encontré 37 canciones con energía alta y valencia baja, frente a 17 con energía baja y valencia alta. Además de las dos variables usadas para formar los grupos, la diferencia mediana más grande vuelve a aparecer en acústica: 0.004 para alta energía y baja valencia, frente a 0.941 para baja energía y alta valencia.
>
> La bailabilidad mediana también cambia: 0.363 en el primer grupo y 0.614 en el segundo. Esto evita reducir el análisis a una relación simple entre energía y valencia: las combinaciones contrastantes poseen perfiles distintos en otras dimensiones.
>
> Para localizar los casos uso los cuartiles de energía y valencia; con brushing puedo restringir intervalos y comprobar dónde quedan esas mismas canciones en las demás representaciones. La palabra valencia proviene del dataset y no equivale a afirmar qué emoción experimenta realmente cada oyente.”

[Aplicar brevemente brushing en energía y valencia o pasar el cursor sobre los dos grupos. No dejar el filtro activo para el cierre.]

---

## 7. Tarea 4: evolución temporal y popularidad — 1 minuto 20 segundos

[Pulsar **Reproducir este análisis** en la tarjeta 4. Mostrar RadViz y la tabla de décadas.]

> “La cuarta pregunta es: ¿cómo cambia el perfil sonoro de las canciones populares a través de las décadas y qué atributos explican esos cambios?
>
> Esta tarea utiliza únicamente columnas que ya existen en el CSV: año, fecha de lanzamiento, popularidad y los seis atributos de audio. Para evitar conclusiones basadas en grupos pequeños, solo se muestran décadas con al menos 20 canciones. Los perfiles agregados se calculan sobre el dataset limpio completo; la muestra de 800 se mantiene como contexto para las interacciones individuales.
>
> La popularidad se divide dentro de cada década mediante cuartiles. Así no comparo directamente un valor de popularidad de una época antigua con uno reciente como si fueran escalas históricas idénticas. RadViz es la técnica principal porque compara varios atributos simultáneamente; Parallel Coordinates sirve para inspeccionar dos décadas cuando se necesita detalle por canción.
>
> La tabla hace visible el tamaño de cada grupo. Si una década tuviera pocos registros, no la usaría para sostener un hallazgo. El resultado describe diferencias observadas en este catálogo y no demuestra que una época haya causado un cambio sonoro.”

[Señalar una década en RadViz y luego la cantidad correspondiente en la tabla.]

## 8. Cómo funcionan RadViz y Star Coordinates — 1 minuto 20 segundos

[Mostrar RadViz. Arrastrar un anclaje una distancia visible pero moderada. Después mostrar Star Coordinates y arrastrar el extremo de un eje.]

> “RadViz y Star Coordinates parten del notebook multidimensional trabajado en clase, pero cumplen funciones distintas.
>
> En RadViz, cada atributo es un anclaje sobre la circunferencia. La posición de una canción es el promedio ponderado de esos anclajes usando sus valores normalizados. Una canción se aproxima a los anclajes de los atributos que tienen mayor peso en su perfil. Si la suma de valores fuera cero, el código trata ese caso explícitamente para evitar una división inválida.
>
> Los anclajes son arrastrables. Esto no cambia los datos; cambia la disposición desde la cual inspeccionamos el balance multidimensional.
>
> En Star Coordinates, cada dimensión funciona como un vector. La posición resulta de sumar los vectores escalados por los valores de la canción. Al mover un extremo modifico simultáneamente dirección y peso del atributo. Por eso la escala de pantalla permanece estable: así el desplazamiento observado corresponde al cambio del vector y no a un autoajuste de la vista.”

Si pide las fórmulas:

> “En RadViz se usa la suma de cada valor por la posición de su anclaje, dividida entre la suma de los valores. En Star Coordinates se suman los vectores de los ejes multiplicados por cada valor normalizado.”

---

## 9. Procedencia del código y precisión técnica — 55 segundos

[Mantener las cuatro técnicas visibles o bajar a “Método y alcance”.]

> “La implementación separa cada técnica en su propio módulo de JavaScript y utiliza D3 versión 7 para construir SVG, escalas, selecciones e interacciones.
>
> Las fórmulas base de RadViz y Star Coordinates se adaptaron del notebook de clase. Parallel Coordinates se desarrolló con los patrones de escalas, ejes y data join vistos en D3, porque el material no incluía una implementación completa. El MDS clásico se calculó durante el preprocesamiento con Python y NumPy, y D3 representa las coordenadas resultantes.
>
> Además, verifiqué con pruebas la normalización, un caso controlado de distancias MDS, el orden de los vecinos, el caso de suma cero en RadViz y la coordinación de la aplicación Flask. Así puedo diferenciar claramente el código adaptado de clase del desarrollo adicional requerido por la tarea.”

No afirmar que NumPy es una biblioteca de visualización. Flask sirve la aplicación, NumPy calcula MDS y D3 realiza las visualizaciones.

---

## 10. Cierre: respuestas, límites y aporte — 55 segundos

[Volver a la zona de las tres preguntas o dejar visibles las cuatro visualizaciones.]

> “En síntesis, el primer análisis mostró que la separación entre energía alta y baja está acompañada principalmente por una gran diferencia de acústica. El segundo permitió encontrar vecinos de una canción en seis dimensiones y comprobar que una proyección globalmente consistente todavía puede alterar vecindades locales. El tercero localizó combinaciones contrastantes de energía y valencia y reveló diferencias adicionales en acústica y bailabilidad. El cuarto permitió comparar perfiles agregados por década con evidencia del tamaño de cada grupo.
>
> Las conclusiones se limitan a una muestra reproducible de 800 canciones, al dataset publicado hasta 2020 y a una definición de similitud basada únicamente en seis atributos con igual peso inicial. Por eso la aplicación permite explorar, pero siempre conserva una configuración guardada para reproducir cada respuesta.
>
> El aporte central no es mostrar cuatro gráficos aislados, sino construir un recorrido en el que cada técnica responde una parte de la pregunta, las selecciones se coordinan y los hallazgos se expresan con cifras verificables. Gracias.”

---

# Preguntas probables y respuestas preparadas

## ¿Por qué utilizaste una muestra de 800 y no todos los registros?

> “El dataset original se conserva completo para limpieza y normalización. La muestra limita el costo de las interacciones y de la matriz de distancias de MDS, que crece cuadráticamente. Utilicé una semilla fija para que la selección fuera reproducible. Por eso mis conclusiones se presentan como resultados de la muestra, no como estimaciones de todo Spotify.”

## ¿Por qué usaste min–max?

> “Porque las técnicas combinan atributos y calculan distancias. Llevarlos al intervalo cero–uno evita que una dimensión domine solo por su escala numérica y coincide con el tratamiento utilizado en los ejercicios multidimensionales de clase.”

## ¿Por qué distancia euclídea?

> “Porque necesitaba una medida transparente y explicable sobre los seis atributos normalizados. Todos reciben el mismo peso inicial. Es una decisión de diseño, no una verdad universal sobre similitud musical; una versión futura podría comparar pesos o métricas.”

## ¿MDS encontró clusters?

> “No. MDS produjo una proyección que intenta conservar distancias. Las agrupaciones aparentes son patrones para inspeccionar, pero no etiquetas generadas por un algoritmo de clustering.”

## ¿Qué significa un stress de 0.263?

> “Resume el error relativo entre distancias originales y proyectadas; menor es mejor. No lo convierto en una etiqueta automática de ‘bueno’ o ‘malo’. Lo interpreto junto con la correlación de distancias y la preservación de vecindad.”

## ¿Por qué la correlación es alta y la vecindad solo 31.6%?

> “Porque miden escalas distintas. La correlación considera la estructura global de las distancias, mientras que la vecindad exige conservar miembros concretos entre los diez más cercanos. Es posible mantener la tendencia global y cambiar vecinos locales.”

## ¿Por qué Parallel Coordinates para la primera tarea?

> “Porque la tarea exige comparar perfiles completos, no solo dos variables. Cada polilínea mantiene los seis valores de una canción y el brushing permite localizar subconjuntos. El orden de ejes se puede modificar para poner juntas las variables cuya relación interesa examinar.”

## ¿Qué cambia al mover un anclaje de RadViz?

> “Cambia la disposición visual de las fuerzas o pesos, no los valores de los datos. La interacción ayuda a examinar solapamientos desde otra configuración, pero cualquier hallazgo se contrasta con los valores originales.”

## ¿Qué cambia al mover un eje de Star Coordinates?

> “Cambian la dirección y la magnitud del vector de esa dimensión. Por tanto, cambia cuánto y hacia dónde contribuye el atributo a la posición proyectada.”

## ¿Cómo verificaste que las cuatro vistas hablan de la misma canción?

> “Todos los registros tienen un identificador estable y comparten un estado de selección. Un clic en cualquier vista actualiza el panel de la canción y resalta ese mismo identificador en las demás.”

## ¿Por qué no analizaste géneros?

> “El archivo requerido por el enunciado no incluye un campo de género por canción con una relación inequívoca. Usarlo habría exigido una unión adicional y supuestos que no podía defender con la misma precisión.”

## ¿Qué viene de clase y qué desarrollaste tú?

> “De clase adapté las fórmulas y patrones de RadViz y Star Coordinates, además de selecciones, escalas, ejes, SVG y data join en D3. Parallel Coordinates y el MDS clásico fueron desarrollos adicionales para completar las técnicas requeridas. La trazabilidad documenta esa diferencia.”

## ¿Qué insight consideras más importante?

> “La diferencia de acústica, porque aparece con mucha magnitud tanto al comparar niveles de energía como al observar combinaciones contrastantes de energía y valencia. Sin embargo, lo presento como un patrón de esta muestra y no como causalidad.”

## ¿Qué mejorarías con más tiempo?

> “Compararía distintas métricas y pesos de similitud, evaluaría la estabilidad de los hallazgos en varias muestras y añadiría una comparación entre la muestra interactiva y estadísticas calculadas sobre el conjunto completo.”

---

# Mapa privado de evidencia de la rúbrica

Esta sección es para preparar la exposición; **no hace falta leerla ni mostrarla**.

| Criterio | Dónde queda demostrado durante la exposición |
|---|---|
| Claridad | Se formula cada pregunta antes del gráfico; se explican títulos, escalas, leyenda, interacción y significado de los ejes; se evita lenguaje causal; cada tarea termina con una respuesta concreta. |
| Perspectiva analítica | Se presentan cuartiles, recuentos, medianas, diferencias, vecino más cercano, métricas MDS y límites. Los resultados se conectan con la necesidad de construir playlists. |
| Justificación de diseño | Se explica WHAT–WHY–HOW, por qué se usan seis variables, normalización, muestra, distancia y el papel complementario de cada técnica. |
| Precisión técnica | Se describen correctamente RadViz, Star Coordinates, Parallel Coordinates y MDS; se distingue proyección de clustering; se explican interacciones, calidad, módulos, D3, Flask, NumPy y pruebas. |
| Cobertura de tareas | Se reproducen en orden las tres tareas, cada una con pregunta, método, evidencia, respuesta y limitación. Las cuatro técnicas requeridas aparecen en el recorrido. |

---

# Lista final de ensayo

- Pronunciar con seguridad las cifras clave: **170,653**, **800**, **0.253**, **0.715**, **0.933**, **0.075**, **37 frente a 17**, **0.263**, **0.909** y **31.6%**.
- Poder definir en una frase RadViz, Star Coordinates, Parallel Coordinates y MDS.
- No llamar clusters a los grupos visibles en MDS.
- No afirmar causalidad.
- No decir que la muestra representa todo Spotify.
- Mostrar al menos una interacción de cada tipo: mouseover, clic, brushing y drag.
- Restablecer la vista después de una exploración para no mezclar configuraciones.
- Terminar con respuestas y límites, no con una descripción del código.
