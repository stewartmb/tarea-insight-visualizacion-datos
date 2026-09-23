# Matriz de evidencia para la rúbrica

| Criterio | Evidencia verificable | Revisión antes de entregar |
|---|---|---|
| Claridad | Portada con propósito, preguntas numeradas, títulos explicativos, leyenda por tarea, escalas con unidades, instrucciones de lectura en cada gráfico, tooltips y panel de selección. Técnica principal y de apoyo etiquetadas en cada tarea. | Probar en pantalla de presentación y revisar etiquetas sin zoom. |
| Analytical Insight | Panel «Hallazgos» con cifras calculadas a partir de los datos en las cuatro tareas (percentil de distancia, atributos coincidentes, décadas, cortes de popularidad, artistas y años); `informe_analitico.md`. | Recalcular con `scripts/prepare_data.py` después de cualquier cambio de datos. |
| Design Rationale | WHAT–WHY–HOW visible por tarea; sección «Por qué se ve así»; `justificacion_visual.md`; matriz de correlación que fundamenta el orden de ejes; `trazabilidad_materiales.md`. | Poder justificar variables, normalización, muestra, décadas y elección de técnica oralmente. |
| Technical Accuracy | RadViz, Star Coordinates (escala coherente), Parallel Coordinates (escalado, inversión, brushing, reordenamiento) y MDS clásico con métricas de calidad; código separado por módulo; pruebas Python y JavaScript. | Ejecutar pruebas y demostración coordinada desde una copia limpia. |
| Tasks Coverage | Cuatro botones restauran configuraciones y cada pregunta tiene resultado, hallazgos, evidencia tabular, visualizaciones y límite. | Reproducir comparación, similitud, diseño de perfil y evolución temporal. |
| Interacción | Mouseover (tooltips), clic (selección y enfoque de década), brushing, arrastre de anclajes, vectores y ejes, transiciones animadas. | Mostrar al menos una interacción de cada tipo. |

## Requisitos adicionales del enunciado

- D3 es la única biblioteca de visualización (NumPy solo precalcula MDS y agregados).
- Flask sirve la aplicación.
- Mouseover, click, brushing y drag son demostrables.
- El ZIP se genera con `scripts/package_delivery.py` e incluye aplicación, datos, documentación y pruebas.
- La presentación presencial es obligatoria.
- «Nodes and edges» está pendiente de aclaración; no se declara cumplido sin respuesta del profesor.
