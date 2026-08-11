import { Component, OnInit } from '@angular/core';
import { CoachService } from '../../../core/services/coach.service';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'fit-admin-verification',
  templateUrl: './verification.component.html',
  styleUrls: ['./verification.component.css'],
})
export class AdminVerificationComponent implements OnInit {
  coaches: User[] = [];
  unverifiedCount = 0;
  loading = true;
  errorMessage = '';

  constructor(private coachService: CoachService, private admin: AdminService, private toast: ToastService) {}

  ngOnInit(): void {
    this.admin.unverifiedCoaches().subscribe({
      next: (coaches) => {
        this.coaches = (coaches || []).filter((c) => !c.coachProfile?.isVerified);
        this.admin.summary().subscribe({
          next: (s) => { this.unverifiedCount = s.unverifiedCoaches; this.loading = false; },
          error: () => { this.loading = false; },
        });
      },
      error: (err: { message?: string }) => { this.errorMessage = err.message || 'Failed to load coaches'; this.loading = false; },
    });
  }

  verifyCoach(id: string): void {
    this.coachService.verify(id).subscribe({
      next: () => {
        this.coaches = this.coaches.filter((c) => c._id !== id);
        this.unverifiedCount = Math.max(0, this.unverifiedCount - 1);
        this.toast.success('Coach verified');
      },
      error: (err: { message?: string }) => { this.toast.error(err.message || 'Verification failed'); },
    });
  }

  truncate(value: string, max = 120): string {
    const text = (value || '').trim();
    if (text.length <= max) return text;
    return text.slice(0, max).trimEnd() + '…';
  }
}