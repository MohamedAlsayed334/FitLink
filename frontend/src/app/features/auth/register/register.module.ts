import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { RegisterComponent } from './register.component';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';

const routes: Routes = [{ path: '', component: RegisterComponent }];

@NgModule({
  declarations: [RegisterComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule.forChild(routes), ThemeToggleComponent],
})
export class RegisterModule {}
