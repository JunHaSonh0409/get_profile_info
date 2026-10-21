export interface OrbitEvent {
  id: string; // e.g. 'vol01', 'vol02'
  slug: string; // e.g. 'vol01', 'vol02'
  volNumber: string; // e.g. 'VOL.01'
  title: string;
  subtitle: string;
  status: 'upcoming' | 'ongoing' | 'ended';
  imageUrl?: string;
  dDayText?: string;
  badgeText?: string;
  description?: string;
  date?: string;
  location?: string;
  capacity?: string;
  content?: string;
  created_at?: string;
  updated_at?: string;
}
