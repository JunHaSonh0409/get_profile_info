'use client';

interface Props {
  selfIntro: string;
  onChange: (fields: { selfIntro: string }) => void;
}

const SELF_SUGGESTIONS = [
  '처음엔 낯을 가리지만 친해지면 유쾌하고 다정해요',
  '상대방의 이야기를 진심으로 경청하고 공감을 잘해요',
  '운동(러닝, 헬스, 클라이밍 등)과 활동적인 주말을 좋아해요',
  '새로운 맛집 탐방과 분위기 좋은 감성 카페 투어를 즐겨요',
  '약속 시간을 잘 지키고 솔직한 소통과 신뢰를 중요시해요',
  '소소한 일상 속에서 행복을 찾고 웃음이 많은 편이에요',
];

export default function StepSelfIntro({ selfIntro, onChange }: Props) {
  const handleAddSuggestion = (text: string) => {
    if (!selfIntro) {
      onChange({ selfIntro: text });
    } else if (!selfIntro.includes(text)) {
      onChange({ selfIntro: `${selfIntro}, ${text}` });
    }
  };

  return (
    <div className="animate-slide">
      <div className="card-badge">STEP 7 · 나를 소개하기</div>
      <h2 className="step-title">본인은 어떤 사람인가요?<br />자신만의 매력을 알려주세요.</h2>
      <p className="step-subtitle">
        나의 성격, 일상, 취미, 연애관 등 상대방이 나를 상상할 수 있도록 자세히 소개해 주세요.
      </p>

      {/* Suggestion Chips */}
      <div style={{ marginBottom: '14px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
          💡 나의 매력 포인트 키워드:
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {SELF_SUGGESTIONS.map((sug) => (
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
          본인은 어떤 사람인가 (자세히) <span className="required-dot">*</span>
        </label>
        <textarea
          className="form-textarea"
          placeholder="예: 평소에는 차분하지만 마음을 열면 장난기도 많고 따뜻한 사람입니다. IT 관련 일을 하고 있으며, 주말에는 전시를 보거나 산책하며 여유를 즐깁니다. 소통을 소중히 여기며 배려심 있는 태도를 지키려 노력합니다."
          value={selfIntro}
          onChange={(e) => onChange({ selfIntro: e.target.value })}
          rows={6}
        />
        <div className="char-counter">
          <span
            style={{
              fontWeight: 700,
              color: '#ff85a1',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>💡</span> 자세히 작성해야 채택될 확률이 올라갑니다.
          </span>
          <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
            {selfIntro.length}자
          </span>
        </div>
      </div>
    </div>
  );
}
