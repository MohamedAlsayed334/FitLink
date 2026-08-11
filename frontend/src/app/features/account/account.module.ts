import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { AccountOverviewComponent } from './account-overview/account-overview.component';

const routes: Routes = [{ path: '', component: AccountOverviewComponent }];

@NgModule({
  declarations: [AccountOverviewComponent],
  imports: [CommonModule, FormsModule, SharedModule, RouterModule.forChild(routes)],
  exports: [AccountOverviewComponent],
})
export class AccountModule {}