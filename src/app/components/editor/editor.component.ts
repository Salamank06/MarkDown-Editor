import { CommonModule } from '@angular/common';
import { Component, SecurityContext } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MarkdownResult } from '../../models/markdown.model';
import { MarkdownParserService } from '../../services/markdown-parser.service';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css',
})
export class EditorComponent {
  rawText = `# MarkDown Editor

## Demo rápida

- Lista 1
- Lista 2

Escribe **negrita**, *cursiva* y bloques de código:

\`\`\`
const msg = "Hola mundo";
console.log(msg);
\`\`\`
`;

  renderedHtml: SafeHtml = '';
  result: MarkdownResult = { html: '', wordCount: 0, charCount: 0 };
  private isEditingPreview = false;

  constructor(
    private readonly parser: MarkdownParserService,
    private readonly sanitizer: DomSanitizer,
  ) {
    this.onTextChange();
  }

  /**
   * La UI solo orquesta: delega transformación al servicio (SoC),
   * y se encarga de sanitizar + exponer el estado para la plantilla.
   */
  onTextChange(): void {
    const parsed = this.parser.parse(this.rawText);
    const cleanHtml = this.sanitizer.sanitize(SecurityContext.HTML, parsed) ?? '';
    if (!this.isEditingPreview) {
      this.renderedHtml = this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
    }

    this.result = {
      html: cleanHtml,
      wordCount: this.countWords(this.rawText),
      charCount: (this.rawText ?? '').length,
    };
  }

  onPreviewInput(ev: Event): void {
    this.isEditingPreview = true;
    const el = ev.target as HTMLElement | null;
    if (!el) return;
    const md = this.domToMarkdown(el);
    this.rawText = this.normalizeMarkdown(md);

    // Actualiza estadísticas en caliente (sin re-render para no romper el cursor del contenteditable).
    this.result = {
      ...this.result,
      wordCount: this.countWords(this.rawText),
      charCount: (this.rawText ?? '').length,
    };
  }

  onPreviewBlur(): void {
    this.isEditingPreview = false;
    this.onTextChange();
  }

  private countWords(value: string): number {
    const trimmed = (value ?? '').trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).filter(Boolean).length;
  }

  private domToMarkdown(root: HTMLElement): string {
    const chunks: string[] = [];
    for (const node of Array.from(root.childNodes)) {
      const part = this.serializeNode(node).trimEnd();
      if (part) chunks.push(part);
    }
    return chunks.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }

  private serializeNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent ?? '').replace(/\u00A0/g, ' ');
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    const inline = () => this.serializeInlineChildren(el);
    const text = () => (el.textContent ?? '').replace(/\u00A0/g, ' ').trim();

    switch (tag) {
      case 'h1':
        return `# ${text()}\n`;
      case 'h2':
        return `## ${text()}\n`;
      case 'h3':
        return `### ${text()}\n`;
      case 'strong':
        return `**${inline()}**`;
      case 'em':
        return `*${inline()}*`;
      case 'br':
        return `\n`;
      case 'ul': {
        const items = Array.from(el.querySelectorAll(':scope > li')).map((li) => `- ${this.serializeInlineChildren(li).trim()}`);
        return items.join('\n') + '\n';
      }
      case 'li':
        return `- ${inline()}\n`;
      case 'pre': {
        const codeEl = el.querySelector(':scope > code');
        const code = (codeEl?.textContent ?? el.textContent ?? '').replace(/\r\n/g, '\n').replace(/\n+$/g, '');
        return `\n\`\`\`\n${code}\n\`\`\`\n`;
      }
      case 'code':
        return inline();
      case 'div':
      case 'p':
      default: {
        // Tratamos contenedores como "líneas" separadas, conservando <br> como saltos.
        return this.serializeChildren(el);
      }
    }
  }

  private serializeChildren(el: Element): string {
    let out = '';
    for (const child of Array.from(el.childNodes)) {
      out += this.serializeNode(child);
    }
    return out;
  }

  private serializeInlineChildren(el: Element): string {
    let out = '';
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) out += (child.textContent ?? '').replace(/\u00A0/g, ' ');
      else if (child.nodeType === Node.ELEMENT_NODE) out += this.serializeNode(child);
    }
    return out;
  }

  private normalizeMarkdown(md: string): string {
    // Correcciones suaves para que "se corrija solito" sin sorprender:
    // - normaliza saltos de línea
    // - elimina espacios al final de línea
    // - normaliza listas con "- "
    return (md ?? '')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((l) => l.replace(/\s+$/g, '').replace(/^\*\s+/, '- '))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n';
  }
}

