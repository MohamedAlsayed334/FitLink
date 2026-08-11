import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RatingService } from '../../../core/services/rating.service';
import { ToastService } from '../../../core/services/toast.service';
import { RatingCriteria } from '../../../core/models/rating.model';

interface CriterionRow { key: keyof RatingCriteria; label: string; }

@Component({
  selector: 'fit-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.css'],
})
export class RatingComponent implements OnInit {
  subscriptionId = '';
  criteria: RatingCriteria = { expertise: 0, communication: 0, professionalism: 0, punctuality: 0, valueForMoney: 0 };
  comment = '';
  submitted = false;
  processing = false;
  errorMessage = '';

  readonly rows: CriterionRow[] = [
    { key: 'expertise', label: 'Expertise' },
    { key: 'communication', label: 'Communication' },
    { key: 'professionalism', label: 'Professionalism' },
    { key: 'punctuality', label: 'Punctuality' },
    { key: 'valueForMoney', label: 'Value for money' },
  ];

  constructor(private route: ActivatedRoute, private ratingService: RatingService, private toast: ToastService) {}

  ngOnInit(): void {
    this.subscriptionId = this.route.snapshot.paramMap.get('subscriptionId') || '';
  }

  setScore(key: keyof RatingCriteria, score: number): void {
    this.criteria[key] = score;
  }

  get invalid(): boolean {
    return this.rows.some((r) => this.criteria[r.key] < 1);
  }

  submit(): void {
    if (this.invalid || this.processing) return;
    this.processing = true;
    this.ratingService.create({ subscriptionId: this.subscriptionId, criteria: { ...this.criteria }, comment: this.comment.trim() || undefined }).subscribe({
      next: () => { this.processing = false; this.submitted = true; this.toast.success('Rating submitted — pending moderation'); },
      error: (err: { message?: string }) => { this.processing = false; this.errorMessage = err.message || 'Could not submit rating'; },
    });
  }
}