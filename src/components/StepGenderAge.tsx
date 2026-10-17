'use client';

interface Props {
  gender: '남성' | '여성' | '';
  age: string;
  onChange: (fields: { gender?: '남성' | '여성'; age?: string }) => void;
  onEnter?: () => void;
}

export default function StepGenderAge({ gender, age, onChange, onEnter }: Props) {
  // 숫자만 추출해서 보여줌 (예: '98년생' -> '98')
  const rawNumber = age ? age.replace(/[^0-9]/g, '') : '';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && gender && rawNumber.length >= 2 && onEnter) {
      e.preventDefault();
      onEnter();
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    if (!digits) {
      onChange({ age: '' });
    } else {
      onChange({ age: `${digits}년생` });
    }
  };

  return (
    <div className="animate-slide">
      <div className="card-badge">STEP 2 · 성별 및 출생연도</div>
      <h2 className="step-title">성별과 출생연도를<br />입력해주세요.</h2>
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

      {/* 순수 숫자 입력 (몇년생) */}
      <div className="form-group" style={{ marginTop: '24px' }}>
        <label className="form-label">
          출생연도 (몇 년생) <span className="required-dot">*</span>
        </label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="form-input"
            placeholder="숫자만 입력 (예: 98 또는 1998)"
            value={rawNumber}
            onChange={handleNumberChange}
            onKeyDown={handleKeyDown}
            maxLength={4}
            style={{ paddingRight: '54px' }}
          />
          <span
            style={{
              position: 'absolute',
              right: '16px',
              color: 'var(--text-muted)',
              fontSize: '15px',
              fontWeight: 700,
              pointerEvents: 'none',
            }}
          >
            년생
          </span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '8px' }}>
          💡 콤보박스나 제한 없이 태어나신 연도 숫자(예: <b>98</b> 또는 <b>1998</b>)를 자유롭게 입력하시면 됩니다.
        </p>
      </div>
    </div>
  );
}
