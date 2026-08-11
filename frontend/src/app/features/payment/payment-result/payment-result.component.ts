import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

type PaymentResultState = 'success' | 'failure' | 'processing';

@Component({
  selector: 'fit-payment-result',
  templateUrl: './payment-result.component.html',
  styleUrls: ['./payment-result.component.css'],
})
export class PaymentResultComponent implements OnInit {
  state: PaymentResultState = 'processing';
  transactionId = '';
  orderId = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    const success = q.get('success');

    this.transactionId = q.get('txn_id') || q.get('id') || '';
    this.orderId = q.get('order') || q.get('order_id') || '';

    if (success === 'true') {
      this.state = 'success';
    } else if (success === 'false') {
      this.state = 'failure';
    } else {
      this.state = 'processing';
    }
  }

  get title(): string {
    switch (this.state) {
      case 'success':
        return 'PAYMENT COMPLETE';
      case 'failure':
        return 'PAYMENT NOT COMPLETED';
      default:
        return 'PAYMENT PENDING';
    }
  }

  get message(): string {
    switch (this.state) {
      case 'success':
        return 'Your payment went through. Your subscription is now active — head back to your dashboard to see your updated membership.';
      case 'failure':
        return 'We couldn\'t confirm your payment. Nothing has been charged, and your subscription stays pending. You can try again from your dashboard.';
      default:
        return 'We\'re still confirming your payment with the provider. This can take a moment — check your dashboard shortly, or try again if nothing changes.';
    }
  }
}
