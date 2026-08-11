import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Package } from '../models/package.model';

export interface CreatePackagePayload {
  type: 'gym' | 'coach';
  name: string;
  durationMonths: 1 | 3;
  basePrice: number;
  discountPercent?: number;
}

@Injectable({ providedIn: 'root' })
export class PackageService {
  constructor(private api: ApiService) {}

  list(): Observable<Package[]> {
    return this.api.get<Package[]>('/packages');
  }

  listAll(): Observable<Package[]> {
    return this.api.get<Package[]>('/packages/admin/all');
  }

  activate(id: string): Observable<Package> {
    return this.api.patch<Package>(`/packages/${id}/activate`);
  }

  create(payload: CreatePackagePayload): Observable<Package> {
    return this.api.post<Package>('/packages', payload);
  }

  update(
    id: string,
    payload: Partial<Pick<Package, 'name' | 'basePrice' | 'discountPercent'>>,
  ): Observable<Package> {
    return this.api.put<Package>(`/packages/${id}`, payload);
  }

  deactivate(id: string): Observable<Package> {
    return this.api.patch<Package>(`/packages/${id}/deactivate`);
  }
}
