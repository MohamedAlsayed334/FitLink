import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { EmployeeDashboardComponent } from './dashboard/dashboard.component';
import { WalkInComponent } from './walk-in/walk-in.component';
import { WalkInsComponent } from './walk-ins/walk-ins.component';
import { ExpirationsComponent } from './expirations/expirations.component';
import { TraineesComponent } from './trainees/trainees.component';
import { TraineeProfileComponent } from './trainee-profile/trainee-profile.component';

const routes: Routes = [
  { path: '', component: EmployeeDashboardComponent },
  { path: 'walk-in', component: WalkInComponent },
  { path: 'walk-ins', component: WalkInsComponent },
  { path: 'expirations', component: ExpirationsComponent },
  { path: 'trainees', component: TraineesComponent },
  { path: 'trainees/:id', component: TraineeProfileComponent },
];

@NgModule({
  declarations: [
    EmployeeDashboardComponent,
    WalkInComponent,
    WalkInsComponent,
    ExpirationsComponent,
    TraineesComponent,
    TraineeProfileComponent,
  ],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedModule, RouterModule.forChild(routes)],
})
export class EmployeeModule {}