import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserService } from '../../../core/services/user.service';

interface ProfileForm {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

type ProfilePayload = Partial<Pick<User, 'firstName' | 'lastName' | 'phone'>>;

@Component({
  selector: 'fit-account-overview',
  templateUrl: './account-overview.component.html',
  styleUrls: ['./account-overview.component.css'],
})
export class AccountOverviewComponent implements OnInit {
  user: User | null = null;
  user$: Observable<User | null> = this.auth.currentUser$;
  loading = true;
  saving = false;
  saved = false;
  errorMessage = '';
  form: ProfileForm = { firstName: '', lastName: '', phone: '', email: '' };

  constructor(
    private auth: AuthService,
    private userService: UserService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    const current = this.auth.currentUser;
    if (current) {
      this.user = current;
      this.populate(current);
      this.loading = false;
      return;
    }
    this.userService.getProfile().subscribe({
      next: (profile) => {
        this.user = profile;
        this.populate(profile);
        this.loading = false;
      },
      error: (err: { message?: string }) => {
        this.errorMessage = err.message || 'Failed to load profile';
        this.loading = false;
      },
    });
  }

  private populate(u: User): void {
    this.form = {
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      phone: u.phone || '',
      email: u.email || '',
    };
  }

  get canSave(): boolean {
    return !!(this.form.firstName.trim() && this.form.lastName.trim());
  }

  save(): void {
    if (!this.canSave || this.saving) return;
    this.saving = true;
    this.errorMessage = '';
    this.saved = false;

    const payload: ProfilePayload = {
      firstName: this.form.firstName.trim(),
      lastName: this.form.lastName.trim(),
    };
    if (this.form.phone.trim()) payload.phone = this.form.phone.trim();

    this.userService.update(payload).subscribe({
      next: (updated) => {
        this.saving = false;
        this.user = updated;
        this.auth.updateCurrentUser(updated);
        this.populate(updated);
        this.saved = true;
        this.toast.success('Profile updated');
      },
      error: (err: { message?: string }) => {
        this.saving = false;
        this.errorMessage = err.message || 'Failed to update profile';
      },
    });
  }

  dashboardLink(): string {    switch (this.user?.role) {
      case 'coach':
        return '/coach';
      case 'employee':
        return '/employee';
      case 'admin':
        return '/admin';
      default:
        return '/trainee';
    }
  }

  initialsOf(user: { firstName: string; lastName: string }): string {
    return `${(user.firstName || '?').charAt(0)}${(user.lastName || '?').charAt(0)}`.toUpperCase();
  }
}