'use client';
import { FAMILY_MEMBERS } from '@/lib/supabase';

interface Props {
  selected: string;
  onChange: (user: string) => void;
  counts: Record<string, number>;
}

export default function UserFilter({ selected, onChange, counts }: Props) {
  const all = ['All', ...FAMILY_MEMBERS];
  return (
    <div className="user-filter">
      {all.map((u) => (
        <button
          key={u}
          className={`user-tab${selected === u ? ' active' : ''}`}
          onClick={() => onChange(u)}
        >
          {u === 'All' ? `All (${counts['All'] ?? 0})` : u.split(' ')[0] + ` (${counts[u] ?? 0})`}
        </button>
      ))}
    </div>
  );
}
