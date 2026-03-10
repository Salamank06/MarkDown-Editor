import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MarkdownParserService {
  /**
   * Separar el parseo en un servicio permite mantener el componente "tonto":
   * - facilita pruebas unitarias del parser
   * - reduce acoplamiento con la UI
   * - permite reutilizar el parseo en otras pantallas (preview, export, etc.)
   */
  parse(rawText: string): string {
    const input = rawText ?? '';

    // 1) Extraer bloques de código primero para que no se interpreten como markdown inline
    const codeBlocks: string[] = [];
    const withPlaceholders = input.replace(/```([\s\S]*?)```/g, (_m, code: string) => {
      const escaped = this.escapeHtml(code).replace(/\r\n/g, '\n');
      const idx = codeBlocks.push(escaped) - 1;
      return `@@CODE_BLOCK_${idx}@@`;
    });

    // 2) Escapar HTML del resto para evitar inyección
    let html = this.escapeHtml(withPlaceholders).replace(/\r\n/g, '\n');

    // 3) Títulos (h1, h2, h3) por línea
    html = html
      .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
      .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
      .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

    // 4) Negrita y cursiva (orden importa: primero **, luego *)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(?!\*)([^*]+?)\*(?!\*)/g, '<em>$1</em>');

    // 5) Listas desordenadas (- elemento) por líneas consecutivas
    const lines = html.split('\n');
    const out: string[] = [];
    let inUl = false;
    let liBuffer: string[] = [];

    for (const line of lines) {
      const m = line.match(/^\-\s+(.+)$/);
      if (m) {
        if (!inUl) {
          inUl = true;
          liBuffer = [];
        }
        liBuffer.push(`<li>${m[1]}</li>`);
        continue;
      }

      if (inUl) {
        out.push(`<ul>${liBuffer.join('')}</ul>`);
        inUl = false;
        liBuffer = [];
      }
      out.push(line);
    }
    if (inUl) out.push(`<ul>${liBuffer.join('')}</ul>`);

    html = out.join('\n');

    // 6) Saltos de línea simples a <br> (fuera de bloques de código, ya protegidos por placeholder)
    html = html.replace(/\n/g, '<br>');

    // 6.1) Evitar <br> extra alrededor de bloques para reducir espacios
    // (Mantiene la regla de "saltos de línea -> <br>", pero limpia casos típicos
    // cuando hay etiquetas de bloque en líneas propias.)
    html = html
      .replace(/<br>\s*(<(?:h1|h2|h3|ul|pre)\b)/g, '$1')
      .replace(/(<\/(?:h1|h2|h3|ul|pre)>)\s*<br>/g, '$1');

    // 7) Reinsertar bloques de código como <pre><code>...</code></pre>
    html = html.replace(/@@CODE_BLOCK_(\d+)@@/g, (_m, n: string) => {
      const idx = Number(n);
      const code = codeBlocks[idx] ?? '';
      return `<pre><code>${code}</code></pre>`;
    });

    return html;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

