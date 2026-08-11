import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { TraineeDashboardComponent } from './dashboard/dashboard.component';
import { GymSubscriptionComponent } from './gym-subscription/gym-subscription.component';
import { CoachSubscriptionComponent } from './coach-subscription/coach-subscription.component';
import { RatingComponent } from './rating/rating.component';

const routes: Routes = [
  { path: '', component: TraineeDashboardComponent },
  { path: 'gym', component: GymSubscriptionComponent },
  { path: 'coach', component: CoachSubscriptionComponent },
  { path: 'rate/:subscriptionId', component: RatingComponent },
];

@NgModule({
  declarations: [TraineeDashboardComponent, GymSubscriptionComponent, CoachSubscriptionComponent, RatingComponent],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedModule, RouterModule.forChild(routes)],
})
export class TraineeModule {}