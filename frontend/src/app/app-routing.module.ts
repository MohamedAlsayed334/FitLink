import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppLayoutComponent } from './core/layout/app-layout.component';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { HomeComponent } from './features/home/home.component';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./features/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'register',
    loadChildren: () => import('./features/auth/register/register.module').then((m) => m.RegisterModule),
  },
  {
    path: 'payment-result',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/payment/payment.module').then((m) => m.PaymentModule),
  },
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      {
        path: 'coaches',
        loadChildren: () => import('./features/coaches/coaches.module').then((m) => m.CoachesModule),
      },
      {
        path: 'chat',
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['trainee', 'coach'] },
        loadChildren: () => import('./features/chat/chat.module').then((m) => m.ChatModule),
      },
      {
        path: 'account',
        canActivate: [AuthGuard],
        loadChildren: () => import('./features/account/account.module').then((m) => m.AccountModule),
      },
      {
        path: 'trainee',
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['trainee'] },
        loadChildren: () => import('./features/trainee/trainee.module').then((m) => m.TraineeModule),
      },
      {
        path: 'coach',
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['coach'] },
        loadChildren: () => import('./features/coach/coach.module').then((m) => m.CoachModule),
      },
      {
        path: 'employee',
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['employee'] },
        loadChildren: () => import('./features/employee/employee.module').then((m) => m.EmployeeModule),
      },
      {
        path: 'admin',
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/admin/admin.module').then((m) => m.AdminModule),
      },
      { path: '**', redirectTo: '' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}