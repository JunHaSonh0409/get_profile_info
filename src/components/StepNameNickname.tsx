'use client';

interface Props {
  name: string;
  nickname: string;
  onChange: (fields: { name?: string; nickname?: string }) => void;
  onEnter?: () => void;
}

export default function StepNameNickname({ name, nickname, onChange, onEnter }: Props) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim() && nickname.trim() && onEnter) {
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <div className="animate-slide">
      <div className="card-badge">STEP 1 · 기본 인적사항</div>
      <h2 className="step-title">반가워요! 당신의 이름과<br />불리고 싶은 닉네임을 알려주세요.</h2>
      <p className="step-subtitle">인연과의 첫 시작을 위한 기본 호칭 정보예요.</p>

      <div className="form-group">
        <label className="form-label">
          이름 (실명) <span className="required-dot">*</span>
        </label>
        <input
          type="text"
          className="form-input"
          placeholder="예: 홍길동"
          value={name}
          onChange={(e) => onChange({ name: e.target.value })}
          onKeyDown={handleKeyDown}
          autoFocus
          maxLength={20}
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          닉네임 (프로필에 노출될 이름) <span className="required-dot">*</span>
        </label>
        <input
          type="text"
          className="form-input"
          placeholder="예: 햇살, 코지, 낭만닥터 등"
          value={nickname}
          onChange={(e) => onChange({ nickname: e.target.value })}
          onKeyDown={handleKeyDown}
          maxLength={20}
        />
        <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>
          💡 센스 있고 기억에 남는 나만의 별명을 지어보세요.
        </p>
      </div>
    </div>
  );
}
