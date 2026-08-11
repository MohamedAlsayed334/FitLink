import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { AdminDashboardComponent } from './dashboard/dashboard.component';
import { AdminPackagesComponent } from './packages/packages.component';
import { AdminVerificationComponent } from './verification/verification.component';
import { AdminModerationComponent } from './moderation/moderation.component';
import { AdminCancellationsComponent } from './cancellations/cancellations.component';
import { AdminUsersComponent } from './users/users.component';

const routes: Routes = [
  { path: '', component: AdminDashboardComponent },
  { path: 'packages', component: AdminPackagesComponent },
  { path: 'verification', component: AdminVerificationComponent },
  { path: 'moderation', component: AdminModerationComponent },
  { path: 'cancellations', component: AdminCancellationsComponent },
  { path: 'users', component: AdminUsersComponent },
];

@NgModule({
  declarations: [
    AdminDashboardComponent,
    AdminPackagesComponent,
    AdminVerificationComponent,
    AdminModerationComponent,
    AdminCancellationsComponent,
    AdminUsersComponent,
  ],
  imports: [CommonModule, FormsModule, SharedModule, RouterModule.forChild(routes)],
})
export class AdminModule {}