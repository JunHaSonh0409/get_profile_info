'use client';

interface Props {
  height: number | '';
  phone: string;
  onChange: (fields: { height?: number | '' }) => void;
  onEnter?: () => void;
}

export default function StepHeightPhone({
  height,
  phone,
  onChange,
  onEnter,
}: Props) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && typeof height === 'number' && height >= 120 && onEnter) {
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <div className="animate-slide">
      <div className="card-badge">STEP 3 · 신체 스펙 (키)</div>
      <h2 className="step-title">키를 입력해주세요.</h2>
      <p className="step-subtitle">매칭 시 상대방에게 참고 정보로 제공됩니다.</p>

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
            min={120}
            max={230}
            value={height === '' ? '' : height}
            onChange={(e) => {
              const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
              onChange({ height: isNaN(val as number) ? '' : val });
            }}
            onKeyDown={handleKeyDown}
            style={{ paddingRight: '48px' }}
            autoFocus
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

      {/* 인증된 전화번호 확인 카드 (로그인 시 인증 완료됨) */}
      <div
        style={{
          marginTop: '26px',
          padding: '14px 16px',
          background: 'rgba(52, 211, 153, 0.07)',
          border: '1px solid rgba(52, 211, 153, 0.25)',
          borderRadius: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '11.5px', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>✅</span>
            <span>휴대폰인증 완료</span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginTop: '4px' }}>
            연락처: {phone || '-'}
          </div>
        </div>
        <span style={{ fontSize: '11.5px', color: 'var(--text-dim)' }}>
          자동 연동됨
        </span>
      </div>
    </div>
  );
}
