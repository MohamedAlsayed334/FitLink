export interface Package {
  _id: string;
  id: string;
  type: 'gym' | 'coach';
  name: string;
  durationMonths: 1 | 3;
  basePrice: number;
  discountPercent: number;
  isActive: boolean;
  finalPrice: number;
  createdAt: string;
  updatedAt: string;
}