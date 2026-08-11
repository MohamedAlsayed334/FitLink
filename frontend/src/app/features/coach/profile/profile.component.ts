import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CoachService } from '../../../core/services/coach.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError } from '../../../core/services/api.service';
import { CoachProfile } from '../../../core/models/user.model';

interface CertificationRow {
  name: string;
  issuer: string;
  year: number;
}

@Component({
  selector: 'fit-coach-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class CoachProfileComponent implements OnInit {
  form!: FormGroup;
  saving = false;
  verified = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private coach: CoachService,
    private toast: ToastService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadProfile();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      bio: [''],
      experience: [0, [Validators.min(0)]],
      isAcceptingClients: [false],
      specialization: this.fb.array([]),
      certifications: this.fb.array([]),
    });
  }

  get specializations(): FormArray {
    return this.form.get('specialization') as FormArray;
  }

  get certifications(): FormArray {
    return this.form.get('certifications') as FormArray;
  }

  private loadProfile(): void {
    const user = this.auth.currentUser;
    const profile = user?.coachProfile;
    if (profile) {
      this.verified = !!profile.isVerified;
      this.patch(profile);
      return;
    }
    if (!user) return;
    this.coach.get(user._id).subscribe({
      next: (fetched) => {
        const fetchedProfile = fetched.coachProfile;
        this.verified = !!fetchedProfile?.isVerified;
        if (fetchedProfile) this.patch(fetchedProfile);
      },
      error: () => this.toast.error('Could not load your coach profile'),
    });
  }

  private patch(profile: CoachProfile): void {
    this.form.patchValue({
      bio: profile.bio ?? '',
      experience: profile.experience ?? 0,
      isAcceptingClients: !!profile.isAcceptingClients,
    });
    this.setSpecializations(profile.specialization || []);
    this.setCertifications(profile.certifications || []);
  }

  private setSpecializations(items: string[]): void {
    this.specializations.clear();
    items.forEach((item) => this.specializations.push(this.fb.control(item)));
  }

  private setCertifications(items: CertificationRow[]): void {
    this.certifications.clear();
    items.forEach((cert) => {
      this.certifications.push(
        this.fb.group({
          name: [cert.name ?? ''],
          issuer: [cert.issuer ?? ''],
          year: [cert.year ?? new Date().getFullYear()],
        }),
      );
    });
  }

  addSpecialization(input: HTMLInputElement): void {
    const value = input.value.trim();
    if (!value) return;
    this.specializations.push(this.fb.control(value));
    input.value = '';
    input.focus();
  }

  removeSpecialization(index: number): void {
    this.specializations.removeAt(index);
  }

  addCertification(): void {
    this.certifications.push(
      this.fb.group({ name: [''], issuer: [''], year: [new Date().getFullYear()] }),
    );
  }

  removeCertification(index: number): void {
    this.certifications.removeAt(index);
  }

  reset(): void {
    const user = this.auth.currentUser;
    if (user?.coachProfile) {
      this.patch(user.coachProfile);
    } else {
      this.form.reset({ bio: '', experience: 0, isAcceptingClients: false });
      this.specializations.clear();
      this.certifications.clear();
    }
  }

  back(): void {
    this.router.navigate(['/coach']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  save(): void {
    if (this.saving) return;
    this.saving = true;

    const raw = this.form.getRawValue();
    const payload: Partial<CoachProfile> & { isAcceptingClients?: boolean } = {
      bio: raw.bio,
      experience: raw.experience,
      specialization: (raw.specialization as string[])
        .map((s) => s.trim())
        .filter((s) => !!s),
      certifications: (raw.certifications as CertificationRow[])
        .map((c) => ({
          name: c.name.trim(),
          issuer: c.issuer.trim(),
          year: c.year,
        }))
        .filter((c) => c.name || c.issuer),
      isAcceptingClients: raw.isAcceptingClients,
    };

    this.coach.updateProfile(payload).subscribe({
      next: (updatedUser) => {
        this.saving = false;
        this.auth.updateCurrentUser(updatedUser);
        this.toast.success('Profile saved');
      },
      error: (err: ApiError) => {
        this.saving = false;
        this.toast.error(err?.message || 'Could not save profile');
      },
    });
  }
}