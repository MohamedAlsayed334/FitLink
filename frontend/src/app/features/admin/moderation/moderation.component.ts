import { Component, OnInit } from '@angular/core';
import { RatingService } from '../../../core/services/rating.service';
import { ToastService } from '../../../core/services/toast.service';
import { Rating } from '../../../core/models/rating.model';

@Component({
  selector: 'fit-admin-moderation',
  templateUrl: './moderation.component.html',
  styleUrls: ['./moderation.component.css'],
})
export class AdminModerationComponent implements OnInit {
  ratings: Rating[] = [];
  total = 0;
  loading = true;
  errorMessage = '';
  noteFor: string | null = null;
  rejectNote = '';

  constructor(private ratingService: RatingService, private toast: ToastService) {}

  traineeName(r: Rating): string {
    const trainee = r.traineeId as unknown as
      | { firstName?: string; lastName?: string }
      | string
      | null
      | undefined;
    if (typeof trainee === 'object' && trainee) {
      const name = `${trainee.firstName || ''} ${trainee.lastName || ''}`.trim();
      if (name) {
        return name;
      }
    }
    return 'Trainee';
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.ratingService.pending({ limit: 50, offset: 0 }).subscribe({
      next: (res) => { this.ratings = res.items; this.total = res.total; this.loading = false; },
      error: (err: { message?: string }) => { this.errorMessage = err.message || 'Failed to load reviews'; this.loading = false; },
    });
  }

  approve(r: Rating): void {
    this.ratingService.moderate(r._id, { moderationStatus: 'approved' }).subscribe({
      next: () => { this.toast.success('Review approved'); this.ratings = this.ratings.filter((x) => x._id !== r._id); this.total--; },
      error: (err: { message?: string }) => { this.errorMessage = err.message || 'Action failed'; },
    });
  }

  openReject(r: Rating): void { this.noteFor = r._id; this.rejectNote = ''; }

  confirmReject(r: Rating): void {
    this.ratingService.moderate(r._id, { moderationStatus: 'rejected', moderationNote: this.rejectNote.trim() || undefined }).subscribe({
      next: () => { this.toast.success('Review rejected'); this.noteFor = null; this.ratings = this.ratings.filter((x) => x._id !== r._id); this.total--; },
      error: (err: { message?: string }) => { this.errorMessage = err.message || 'Action failed'; },
    });
  }
}