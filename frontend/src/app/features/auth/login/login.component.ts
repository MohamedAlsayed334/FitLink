import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError } from '../../../core/services/api.service';
import { User, UserRole } from '../../../core/models/user.model';
import { GoogleAuthService } from '../../../core/services/google-auth.service';

@Component({
  selector: 'fit-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  form: FormGroup;
  pending = false;
  showPassword = false;
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
    private route: ActivatedRoute,
    private google: GoogleAuthService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.googleEnabled = this.google.isEnabled();

    this.google.user$.pipe(takeUntil(this.destroy$)).subscribe((user: User) => {
      this.toast.success(`Welcome back, ${user.firstName}!`);
      this.redirect(user.role);
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

  submit(): void {
    this.errorMessage = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.pending = true;
    const { email, password } = this.form.value;

    this.auth.login(email, password).subscribe({
      next: (user) => {
        this.pending = false;
        this.toast.success(`Welcome back, ${user.firstName}!`);
        this.redirect(user.role);
      },
      error: (error: ApiError) => {
        this.pending = false;
        this.errorMessage = error.message || 'Login failed';
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

  private redirect(role: UserRole): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    } else {
      this.router.navigate([this.roleHome[role]]);
    }
  }
}