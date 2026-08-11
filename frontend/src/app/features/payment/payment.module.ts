import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { PaymentResultComponent } from './payment-result/payment-result.component';

const routes: Routes = [{ path: '', component: PaymentResultComponent }];

@NgModule({
  declarations: [PaymentResultComponent],
  imports: [CommonModule, RouterModule.forChild(routes), SharedModule],
})
export class PaymentModule {}
