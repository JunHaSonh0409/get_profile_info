'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ProfileData } from '@/lib/types';

interface Props {
  data: ProfileData;
  receiptId?: string;
  isDemo?: boolean;
  onReset: () => void;
  onViewList?: () => void;
}

export default function StepSuccess({ data, receiptId, isDemo, onReset, onViewList }: Props) {
  useEffect(() => {
    // Fire celebratory confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff4370', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'],
      });
    } catch (e) {
      console.log('Confetti not available:', e);
    }
  }, []);

  return (
    <div className="animate-fade success-card">
      <div className="success-icon-wrap">🎉</div>
      <h2 className="success-title">프로필 등록이 완료되었습니다!</h2>
      <p className="success-desc">
        {data.nickname} ({data.name})님의 소중한 프로필이 정성스럽게 접수되었습니다.<br />
        입력해주신 이상형과 가치관에 꼭 맞는 좋은 인연을 찾아드릴게요.
      </p>

      {isDemo && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '12px',
            padding: '12px 14px',
            fontSize: '12.5px',
            color: '#fcd34d',
            marginBottom: '20px',
            textAlign: 'left',
          }}
        >
          💡 <b>안내 (데모 로컬 모드):</b> 현재 Supabase 환경변수가 설정되지 않아 로컬 모의 접수로 완료되었습니다.
          <br /><code>.env.local</code>에 Supabase URL과 Key를 입력하시면 실제 Supabase DB에 실시간 저장됩니다.
        </div>
      )}

      {/* 등록 영수증 카드 */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '20px',
          textAlign: 'left',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-dim)' }}>접수 번호</span>
          <span style={{ color: '#ff85a1', fontFamily: 'monospace', fontWeight: 700 }}>
            {receiptId || 'PRF-' + Math.floor(100000 + Math.random() * 900000)}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-dim)' }}>접수 일시</span>
          <span style={{ color: 'var(--text-main)' }}>
            {new Date().toLocaleString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-dim)' }}>선호 동물상</span>
          <span style={{ color: '#c4b5fd', fontWeight: 600 }}>
            {data.preferredAnimals.join(', ') || '상관없음'}
          </span>
        </div>
      </div>

      {/* 액션 버튼들 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {onViewList && (
          <button
            type="button"
            className="btn-next"
            onClick={onViewList}
            style={{ width: '100%', background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' }}
          >
            📋 등록된 프로필 목록 확인하기
          </button>
        )}

        <button
          type="button"
          className="btn-prev"
          onClick={onReset}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          🔄 다른 프로필 새로 등록하기
        </button>
      </div>
    </div>
  );
}
