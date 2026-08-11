import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, RegisterPayload } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError } from '../../../core/services/api.service';
import { User, UserRole } from '../../../core/models/user.model';
import { passwordMatchValidator } from '../../../shared/validators/password-match.validator';
import { GoogleAuthService } from '../../../core/services/google-auth.service';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

interface CoachCertification {
  name: string;
  issuer: string;
  year: number;
}

type RegisterPayloadWithCoach = RegisterPayload & {
  coachProfile?: {
    specialization: string[];
    experience: number;
    bio: string;
    certifications: CoachCertification[];
  };
};

@Component({
  selector: 'fit-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit, AfterViewInit, OnDestroy {
  form: FormGroup;
  pending = false;
  entered = false;
  errorMessage = '';
  googleEnabled = false;

  @ViewChild('googleBtn')
  private googleBtn!: ElementRef<HTMLElement>;

  private destroy$ = new Subject<void>();

  private readonly roleHome: Record<UserRole, string> = {
    coach: '/coach',
    trainee: '/trainee',
    admin: '/admin',
    employee: '/employee',
  };

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private toast: ToastService,
    private router: Router,
    private google: GoogleAuthService,
  ) {
    this.form = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.pattern(EMAIL_PATTERN)]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, passwordMatchValidator('password')]],
      role: ['trainee', [Validators.required]],
      specialization: [''],
      experience: [0, [Validators.min(0)]],
      bio: ['', [Validators.maxLength(1000)]],
      certifications: this.fb.array([]),
    });

    this.form.get('password')?.valueChanges.subscribe(() => {
      this.form.get('confirmPassword')?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    this.googleEnabled = this.google.isEnabled();

    this.google.user$.pipe(takeUntil(this.destroy$)).subscribe((user: User) => {
      this.toast.success(`Pass claimed. Welcome, ${user.firstName}!`);
      this.router.navigate([this.roleHome[user.role]]);
    });

    this.google.error$.pipe(takeUntil(this.destroy$)).subscribe((message: string) => {
      this.errorMessage = message;
    });
  }

  ngAfterViewInit(): void {
    this.renderGoogle();

    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.entered = true;
      }, 40);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setRole(role: 'trainee' | 'coach'): void {
    this.form.get('role')?.setValue(role);
  }

  get certifications(): FormArray {
    return this.form.get('certifications') as FormArray;
  }

  addCertification(): void {
    this.certifications.push(
      this.fb.group({ name: [''], issuer: [''], year: [new Date().getFullYear()] }),
    );
  }

  removeCertification(index: number): void {
    this.certifications.removeAt(index);
  }

  submit(): void {
    this.errorMessage = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.pending = true;
    const value = this.form.value;

    const payload: RegisterPayloadWithCoach = {
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      password: value.password,
      role: value.role,
      ...(value.phone ? { phone: value.phone } : {}),
    };

    if (value.role === 'coach') {
      const specialization = (value.specialization as string || '')
        .split(',')
        .map((item: string) => item.trim())
        .filter((item: string) => !!item);

      const certifications = (value.certifications as CoachCertification[])
        .map((cert) => ({
          name: (cert.name || '').trim(),
          issuer: (cert.issuer || '').trim(),
          year: Number(cert.year) || new Date().getFullYear(),
        }))
        .filter((cert) => cert.name || cert.issuer);

      payload.coachProfile = {
        specialization,
        experience: Math.max(0, Number(value.experience) || 0),
        bio: (value.bio || '').trim(),
        certifications,
      };
    }

    this.auth.register(payload as RegisterPayload).subscribe({
      next: (user: User) => {
        this.pending = false;
        this.toast.success(`Pass claimed. Welcome, ${user.firstName}!`);
        this.router.navigate([this.roleHome[user.role]]);
      },
      error: (error: ApiError) => {
        this.pending = false;
        this.errorMessage = error.message || 'Registration failed';
      },
    });
  }

  private renderGoogle(): void {
    if (!this.googleEnabled) {
      return;
    }
    this.google.load().then((ok) => {
      if (ok && this.googleBtn?.nativeElement) {
        this.google.renderButton(this.googleBtn.nativeElement);
      }
    });
  }
}