'use client';

interface Props {
  height: number | '';
  phone: string;
  onChange: (fields: { height?: number | ''; phone?: string }) => void;
  onEnter?: () => void;
}

export default function StepHeightPhone({ height, phone, onChange, onEnter }: Props) {
  // 전화번호 자동 하이픈 포맷터 (010-XXXX-XXXX)
  const formatPhoneNumber = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '').slice(0, 11);
    if (raw.length <= 3) {
      return raw;
    } else if (raw.length <= 7) {
      return `${raw.slice(0, 3)}-${raw.slice(3)}`;
    } else {
      return `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onChange({ phone: formatted });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && height && phone.length >= 12 && onEnter) {
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <div className="animate-slide">
      <div className="card-badge">STEP 3 · 신체 스펙 & 연락처</div>
      <h2 className="step-title">키와 연락처를<br />입력해주세요.</h2>
      <p className="step-subtitle">전화번호는 매칭 진행 시 본인 확인 및 알림 용도로만 안전하게 활용됩니다.</p>

      {/* 키 입력 */}
      <div className="form-group">
        <label className="form-label">
          키 (cm) <span className="required-dot">*</span>
        </label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="number"
            className="form-input"
            placeholder="예: 175"
            min={130}
            max={220}
            value={height === '' ? '' : height}
            onChange={(e) => {
              const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
              onChange({ height: isNaN(val as number) ? '' : val });
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
            cm
          </span>
        </div>

        {/* Quick height tags */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
          {[158, 163, 168, 173, 178, 183].map((h) => (
            <button
              key={h}
              type="button"
              className={`quick-tag ${height === h ? 'active' : ''}`}
              onClick={() => onChange({ height: h })}
            >
              {h}cm
            </button>
          ))}
        </div>
      </div>

      {/* 전화번호 입력 */}
      <div className="form-group" style={{ marginTop: '24px' }}>
        <label className="form-label">
          전화번호 <span className="required-dot">*</span>
        </label>
        <input
          type="tel"
          className="form-input"
          placeholder="010-0000-0000"
          value={phone}
          onChange={handlePhoneChange}
          onKeyDown={handleKeyDown}
          maxLength={13}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '8px',
            fontSize: '12px',
            color: 'var(--text-dim)',
          }}
        >
          <span>🔒</span>
          <span>연락처는 암호화되어 안전하게 보관되며 외부에 무단 공개되지 않습니다.</span>
        </div>
      </div>
    </div>
  );
}
