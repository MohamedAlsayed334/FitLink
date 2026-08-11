import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type PaymentSubscriptionType = 'gym' | 'coach';

export interface PaymentInitiateResult {
  success: boolean;
  checkoutUrl: string;
  paymobOrderId: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private http: HttpClient) {}

  initiate(
    subscriptionId: string,
    subscriptionType: PaymentSubscriptionType,
  ): Observable<PaymentInitiateResult> {
    return this.http.post<PaymentInitiateResult>(`${environment.apiUrl}/payments/initiate`, {
      subscriptionId,
      subscriptionType,
    });
  }
}
