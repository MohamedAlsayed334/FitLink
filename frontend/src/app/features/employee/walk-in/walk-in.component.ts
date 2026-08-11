import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GymSubscriptionService, WalkInPayload } from '../../../core/services/gym-subscription.service';
import { PackageService } from '../../../core/services/package.service';
import { ToastService } from '../../../core/services/toast.service';
import { Package } from '../../../core/models/package.model';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

type WalkInFormPayload = WalkInPayload & { notes?: string };

@Component({
  selector: 'fit-walk-in',
  templateUrl: './walk-in.component.html',
  styleUrls: ['./walk-in.component.css'],
})
export class WalkInComponent implements OnInit {
  mode: 'quick' | 'full' = 'quick';
  form: FormGroup;
  packages: Package[] = [];
  submitting = false;
  errorMessage = '';
  successBanner = '';

  constructor(
    private fb: FormBuilder,
    private gymSubService: GymSubscriptionService,
    private packageService: PackageService,
    private toast: ToastService,
  ) {
    this.form = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      phone: [''],
      notes: [''],
      email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      packageId: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.applyModeValidators();
    this.packageService.list().subscribe({
      next: (pkgs) => { this.packages = pkgs.filter((p) => p.type === 'gym'); },
      error: (err: { message?: string }) => { this.errorMessage = err.message || 'Failed to load packages'; },
    });
  }

  private applyModeValidators(): void {
    const email = this.form.get('email');
    const password = this.form.get('password');
    const packageId = this.form.get('packageId');

    if (this.mode === 'full') {
      email?.setValidators([Validators.required, Validators.pattern(EMAIL_PATTERN)]);
      password?.setValidators([Validators.required, Validators.minLength(6)]);
      packageId?.setValidators([Validators.required]);
    } else {
      email?.clearValidators();
      password?.clearValidators();
      packageId?.clearValidators();
    }

    email?.updateValueAndValidity();
    password?.updateValueAndValidity();
    packageId?.updateValueAndValidity();
  }

  get gymPackages(): Package[] {
    return this.packages;
  }

  setMode(mode: 'quick' | 'full'): void {
    this.mode = mode;
    this.errorMessage = '';
    this.successBanner = '';
    this.applyModeValidators();
  }

  submit(): void {
    this.errorMessage = '';
    this.successBanner = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const value = this.form.value;
    const payload: WalkInFormPayload = {
      mode: this.mode,
      firstName: value.firstName,
      lastName: value.lastName,
      phone: value.phone || undefined,
      packageId: this.mode === 'full' ? value.packageId : '',
    };
    if (this.mode === 'full') {
      payload.email = value.email;
      payload.password = value.password;
    } else {
      payload.notes = value.notes;
    }

    this.gymSubService.walkIn(payload).subscribe({
      next: (res) => {
        this.submitting = false;
        if (this.mode === 'quick') {
          const visit = (res as unknown as { visit: { firstName: string; lastName: string } }).visit;
          this.successBanner = `Walk-in recorded for ${visit.firstName} ${visit.lastName}`;
          this.toast.success('Walk-in recorded');
        } else {
          const user = (res as unknown as { user: { email: string } }).user;
          this.successBanner = `Account created — trainee can log in with ${user.email}`;
          this.toast.success('Full account created');
        }
        this.form.reset();
      },
      error: (err: { message?: string }) => {
        this.submitting = false;
        this.errorMessage = err.message || 'Walk-in registration failed';
      },
    });
  }
}
