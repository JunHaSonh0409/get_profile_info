'use client';

import { ANIMAL_OPTIONS } from '@/lib/types';

interface Props {
  preferredAnimals: string[];
  onChange: (fields: { preferredAnimals: string[] }) => void;
  onEnter?: () => void;
}

export default function StepAnimalType({ preferredAnimals, onChange, onEnter }: Props) {
  const toggleAnimal = (label: string) => {
    if (label === '상관없음') {
      if (preferredAnimals.includes('상관없음')) {
        onChange({ preferredAnimals: [] });
      } else {
        onChange({ preferredAnimals: ['상관없음'] });
      }
      return;
    }

    // If choosing a specific animal, remove '상관없음'
    let updated = preferredAnimals.filter((item) => item !== '상관없음');

    if (updated.includes(label)) {
      updated = updated.filter((item) => item !== label);
    } else {
      updated.push(label);
    }

    onChange({ preferredAnimals: updated });
  };

  return (
    <div className="animate-slide">
      <div className="card-badge">STEP 5 · 이성상 외모 취향</div>
      <h2 className="step-title">선호하는 이성의<br />분위기나 동물상을 선택해주세요.</h2>
      <p className="step-subtitle">여러 개를 중복 선택하실 수 있어요. (동물상에 구애받지 않으시면 &apos;상관없음&apos; 선택)</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          선택 가능한 동물상 목록 (복수 선택 가능)
        </span>
        <span style={{ fontSize: '12px', color: '#ff85a1', fontWeight: 600 }}>
          {preferredAnimals.length > 0 ? `${preferredAnimals.length}개 선택됨` : '최소 1개 이상 선택'}
        </span>
      </div>

      <div className="animal-grid">
        {ANIMAL_OPTIONS.map((item) => {
          const isSelected = preferredAnimals.includes(item.label);

          return (
            <div
              key={item.id}
              className={`animal-card ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleAnimal(item.label)}
            >
              {isSelected && <div className="animal-check-badge">✓</div>}
              <div className="animal-emoji">{item.emoji}</div>
              <div className="animal-label">{item.label}</div>
              <div className="animal-tagline">{item.tagline}</div>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: '12px', color: 'var(--text-dim)', textAlign: 'center' }}>
        💡 다음 단계에서 외모 외에 성격과 가치관에 대한 구체적인 이상형을 작성하게 됩니다.
      </p>
    </div>
  );
}
