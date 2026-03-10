export interface MarkdownResult {
  /** HTML generado (antes o después de sanitizar, según la capa que lo produzca). */
  html: string;
  /** Conteo básico de palabras del texto de entrada. */
  wordCount: number;
  /** Conteo básico de caracteres del texto de entrada. */
  charCount: number;
}

