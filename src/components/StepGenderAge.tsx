'use client';

interface Props {
  gender: '남성' | '여성' | '';
  age: string;
  onChange: (fields: { gender?: '남성' | '여성'; age?: string }) => void;
  onEnter?: () => void;
}

const POPULAR_BIRTH_YEARS = [
  '94년생', '95년생', '96년생', '97년생', '98년생',
  '99년생', '00년생', '01년생', '02년생', '03년생'
];

// Generate years 2006 ~ 1980 for dropdown
const ALL_YEARS = Array.from({ length: 27 }, (_, i) => {
  const fullYear = 2006 - i;
  const shortYear = String(fullYear).slice(-2);
  return {
    fullYear,
    label: `${shortYear}년생 (${fullYear}년)`
  };
});

export default function StepGenderAge({ gender, age, onChange, onEnter }: Props) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && gender && age && onEnter) {
      e.preventDefault();
      onEnter();
    }
  };

  const handleInputChange = (val: string) => {
    // If user enters '98' or '1998'
    let clean = val.trim();
    if (clean && !clean.endsWith('년생')) {
      const numOnly = clean.replace(/[^0-9]/g, '');
      if (numOnly.length === 2) {
        clean = `${numOnly}년생`;
      } else if (numOnly.length === 4) {
        clean = `${numOnly.slice(-2)}년생`;
      }
    }
    onChange({ age: clean });
  };

  return (
    <div className="animate-slide">
      <div className="card-badge">STEP 2 · 성별 및 출생연도</div>
      <h2 className="step-title">성별과 출생연도를<br />선택해주세요.</h2>
      <p className="step-subtitle">어울리는 최적의 매칭 연령대를 추천해드리기 위해 몇 년생인지 알려주세요.</p>

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

      {/* 몇년생 입력 & 빠른 선택 */}
      <div className="form-group" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label className="form-label" style={{ margin: 0 }}>
            출생연도 (몇 년생) <span className="required-dot">*</span>
          </label>
          {age && (
            <span style={{ fontSize: '13px', color: '#ff85a1', fontWeight: 700 }}>
              선택: {age}
            </span>
          )}
        </div>

        {/* Input & Dropdown combo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="예: 98년생 (또는 98)"
            value={age}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={10}
          />

          <select
            className="form-select"
            value={age}
            onChange={(e) => onChange({ age: e.target.value })}
            style={{ fontSize: '14px', padding: '12px' }}
          >
            <option value="" disabled style={{ background: '#131627', color: '#888' }}>
              목록에서 선택
            </option>
            {ALL_YEARS.map((y) => {
              const val = `${String(y.fullYear).slice(-2)}년생`;
              return (
                <option key={y.fullYear} value={val} style={{ background: '#131627', color: '#fff' }}>
                  {y.label}
                </option>
              );
            })}
          </select>
        </div>

        {/* Quick birth year chips */}
        <div style={{ marginTop: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            🔥 빠른 선택:
          </span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {POPULAR_BIRTH_YEARS.map((item) => (
              <button
                key={item}
                type="button"
                className={`quick-tag ${age === item ? 'active' : ''}`}
                onClick={() => onChange({ age: item })}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
