import { Component } from '@angular/core';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'fit-root',
  template: `
    <router-outlet></router-outlet>
    <fit-toast></fit-toast>
  `,
})
export class AppComponent {
  constructor(_theme: ThemeService) {}
}