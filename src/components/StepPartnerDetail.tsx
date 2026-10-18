'use client';

interface Props {
  detail: string;
  onChange: (fields: { preferredPartnerDetail: string }) => void;
}

const SUGGESTIONS = [
  '대화 코드가 잘 통하고 티키타카가 잘 되는 사람',
  '다정하고 배려심 깊으며 감정 기복이 적은 분',
  '자기 일에 자부심과 열정이 있는 성실한 사람',
  '주말에 함께 카페, 산책, 전시회를 즐길 수 있는 분',
  '연락이 편안하게 잘 되고 솔직하게 대화하는 사람',
  '유머 감각이 있고 함께 있으면 편안한 스타일',
];

export default function StepPartnerDetail({ detail, onChange }: Props) {
  const handleAddSuggestion = (text: string) => {
    if (!detail) {
      onChange({ preferredPartnerDetail: text });
    } else if (!detail.includes(text)) {
      onChange({ preferredPartnerDetail: `${detail}, ${text}` });
    }
  };

  return (
    <div className="animate-slide">
      <div className="card-badge">STEP 6 · 이상형 상세 취향</div>
      <h2 className="step-title">어떤 사람을 만났을 때<br />가장 설레고 편안하신가요?</h2>
      <p className="step-subtitle">
        선호하는 성격, 라이프스타일, 대화 방식, 가치관 등을 자유롭고 자세하게 적어주세요.
      </p>

      {/* Suggestion Chips */}
      <div style={{ marginBottom: '14px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
          ✨ 클릭해서 빠르게 추가할 수 있는 키워드:
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {SUGGESTIONS.map((sug) => (
            <button
              key={sug}
              type="button"
              className="suggestion-chip"
              onClick={() => handleAddSuggestion(sug)}
            >
              + {sug}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          선호하는 이성 (자세히) <span className="required-dot">*</span>
        </label>
        <textarea
          className="form-textarea"
          placeholder="예: 사소한 일상도 편하게 나눌 수 있는 다정하고 솔직한 사람을 좋아해요. 자기 관리를 꾸준히 하고, 쉬는 날엔 드라이브나 맛집 탐방을 함께 즐길 수 있는 분이면 좋겠습니다."
          value={detail}
          onChange={(e) => onChange({ preferredPartnerDetail: e.target.value })}
          rows={5}
        />
        <div className="char-counter">
          <span>{detail.length >= 10 ? '✅ 충분히 자세히 작성되었어요' : '자세히 작성해야 채택될 확률이 올라갑니다.'}</span>
          <span>{detail.length}자</span>
        </div>
      </div>
    </div>
  );
}
