import { Component } from '@angular/core';

@Component({
  selector: 'fit-root',
  template: `
    <main class="stage0-shell">
      <h1>FitLink</h1>
      <p>Stage 0 — Angular 16 shell ready. Feature work starts in Stage 1.</p>
      <router-outlet></router-outlet>
    </main>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {}