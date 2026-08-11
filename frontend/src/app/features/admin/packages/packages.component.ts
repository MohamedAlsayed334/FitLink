import { Component, OnInit } from '@angular/core';
import { PackageService } from '../../../core/services/package.service';
import { ToastService } from '../../../core/services/toast.service';
import { Package } from '../../../core/models/package.model';

@Component({
  selector: 'fit-admin-packages',
  templateUrl: './packages.component.html',
  styleUrls: ['./packages.component.css'],
})
export class AdminPackagesComponent implements OnInit {
  packages: Package[] = [];
  loading = true;
  errorMessage = '';
  newPkg = { type: 'gym' as 'gym' | 'coach', name: '', durationMonths: 1 as 1 | 3, basePrice: 0, discountPercent: 0 };
  editingId: string | null = null;
  editModel = { name: '', basePrice: 0, discountPercent: 0 };
  saving = false;

  get activeCount(): number {
    return this.packages.filter((pkg) => pkg.isActive).length;
  }

  constructor(private packageService: PackageService, private toast: ToastService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.packageService.listAll().subscribe({
      next: (pkgs) => { this.packages = pkgs; this.loading = false; },
      error: (err: { message?: string }) => { this.errorMessage = err.message || 'Failed to load packages'; this.loading = false; },
    });
  }

  activate(pkg: Package): void {
    this.packageService.activate(pkg._id).subscribe({
      next: () => { this.toast.success('Package reactivated'); this.load(); },
      error: (err: { message?: string }) => { this.errorMessage = err.message || 'Activate failed'; },
    });
  }

  create(): void {
    if (!this.newPkg.name.trim() || this.newPkg.basePrice <= 0) return;
    this.saving = true;
    this.packageService.create({ ...this.newPkg, discountPercent: this.newPkg.discountPercent }).subscribe({
      next: () => { this.saving = false; this.toast.success('Package created'); this.newPkg = { type: 'gym', name: '', durationMonths: 1, basePrice: 0, discountPercent: 0 }; this.load(); },
      error: (err: { message?: string }) => { this.saving = false; this.errorMessage = err.message || 'Create failed'; },
    });
  }

  startEdit(pkg: Package): void {
    this.editingId = pkg._id;
    this.editModel = { name: pkg.name, basePrice: pkg.basePrice, discountPercent: pkg.discountPercent };
  }

  cancelEdit(): void { this.editingId = null; }

  saveEdit(pkg: Package): void {
    this.packageService.update(pkg._id, this.editModel).subscribe({
      next: () => { this.toast.success('Package updated'); this.editingId = null; this.load(); },
      error: (err: { message?: string }) => { this.errorMessage = err.message || 'Update failed'; },
    });
  }

  deactivate(pkg: Package): void {
    this.packageService.deactivate(pkg._id).subscribe({
      next: () => { this.toast.success('Package deactivated'); this.load(); },
      error: (err: { message?: string }) => { this.errorMessage = err.message || 'Deactivate failed'; },
    });
  }
}