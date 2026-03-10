import { Component } from '@angular/core';
import { EditorComponent } from './components/editor/editor.component';

@Component({
  selector: 'app-root',
  imports: [EditorComponent],
  template: `<app-editor />`,
  styleUrl: './app.css',
})
export class App {
}
