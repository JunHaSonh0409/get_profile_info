'use client';

interface Props {
  gender: '남성' | '여성' | '';
  age: number | '';
  onChange: (fields: { gender?: '남성' | '여성'; age?: number | '' }) => void;
  onEnter?: () => void;
}

export default function StepGenderAge({ gender, age, onChange, onEnter }: Props) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && gender && age && onEnter) {
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <div className="animate-slide">
      <div className="card-badge">STEP 2 · 성별 및 나이</div>
      <h2 className="step-title">성별과 나이를<br />선택해주세요.</h2>
      <p className="step-subtitle">어울리는 최적의 매칭 연령대를 추천해드리기 위해 필요해요.</p>

      {/* 성별 남/여 버튼 */}
      <div className="form-group">
        <label className="form-label">
          성별 <span className="required-dot">*</span>
        </label>
        <div className="gender-selector">
          <button
            type="button"
            className={`gender-button ${gender === '남성' ? 'active' : ''}`}
            onClick={() => onChange({ gender: '남성' })}
          >
            <span className="gender-icon">🙋‍♂️</span>
            <span>남성</span>
          </button>

          <button
            type="button"
            className={`gender-button ${gender === '여성' ? 'active' : ''}`}
            onClick={() => onChange({ gender: '여성' })}
          >
            <span className="gender-icon">🙋‍♀️</span>
            <span>여성</span>
          </button>
        </div>
      </div>

      {/* 나이 입력 */}
      <div className="form-group" style={{ marginTop: '24px' }}>
        <label className="form-label">
          나이 (만 나이 기준) <span className="required-dot">*</span>
        </label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="number"
            className="form-input"
            placeholder="예: 27"
            min={18}
            max={99}
            value={age === '' ? '' : age}
            onChange={(e) => {
              const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
              onChange({ age: isNaN(val as number) ? '' : val });
            }}
            onKeyDown={handleKeyDown}
            style={{ paddingRight: '48px' }}
          />
          <span
            style={{
              position: 'absolute',
              right: '16px',
              color: 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: 600,
              pointerEvents: 'none',
            }}
          >
            세
          </span>
        </div>

        {/* Quick age chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
          {[24, 26, 28, 30, 32, 34].map((item) => (
            <button
              key={item}
              type="button"
              className={`quick-tag ${age === item ? 'active' : ''}`}
              onClick={() => onChange({ age: item })}
            >
              {item}세
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
