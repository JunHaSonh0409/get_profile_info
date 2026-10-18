'use client';

import { ANIMAL_OPTIONS } from '@/lib/types';

interface Props {
  preferredAnimals: string[];
  preferredAppearanceDetail: string;
  onChange: (fields: { preferredAnimals?: string[]; preferredAppearanceDetail?: string }) => void;
  onEnter?: () => void;
}

export default function StepAnimalType({
  preferredAnimals,
  preferredAppearanceDetail,
  onChange,
}: Props) {
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

      {/* 동물상 선택 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          선택 가능한 동물상 목록 (복수 선택 가능)
        </span>
        <span style={{ fontSize: '12px', color: '#ff85a1', fontWeight: 600 }}>
          {preferredAnimals.length > 0 ? `${preferredAnimals.length}개 선택됨` : '최소 1개 이상 선택'}
        </span>
      </div>

      {/* 동물상 그리드 */}
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

      {/* 외적인 구체적인 상 입력 필드 */}
      <div className="form-group" style={{ marginTop: '24px' }}>
        <label className="form-label" style={{ fontSize: '14px', color: '#ff85a1', fontWeight: 700, marginBottom: '6px' }}>
          원하시는 외적인 구체적인 상을 설명해주세요(정보가 많아야 찾기 쉬워요)
        </label>
        <textarea
          className="form-textarea"
          placeholder="예: 쌍꺼풀 없는 담백하고 훈훈한 눈매, 웃는 모습이 매력적인 인상, 단정하고 깔끔한 분위기 등"
          value={preferredAppearanceDetail}
          onChange={(e) => onChange({ preferredAppearanceDetail: e.target.value })}
          rows={3}
          style={{ minHeight: '90px', fontSize: '14px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '12px', color: 'var(--text-dim)' }}>
          <span>💡 원하시는 외모 스타일, 눈매, 체형 분위기 등을 편하게 적어주세요.</span>
          <span>{preferredAppearanceDetail?.length || 0}자</span>
        </div>
      </div>
    </div>
  );
}
