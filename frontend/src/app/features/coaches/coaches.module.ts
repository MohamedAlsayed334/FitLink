import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { CoachListComponent } from './coach-list/coach-list.component';
import { CoachDetailComponent } from './coach-detail/coach-detail.component';

const routes: Routes = [
  { path: '', component: CoachListComponent },
  { path: ':id', component: CoachDetailComponent },
];

@NgModule({
  declarations: [CoachListComponent, CoachDetailComponent],
  imports: [CommonModule, FormsModule, SharedModule, RouterModule.forChild(routes)],
})
export class CoachesModule {}