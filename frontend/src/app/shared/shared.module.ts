import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { StarRatingComponent } from './components/star-rating/star-rating.component';
import { StatusPillComponent } from './components/status-pill/status-pill.component';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle.component';
import { ToastComponent } from './components/toast/toast.component';

@NgModule({
  declarations: [
    EmptyStateComponent,
    LoadingSpinnerComponent,
    StarRatingComponent,
    StatusPillComponent,
    ToastComponent,
  ],
  imports: [CommonModule, ThemeToggleComponent],
  exports: [
    CommonModule,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    StarRatingComponent,
    StatusPillComponent,
    ThemeToggleComponent,
    ToastComponent,
  ],
})
export class SharedModule {}