'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { OrbitEvent } from '@/types/event';

interface Props {
  event: OrbitEvent;
}

export default function EventDetailClient({ event }: Props) {
  const [isNotified, setIsNotified] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const statusLabel =
    event.status === 'ongoing' ? '진행중 이벤트' : event.status === 'ended' ? '종료된 이벤트' : '오픈 예정';
  const statusColor =
    event.status === 'ongoing' ? '#38bdf8' : event.status === 'ended' ? '#94a3b8' : '#34d399';
  const statusBg =
    event.status === 'ongoing'
      ? 'rgba(56, 189, 248, 0.15)'
      : event.status === 'ended'
      ? 'rgba(148, 163, 184, 0.15)'
      : 'rgba(52, 211, 153, 0.15)';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 10%, #0f172a 0%, #07090e 70%)',
        color: '#f8fafc',
        padding: '24px 20px 80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: 'var(--font-pretendard, -apple-system, sans-serif)',
      }}
    >
      {/* Toast Alert */}
      {copied && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid #38bdf8',
            color: '#38bdf8',
            padding: '12px 24px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: 700,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
          }}
        >
          ✓ 이벤트 링크가 클립보드에 복사되었습니다!
        </div>
      )}

      {/* Top Header Navigation */}
      <header
        style={{
          width: '100%',
          maxWidth: '540px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#e2e8f0',
            padding: '8px 16px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}
        >
          <span>←</span> 홈으로 돌아가기
        </Link>

        <button
          type="button"
          onClick={handleShare}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#94a3b8',
            padding: '8px 14px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>🔗</span> 공유하기
        </button>
      </header>

      {/* Main Content Container */}
      <main style={{ width: '100%', maxWidth: '540px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Event Header Banner */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              padding: '4px 14px',
              borderRadius: '999px',
              color: '#ef4444',
              fontSize: '11.5px',
              fontWeight: 800,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginBottom: '14px',
            }}
          >
            <span>🎟️</span> ORBIT EVENT · {event.volNumber}
          </div>

          <h1
            style={{
              fontSize: '26px',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-0.5px',
              margin: '0 0 10px',
              lineHeight: 1.3,
            }}
          >
            {event.title}
          </h1>

          <p
            style={{
              fontSize: '14px',
              color: '#94a3b8',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {event.subtitle || 'Orbit 회원들을 위한 특별한 인연 매칭 라인업'}
          </p>

          <div style={{ marginTop: '14px' }}>
            <span
              style={{
                display: 'inline-block',
                background: statusBg,
                color: statusColor,
                border: `1px solid ${statusColor}40`,
                fontSize: '11.5px',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: '999px',
              }}
            >
              ● {statusLabel}
            </span>
          </div>
        </div>

        {/* Hero Card / Poster Display */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            borderRadius: '24px',
            background: 'linear-gradient(165deg, #18181b 0%, #09090b 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(14, 165, 233, 0.15)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: event.imageUrl ? 'auto' : '320px',
            padding: event.imageUrl ? '0' : '40px 20px',
          }}
        >
          {event.imageUrl ? (
            <div style={{ position: 'relative', width: '100%' }}>
              <img
                src={event.imageUrl}
                alt={event.title}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  maxHeight: '520px',
                  objectFit: 'cover',
                }}
              />
              {/* Subtle glass overlay at top */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  padding: '16px',
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444', letterSpacing: '1.5px' }}>
                  {event.volNumber}
                </span>
                <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>OFFICIAL EVENT POSTER</span>
              </div>
            </div>
          ) : (
            /* Coming Soon 3D Crystal Question Mark Hero Display */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(56, 189, 248, 0.5) 0%, transparent 70%)',
                    filter: 'blur(20px)',
                  }}
                />
                <img
                  src="/images/crystal_question_mark.png"
                  alt="Coming Soon"
                  style={{
                    position: 'relative',
                    width: '100px',
                    height: 'auto',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.8)) drop-shadow(0 0 25px rgba(56,189,248,0.7))',
                  }}
                />
              </div>

              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 900,
                  color: '#ef4444',
                  letterSpacing: '5px',
                  textTransform: 'uppercase',
                  fontFamily: '"Outfit", sans-serif',
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.8), 0 0 16px rgba(239, 68, 68, 0.7)',
                }}
              >
                comming soon
              </div>
              <p style={{ fontSize: '12.5px', color: '#f87171', marginTop: '8px' }}>
                관리자 페이지에서 포스터 이미지가 등록되면 이곳에 고화질로 표시됩니다.
              </p>
            </div>
          )}
        </div>

        {/* Event Quick Specs Panel */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '22px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '18px' }}>📅</span>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>일시 / 오픈 일정</div>
              <div style={{ fontSize: '14px', color: '#f8fafc', fontWeight: 700, marginTop: '2px' }}>
                {event.date || '추후 공개 예정'}
              </div>
            </div>
          </div>

          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '18px' }}>📍</span>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>장소 및 방식</div>
              <div style={{ fontSize: '14px', color: '#f8fafc', fontWeight: 700, marginTop: '2px' }}>
                {event.location || '선정 회원 개별 안내'}
              </div>
            </div>
          </div>

          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '18px' }}>👥</span>
            <div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>모집 인원</div>
              <div style={{ fontSize: '14px', color: '#f8fafc', fontWeight: 700, marginTop: '2px' }}>
                {event.capacity || '선착순 모집 (성비 1:1 보장)'}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Event Description */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '24px 20px',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', margin: '0 0 14px' }}>
            📖 이벤트 상세 안내
          </h2>
          <div
            style={{
              fontSize: '14px',
              color: '#cbd5e1',
              lineHeight: 1.8,
              whiteSpace: 'pre-line',
            }}
          >
            {event.content || event.description || '이벤트 준비가 진행 중입니다.'}
          </div>
        </div>

        {/* Important Guidelines */}
        <div
          style={{
            background: 'rgba(14, 165, 233, 0.06)',
            border: '1px solid rgba(14, 165, 233, 0.2)',
            borderRadius: '20px',
            padding: '20px',
          }}
        >
          <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: '#38bdf8', margin: '0 0 8px' }}>
            🛡️ Orbit 안심 매칭 프로세스
          </h3>
          <ul
            style={{
              margin: 0,
              paddingLeft: '18px',
              fontSize: '12.5px',
              color: '#94a3b8',
              lineHeight: 1.6,
            }}
          >
            <li>철저한 프로필 검증과 본인 확인을 완료한 회원만 참석할 수 있습니다.</li>
            <li>개인정보 보호를 위해 매칭 전까지 연락처 및 실명은 공개되지 않습니다.</li>
            <li>노쇼 방지 및 건전한 모임을 위해 사전 예약제로 운영됩니다.</li>
          </ul>
        </div>

        {/* Bottom CTA Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          <button
            type="button"
            onClick={() => setIsNotified(true)}
            style={{
              width: '100%',
              background: isNotified ? 'rgba(52, 211, 153, 0.2)' : 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
              color: isNotified ? '#34d399' : '#ffffff',
              border: `1px solid ${isNotified ? 'rgba(52, 211, 153, 0.4)' : 'transparent'}`,
              borderRadius: '16px',
              padding: '16px',
              fontSize: '15px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: isNotified ? 'none' : '0 8px 25px rgba(14, 165, 233, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <span>{isNotified ? '✓' : '🔔'}</span>
            {isNotified ? '오픈 알림 예약 완료 (SMS 공지)' : '이벤트 오픈 시 알림 신청하기'}
          </button>

          <Link
            href="/"
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              borderRadius: '16px',
              padding: '14px',
              fontSize: '13.5px',
              fontWeight: 600,
              textDecoration: 'none',
              textAlign: 'center',
              boxSizing: 'border-box',
              display: 'block',
            }}
          >
            프로필 등록 및 메인으로 가기
          </Link>
        </div>
      </main>
    </div>
  );
}
