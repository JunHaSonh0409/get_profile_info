'use client';

import { ProfileData } from '@/lib/types';
import { useState } from 'react';

interface Props {
  data: ProfileData;
  onGoToStep: (stepNumber: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  errorMessage?: string;
}

export default function StepReview({ data, onGoToStep, onSubmit, isSubmitting, errorMessage }: Props) {
  const [agreed, setAgreed] = useState(true);

  return (
    <div className="animate-slide">
      <div className="card-badge">STEP 8 · 최종 확인 및 제출</div>
      <h2 className="step-title">입력하신 프로필 정보를<br />마지막으로 확인해주세요.</h2>
      <p className="step-subtitle">수정이 필요한 항목이 있다면 [수정]을 눌러 바로 수정할 수 있어요.</p>

      {errorMessage && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#fca5a5',
            fontSize: '13.5px',
            marginBottom: '18px',
          }}
        >
          ⚠️ {errorMessage}
        </div>
      )}

      {/* 기본 정보 요약 박스 */}
      <div className="summary-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ fontSize: '14px', color: '#ff85a1', fontWeight: 700 }}>기본 프로필</h4>
          <button type="button" className="summary-edit-btn" onClick={() => onGoToStep(1)}>수정</button>
        </div>

        <div className="summary-row">
          <span className="summary-key">이름 / 닉네임</span>
          <span className="summary-val">{data.name} ({data.nickname})</span>
        </div>

        <div className="summary-row">
          <span className="summary-key">성별 / 출생연도</span>
          <span className="summary-val">
            {data.gender} · {data.age.endsWith('년생') ? data.age : `${data.age}년생`}
            <button type="button" className="summary-edit-btn" onClick={() => onGoToStep(2)}>수정</button>
          </span>
        </div>

        <div className="summary-row">
          <span className="summary-key">키 / 연락처</span>
          <span className="summary-val">
            {data.height}cm · {data.phone}
            <button type="button" className="summary-edit-btn" onClick={() => onGoToStep(3)}>수정</button>
          </span>
        </div>

        <div className="summary-row">
          <span className="summary-key">사는 곳 (구)</span>
          <span className="summary-val">
            {data.location}
            <button type="button" className="summary-edit-btn" onClick={() => onGoToStep(4)}>수정</button>
          </span>
        </div>
      </div>

      {/* 취향 및 소개 요약 박스 */}
      <div className="summary-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ fontSize: '14px', color: '#8b5cf6', fontWeight: 700 }}>이성상 및 자기소개</h4>
        </div>

        <div className="summary-row" style={{ flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span className="summary-key">선호하는 동물상</span>
            <button type="button" className="summary-edit-btn" onClick={() => onGoToStep(5)}>수정</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
            {data.preferredAnimals.length > 0 ? (
              data.preferredAnimals.map((animal) => (
                <span
                  key={animal}
                  style={{
                    fontSize: '12px',
                    padding: '3px 9px',
                    borderRadius: '20px',
                    background: 'rgba(255, 67, 112, 0.15)',
                    color: '#ff85a1',
                    border: '1px solid rgba(255, 67, 112, 0.3)',
                  }}
                >
                  {animal}
                </span>
              ))
            ) : (
              <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>미선택</span>
            )}
          </div>
        </div>

        {data.preferredAppearanceDetail && (
          <div className="summary-row" style={{ flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span className="summary-key">원하는 외적 구체상</span>
              <button type="button" className="summary-edit-btn" onClick={() => onGoToStep(5)}>수정</button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.5' }}>
              {data.preferredAppearanceDetail}
            </p>
          </div>
        )}

        <div className="summary-row" style={{ flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span className="summary-key">선호하는 이성 (자세히)</span>
            <button type="button" className="summary-edit-btn" onClick={() => onGoToStep(6)}>수정</button>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-main)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
            {data.preferredPartnerDetail}
          </p>
        </div>

        <div className="summary-row" style={{ flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <span className="summary-key">본인은 어떤 사람인가 (자세히)</span>
            <button type="button" className="summary-edit-btn" onClick={() => onGoToStep(7)}>수정</button>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-main)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
            {data.selfIntro}
          </p>
        </div>
      </div>

      {/* 동의 체크박스 */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '13px',
          color: 'var(--text-muted)',
          marginBottom: '16px',
        }}
      >
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          style={{ width: '16px', height: '16px', accentColor: '#ff4370' }}
        />
        <span>작성한 프로필 정보 제공 및 매칭 프로세스 진행에 동의합니다.</span>
      </label>

      {/* 최종 제출 버튼 */}
      <button
        type="button"
        className="btn-next"
        style={{ width: '100%', fontSize: '16px', padding: '16px 20px' }}
        disabled={!agreed || isSubmitting}
        onClick={onSubmit}
      >
        {isSubmitting ? (
          <>
            <span style={{ display: 'inline-block', animation: 'spin 1s infinite linear' }}>⏳</span>
            <span>프로필을 안전하게 저장하고 있습니다...</span>
          </>
        ) : (
          <>
            <span>💌</span>
            <span>프로필 등록 완료 및 제출하기</span>
          </>
        )}
      </button>
    </div>
  );
}
