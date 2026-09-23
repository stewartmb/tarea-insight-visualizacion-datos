# Guion completo de exposición — Tarea Insight

## Propósito del guion

Este libreto está preparado para una exposición de **10 a 12 minutos**. Integra de forma natural los cinco aspectos evaluados: claridad, profundidad analítica, justificación del diseño, precisión técnica y cobertura de las cuatro tareas, además de la interacción. No conviene mencionar repetidamente la rúbrica; debes demostrarla mediante las preguntas, las cifras, las decisiones y la interacción.

Las partes entre comillas son el discurso sugerido. Las indicaciones entre corchetes son acciones y **no se leen**. Todas las cifras aparecen en el panel «Hallazgos» de la aplicación: no hace falta memorizarlas, basta leerlas.

---

## 0. Preparación antes de empezar

1. Ejecutar la aplicación y abrir `http://127.0.0.1:5343`.
2. Usar el navegador a pantalla completa y comprobar que se ven los títulos sin ampliar la página.
3. Pulsar **Restablecer vista** y luego **Reproducir este análisis** en la Tarea 1.
4. Comprobar que la insignia indique **Configuración guardada**.
5. No comenzar con un filtro, un eje invertido o una escala distinta de una demostración anterior.

---

## 1. Apertura: problema, audiencia y recorrido — 50 segundos

[Mostrar la cabecera y las cuatro tarjetas de tareas. No bajar todavía a los gráficos.]

> “Buenos días. Mi trabajo se llama *Perfiles musicales de Spotify*. Está pensado para una persona que crea playlists y necesita comparar perfiles de audio, encontrar canciones similares, diseñar un objetivo sonoro y estudiar la evolución temporal del catálogo.
>
> En lugar de elegir primero un gráfico, partí de cuatro preguntas analíticas. Después definí qué datos necesitaba y finalmente seleccioné las técnicas de representación: el marco WHAT–WHY–HOW trabajado en clase.
>
> La aplicación responde esas cuatro preguntas con las cuatro técnicas multidimensionales exigidas: RadViz, Star Coordinates, Parallel Coordinates y una proyección MDS, más dos gráficos de apoyo. Cada tarea tiene una técnica principal, y en cada una mostraré no solo cómo se ve, sino qué respuesta concreta aporta y qué limitación tiene.”

**Idea que debe quedar clara:** existe una audiencia, un propósito y cuatro preguntas. Las visualizaciones son medios para responderlas.

---

## 2. Datos y preparación — 1 minuto

[Señalar el resumen superior: 170,653 canciones, 800 en la muestra, 1923–2020 y vecindad MDS.]

> “Utilicé el archivo `data.csv` exacto del dataset de Spotify enlazado en el enunciado. La unidad de observación es una canción. El archivo contiene 170 mil 653 registros entre 1921 y 2020, sin duplicados ni valores inválidos en las variables de audio.
>
> Para que las interacciones y el cálculo de MDS fueran fluidos, las tareas 1 a 3 trabajan con una muestra aleatoria reproducible de 800 canciones, con la semilla 5343. La tarea temporal usa el dataset completo agrupado por décadas.
>
> Seleccioné seis atributos cuantitativos: energía, valencia, bailabilidad, acústica, instrumentalidad y habla, normalizados entre cero y uno mediante min–max sobre el conjunto completo, conservando por separado los valores originales. No incorporé género porque el archivo no ofrece una relación inequívoca entre cada canción y un género; preferí no crear una unión que no pudiera justificar.”

Si el profesor pide la fórmula:

> “Valor normalizado igual a valor menos mínimo, dividido entre máximo menos mínimo. Los mínimos y máximos se calcularon sobre el conjunto limpio completo, no solo sobre la muestra.”

---

## 3. Tarea 1: comparar dos canciones — 1 minuto 40 segundos

[Pulsar **Reproducir este análisis** en la tarjeta 1. Señalar la pregunta, el resultado y los hallazgos. Después bajar a Parallel Coordinates.]

> “La primera pregunta es: ¿en qué atributos son similares o diferentes dos canciones que podrían convivir en una playlist?
>
> La configuración guardada compara *La Santa*, de Bad Bunny y Daddy Yankee, con *Night by Night*, de Chromeo. Parallel Coordinates es la técnica principal porque cada línea conserva el perfil completo de una canción a través de las seis dimensiones; las líneas entrecortadas son directamente las dos canciones y el resto de la muestra queda como contexto tenue.
>
> Los hallazgos son concretos: las mayores diferencias están en bailabilidad y energía, y coinciden casi por completo en habla e instrumentalidad. Su distancia normalizada es 0.075, más pequeña que la del 99 por ciento de las parejas posibles de la muestra: pueden convivir en una playlist según estas seis variables, aunque una tenga popularidad 84 y la otra 41, y las separen diez años.
>
> El orden de los ejes no es arbitrario: energía y acústica van adyacentes porque son las variables más correlacionadas del dataset, con r igual a menos 0.75. Ese dato viene de la matriz de correlación que está justo debajo.”

[Pasar el cursor sobre una línea y hacer clic en una canción. Señalar que el nombre y los seis valores aparecen en “Selección coordinada”.]

**No decir:** “la energía causa menor acústica”. Hablar de asociación o diferencia observada.

---

## 4. Demostración de Parallel Coordinates — 1 minuto

[Arrastrar el nombre de un eje para colocarlo junto a otro. Pulsar ⇅ sobre acústica para invertirla. Cambiar la escala a percentil. Aplicar un brushing corto sobre un eje y finalmente restablecer la vista.]

> “Implementé las tres operaciones que el enunciado pide para Parallel Coordinates. Primero, el reordenamiento: el orden de los ejes cambia qué relaciones son fáciles de percibir. Segundo, la inversión de un eje: al invertir acústica junto a energía, los cruces se convierten en líneas paralelas, porque la correlación es negativa. Tercero, el escalado: además de la escala normalizada 0–1, puedo ver cada valor como percentil dentro de la muestra, lo que separa atributos concentrados cerca de cero como habla o instrumentalidad.
>
> Y el brushing por eje: al seleccionar un intervalo, las mismas canciones se resaltan de manera coordinada en todas las vistas. La insignia cambia a *Exploración modificada* para distinguir la exploración libre del análisis guardado.”

[Pulsar **Restablecer vista** antes de continuar.]

---

## 5. Tarea 2: encontrar canciones similares — 2 minutos

[Pulsar **Reproducir este análisis** en la tarjeta 2. Verificar que se seleccione “La Santa”. Señalar MDS y la tabla de vecinas.]

> “La segunda pregunta es: para una canción seleccionada, ¿cuáles son las diez más similares y qué atributos explican esa semejanza?
>
> Parto de *La Santa* porque es la canción de mayor popularidad en la muestra. La similitud se calcula con distancia euclídea sobre los seis atributos normalizados, con el mismo peso inicial. Su vecina más cercana es *Night by Night*, de Chromeo, a distancia 0.075.
>
> Las diez vecinas coinciden con la canción sobre todo en instrumentalidad y habla, y se separan más en bailabilidad. Abarcan de 1980 a 2018 y son de diez artistas distintos: un mismo perfil de audio aparece en épocas y catálogos muy diferentes. Su popularidad mediana es 45 frente a 84: el parecido sonoro no implica parecido en popularidad.
>
> MDS proyecta a dos dimensiones las distancias calculadas en seis. Los ejes de MDS no son energía ni valencia: son coordenadas de la proyección. Y una comprobación importante: en el plano solo 4 de las 10 vecinas siguen entre las 10 más cercanas. Por eso la tabla es la evidencia y MDS es la vista para explorar, no para decidir.”

[Pasar el cursor sobre puntos cercanos a la selección en MDS. Hacer clic en uno y mostrar que la selección se actualiza en todas las vistas. Señalar el panel de Calidad MDS.]

> “Evalué la proyección en lugar de juzgarla por su apariencia: stress normalizado 0.263, correlación entre distancias 0.909 y preservación media de vecindad 31.6 por ciento. La correlación resume la estructura global; la vecindad pregunta cuántos vecinos inmediatos se conservan. La proyección mantiene bien la estructura global pero cambia una parte importante de los vecinos locales.”

---

## 6. Tarea 3: diseñar un perfil de playlist — 1 minuto 30 segundos

[Pulsar **Reproducir este análisis** en la tarjeta 3. Señalar pregunta, resultado y hallazgos. Mostrar Star Coordinates.]

> “La tercera pregunta es: ¿qué canciones cumplen mejor un objetivo energético, positivo y bailable, y qué atributos explican ese perfil?
>
> El brief inicial es: energía más valencia más bailabilidad, menos 0.5 veces acústica y menos 0.25 veces habla. La aplicación selecciona 60 candidatas reproducibles. Lo que más las separa del resto de la muestra es la valencia, mediana 0.88 frente a 0.48, y la acústica, 0.04 frente a 0.55. El 58 por ciento son posteriores a 1990 y su popularidad mediana es 41 frente a 34: el brief describe sobre todo música reciente. Y las de mayor puntaje mezclan pop latino, rap sureño y pop-rock: Fanny Lu, Juvenile y Maroon 5 convergen en el mismo perfil de audio.
>
> Star Coordinates es la técnica principal porque cada atributo es un vector y puedo cambiar su dirección y su peso. La escala es fija y coherente: una canción con valor 1 en un solo atributo cae exactamente en la punta de ese eje, y el anillo interior marca el alcance de un eje con peso 1. Al mover un eje cambio la importancia de una dimensión y observo qué candidatas siguen agrupadas; el marcador oscuro es su perfil mediano.”

[Arrastrar el extremo de un eje, por ejemplo acústica, hasta un peso mayor y luego restablecer.]

---

## 7. Tarea 4: evolución temporal y popularidad — 1 minuto 40 segundos

[Pulsar **Reproducir este análisis** en la tarjeta 4. Mostrar RadViz con la trayectoria y el gráfico de evolución.]

> “La cuarta pregunta es: ¿cómo cambia el perfil sonoro de las canciones populares a través de las décadas y en qué se separan del resto de su época?
>
> Aquí uso el dataset completo, agrupado por décadas completas: de 1921 a 1929 son los años veinte, y así hasta 2020. Las once décadas superan el mínimo de 20 canciones. En cada década defino el top 25 por ciento popular por ranking dentro de la propia década, no con un corte global que favorecería a las épocas recientes, porque la popularidad de Spotify crece con el año.
>
> RadViz es la técnica principal: cada marcador es el perfil mediano del top 25 por ciento de una década y la línea los une en orden cronológico. La trayectoria va del anclaje de acústica hacia energía, valencia y bailabilidad. En cifras: la acústica mediana de las populares pasa de 0.95 en los años veinte a 0.13 en 2020, y la energía de 0.19 a 0.66. El salto más brusco ocurre entre los sesenta y los setenta, de 0.63 a 0.32, coherente con la electrificación del pop y el rock. La bailabilidad alcanza su máximo en 2020 y la habla de 2020 duplica la de los sesenta, consistente con el peso del rap y del pop urbano.
>
> Los marcadores huecos son el perfil de toda la década: las populares siguen de cerca a su época; donde más se separan es en los sesenta. Y una advertencia honesta: en los años veinte, treinta y cuarenta la mayoría de canciones tiene popularidad cero en Spotify, así que allí el top 25 por ciento es apenas lo que aún conserva reproducciones; la tabla muestra el corte y el porcentaje de ceros de cada década.”

[Hacer clic en una década en el gráfico de evolución: RadViz, Parallel Coordinates y la tabla la enfocan. Volver a pulsar para liberar el enfoque.]

> “El gráfico de evolución detalla cada atributo con la escala original, y Parallel Coordinates superpone los once perfiles: la misma respuesta desde tres representaciones coordinadas.”

---

## 8. Cómo funcionan RadViz y Star Coordinates — 50 segundos

[Mostrar RadViz. Arrastrar un anclaje una distancia visible pero moderada y restablecer.]

> “En RadViz, cada atributo es un anclaje sobre la circunferencia y la posición de una canción es el promedio ponderado de esos anclajes usando sus valores normalizados. Si la suma de valores fuera cero, el código trata ese caso explícitamente. Los anclajes son arrastrables: no cambian los datos, cambian la disposición desde la que inspeccionamos el balance multidimensional.
>
> En Star Coordinates, la posición es la suma de los vectores escalados por los valores de la canción; al mover un extremo modifico dirección y peso. Ambas técnicas adaptan las fórmulas del notebook de clase.”

---

## 9. Procedencia del código y precisión técnica — 45 segundos

> “Todo lo visual es D3 versión 7: SVG, escalas, selecciones, brush, drag y transiciones. Cada técnica está en su propio módulo de JavaScript. Las fórmulas de RadViz y Star Coordinates se adaptaron del notebook de clase; Parallel Coordinates, los gráficos de apoyo y el MDS clásico, calculado en el preprocesamiento con NumPy, son desarrollos documentados en la trazabilidad.
>
> Verifiqué con pruebas la normalización, un caso controlado de distancias MDS, la agrupación por décadas completas, el top 25 por ciento por ranking, la escala de Star Coordinates, el orden de vecinas y la aplicación Flask.”

No afirmar que NumPy es una biblioteca de visualización. Flask sirve la aplicación, NumPy precalcula y D3 realiza las visualizaciones.

---

## 10. Cierre: respuestas, límites y aporte — 45 segundos

> “En síntesis: el primer análisis verifica la compatibilidad entre dos canciones con una distancia situada en la distribución de la muestra. El segundo encuentra vecinas en seis dimensiones y comprueba cuántas conserva la proyección. El tercero diseña y ajusta un perfil objetivo. El cuarto sigue la trayectoria del catálogo popular década a década, con el tamaño y la calidad de la señal de cada grupo a la vista.
>
> Las conclusiones se limitan a una muestra reproducible de 800 canciones, al dataset publicado hasta 2020, a una popularidad medida en 2020 y a una similitud basada en seis atributos con igual peso. El aporte central no es mostrar cuatro gráficos aislados, sino un recorrido en el que cada técnica responde una parte de la pregunta, las selecciones se coordinan y los hallazgos se expresan con cifras verificables. Gracias.”

---

# Preguntas probables y respuestas preparadas

## ¿Por qué utilizaste una muestra de 800 y no todos los registros?

> “El dataset original se conserva completo para limpieza, normalización y para la tarea temporal. La muestra limita el costo de las interacciones y de la matriz de distancias de MDS, que crece cuadráticamente. Con una semilla fija la selección es reproducible.”

## ¿Cómo definiste «popular» en cada década?

> “Por ranking dentro de la década: el 25 por ciento mejor clasificado. Un corte global favorecería a las décadas recientes porque la popularidad de Spotify crece con el año. En las tres primeras décadas la mayoría de canciones tiene popularidad cero, y la aplicación lo advierte explícitamente.”

## ¿Por qué usaste min–max y distancia euclídea?

> “Porque las técnicas combinan atributos y calculan distancias; llevarlos al intervalo cero–uno evita que una dimensión domine por su escala. La euclídea es transparente y explicable; todos los atributos reciben el mismo peso inicial, y es una decisión de diseño, no una verdad universal.”

## ¿MDS encontró clusters?

> “No. MDS produce una proyección que intenta conservar distancias. Las agrupaciones aparentes son patrones para inspeccionar, no etiquetas de un algoritmo de clustering.”

## ¿Por qué la correlación es alta y la vecindad solo 31.6 %?

> “Porque miden escalas distintas. La correlación considera la estructura global de las distancias; la vecindad exige conservar miembros concretos entre los diez más cercanos. Para La Santa solo se conservan 4 de 10.”

## ¿Qué significa invertir un eje o cambiar la escala en Parallel Coordinates?

> “Son operaciones de lectura, no de datos. Invertir un eje convierte cruces en paralelas cuando dos variables están negativamente correlacionadas; la escala por percentil sustituye cada valor por su rango en la muestra para separar atributos concentrados cerca de cero.”

## ¿Qué cambia al mover un anclaje de RadViz o un eje de Star Coordinates?

> “En RadViz cambia la disposición de los anclajes, no los datos. En Star Coordinates cambian la dirección y la magnitud del vector, es decir, cuánto y hacia dónde contribuye el atributo; los puntos y los vectores comparten la misma escala.”

## ¿Por qué no analizaste géneros?

> “El archivo requerido no incluye un campo de género por canción con una relación inequívoca. Usarlo habría exigido una unión adicional con supuestos que no podía defender con la misma precisión.”

## ¿Qué insight consideras más importante?

> “La trayectoria de las décadas: la acústica de las canciones populares cae de 0.95 a 0.13 mientras la energía sube de 0.19 a 0.66, con el salto más brusco entre los sesenta y los setenta. Lo presento como un patrón del catálogo, no como causalidad.”

## ¿Qué mejorarías con más tiempo?

> “Incorporaría los archivos de artistas y géneros del mismo dataset de Kaggle para conectar los perfiles con géneros, compararía métricas y pesos de similitud, y evaluaría la estabilidad de los hallazgos en varias muestras.”

---

# Lista final de ensayo

- Pronunciar con seguridad las cifras clave: **170,653**, **800**, **0.075**, **99 %**, **−0.75**, **4 de 10**, **0.263**, **0.909**, **31.6 %**, **0.95 → 0.13**, **0.19 → 0.66**, **0.63 → 0.32**.
- Poder definir en una frase RadViz, Star Coordinates, Parallel Coordinates y MDS.
- No llamar clusters a los grupos visibles en MDS.
- No afirmar causalidad.
- No decir que la muestra representa todo Spotify.
- Mostrar al menos una interacción de cada tipo: mouseover, clic, brushing, arrastre, inversión de eje y cambio de escala.
- Restablecer la vista después de una exploración para no mezclar configuraciones.
- Terminar con respuestas y límites, no con una descripción del código.
