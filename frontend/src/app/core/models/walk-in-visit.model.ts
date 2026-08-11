export interface WalkInVisit {
  _id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  handledBy?: {
    _id: string;
    firstName?: string;
    lastName?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
