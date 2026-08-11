import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { CoachDashboardComponent } from './dashboard/dashboard.component';
import { CoachTraineesComponent } from './trainees/trainees.component';
import { CoachProfileComponent } from './profile/profile.component';

const routes: Routes = [
  { path: '', component: CoachDashboardComponent },
  { path: 'trainees', component: CoachTraineesComponent },
  { path: 'profile', component: CoachProfileComponent },
];

@NgModule({
  declarations: [CoachDashboardComponent, CoachTraineesComponent, CoachProfileComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedModule, RouterModule.forChild(routes)],
})
export class CoachModule {}