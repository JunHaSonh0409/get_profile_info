// Gender capacity is stored in the existing `capacity` text column as
// "남 N명 / 여 N명" so no Supabase schema change is needed.

export interface EventCapacity {
  male: number | null;
  female: number | null;
}

function pick(capacity: string, label: string): number | null {
  const match = capacity.match(new RegExp(`${label}\\s*(\\d+)`));
  return match ? Number(match[1]) : null;
}

export function parseCapacity(capacity?: string): EventCapacity {
  const text = capacity || '';
  return { male: pick(text, '남'), female: pick(text, '여') };
}

export function formatCapacity({ male, female }: EventCapacity): string {
  const parts = [];
  if (male !== null) parts.push(`남 ${male}명`);
  if (female !== null) parts.push(`여 ${female}명`);
  return parts.join(' / ');
}

/** Human-readable capacity for the public event page. */
export function describeCapacity(capacity?: string): string {
  const { male, female } = parseCapacity(capacity);
  if (male === null && female === null) return '모집 인원 추후 안내';
  if (male === null || female === null) return formatCapacity({ male, female });
  return `남 ${male}명 · 여 ${female}명 (총 ${male + female}명)`;
}
