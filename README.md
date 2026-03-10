# MarkDown Editor Pro - Angular Standalone

Este proyecto es un editor de Markdown de alto rendimiento que permite la edición bidireccional: tanto desde el código fuente como directamente desde la vista previa renderizada. Está construido con Angular 17+ siguiendo principios de arquitectura limpia y seguridad web.

## Características Principales

- Edición Bidireccional: Implementación de contenteditable en la vista previa que sincroniza y reconstruye el Markdown original automáticamente.
- Motor de Procesamiento Nativo: Parser basado en expresiones regulares (Regex) para la transformación de títulos, listas, estilos inline y bloques de código.
- Seguridad Avanzada: Sistema de sanitización de doble capa mediante DomSanitizer para prevenir ataques de Cross-Site Scripting (XSS).
- Diseño de Alta Productividad: Interfaz split-screen con modo oscuro, optimizada para la legibilidad de código y previsualización de documentos.

## Arquitectura del Proyecto

- Models: Contratos de datos para el manejo de resultados y estadísticas de texto (conteo de palabras y caracteres).
- Services: Procesamiento de texto desacoplado de la interfaz de usuario para facilitar pruebas unitarias y escalabilidad.
- Components: Uso de componentes Standalone para minimizar el peso del bundle y mejorar la modularidad.

## Aspectos Técnicos Destacados

1. Manejo de Nodos del DOM: Implementación de un serializador personalizado que recorre el árbol de nodos de la vista previa para generar Markdown válido.
2. Limpieza de Ruido HTML: Algoritmos de normalización para eliminar saltos de línea innecesarios (<br>) alrededor de etiquetas de bloque (h1-h3, ul, pre).
3. Optimización de Performance: Actualización reactiva de estadísticas sin necesidad de re-renderizar el árbol de componentes completo.

## Ejecución Local

1. npm install
2. ng serve --port 4300
3. Navegar a http://localhost:4300/
