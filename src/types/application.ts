export interface EventApplication {
  id: string;
  eventSlug: string; // e.g. 'vol01', 'vol02'
  volNumber: string; // e.g. 'VOL.01'
  name: string;
  phone: string;
  gender: string;
  age: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  memo?: string;
  created_at: string;
}

export interface EventApplicationStats {
  total: number;
  male: number;
  female: number;
  confirmed: number;
  pending: number;
  cancelled: number;
}
