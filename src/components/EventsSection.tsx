'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OrbitEvent } from '@/types/event';

interface Props {
  onGoToProfile: () => void;
}

const defaultEvents: OrbitEvent[] = [
  {
    id: 'vol01',
    slug: 'vol01',
    volNumber: 'VOL.01',
    title: '비밀 인연 매칭 프로젝트',
    subtitle: '곧 첫 번째 이벤트가 공개됩니다',
    status: 'upcoming',
    imageUrl: '',
    dDayText: 'PREVIEW · D-DAY EVENT',
    badgeText: 'ORBIT EXCLUSIVE',
    description: 'Orbit 회원들을 위한 특별한 첫 번째 시크릿 인연 매칭 이벤트입니다. 관리자 페이지에서 이벤트 포스터/이미지를 등록하면 카드에 즉시 반영됩니다.',
  },
  {
    id: 'vol02',
    slug: 'vol02',
    volNumber: 'VOL.02',
    title: '가을밤 별빛 블라인드 데이트',
    subtitle: '두 번째 시크릿 매칭 라인업',
    status: 'upcoming',
    imageUrl: '',
    dDayText: 'COMING SOON',
    badgeText: 'ORBIT SEASON 2',
    description: '깊어가는 가을, 별빛 아래서 나누는 진솔한 대화. 두 번째 Orbit 특별 매칭 이벤트입니다.',
  },
];

const formatVolEnd = (vol?: string) => {
  const v = (vol || 'VOL.1').trim();
  if (/end$/i.test(v)) return v.toUpperCase();
  const normalized = v.replace(/vol\.?\s*0*/i, 'VOL.').toUpperCase();
  return `${normalized} END`;
};

export default function EventsSection({ onGoToProfile }: Props) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isNotificationSaved, setIsNotificationSaved] = useState(false);

  // Dynamic events from API
  const [events, setEvents] = useState<OrbitEvent[]>(defaultEvents);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    fetch('/api/events', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.events) && data.events.length > 0) {
          setEvents(data.events);
        }
      })
      .catch(() => {
        // Fallback to defaultEvents
      });
  }, []);

  const currentEvent = events[selectedIndex] || events[0] || defaultEvents[0];
  const isEventOpen = currentEvent.status === 'ongoing';
  const isEventEnded = currentEvent.status === 'ended';

  const handleCardClick = () => {
    router.push(`/events/${currentEvent.slug}`);
  };

  return (
    <div
      className="animate-fade"
      style={{
        width: '100%',
        maxWidth: '540px',
        margin: '0 auto',
        padding: '10px 0 60px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Category / Page Header */}
      <div style={{ textAlign: 'center', marginBottom: '22px', width: '100%' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: isEventOpen
              ? 'rgba(16, 185, 129, 0.15)'
              : isEventEnded
              ? 'rgba(148, 163, 184, 0.15)'
              : 'rgba(14, 165, 233, 0.15)',
            border: isEventOpen
              ? '1px solid rgba(16, 185, 129, 0.4)'
              : isEventEnded
              ? '1px solid rgba(148, 163, 184, 0.35)'
              : '1px solid rgba(14, 165, 233, 0.35)',
            padding: '4px 12px',
            borderRadius: '999px',
            color: isEventOpen ? '#34d399' : isEventEnded ? '#94a3b8' : '#38bdf8',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            marginBottom: '12px',
          }}
        >
          <span>{isEventOpen ? '🟢' : isEventEnded ? '🏁' : '🎟️'}</span>{' '}
          {isEventOpen
            ? '공식 오픈 · 지금 접수 중'
            : isEventEnded
            ? `${formatVolEnd(currentEvent.volNumber)} (종료)`
            : currentEvent.badgeText || 'ORBIT EXCLUSIVE EVENT'}
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.5px', margin: 0 }}>
          진행중 <span style={{ color: isEventOpen ? '#34d399' : isEventEnded ? '#94a3b8' : '#38bdf8' }}>이벤트</span>
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
          Orbit 회원들을 위한 특별한 오프라인 & 온라인 인연 매칭 라인업
        </p>

        {/* Volume Selector Pills (VOL.01, VOL.02...) */}
        <div
          style={{
            display: 'inline-flex',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '999px',
            padding: '4px',
            gap: '6px',
            marginTop: '16px',
          }}
        >
          {events.map((ev, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={ev.id || ev.slug}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                style={{
                  background: isSelected ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
                  color: isSelected ? '#fff' : 'var(--text-muted)',
                  border: isSelected ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                  borderRadius: '999px',
                  padding: '6px 16px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '1px',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 2px 10px rgba(2, 132, 199, 0.4)' : 'none',
                }}
              >
                {ev.volNumber}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STANDALONE EVENT CARD ASSET DESIGN (Matching User Reference Image)        */}
      {/* ========================================================================= */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px 0 24px',
        }}
      >
        {/* Main Event Card (Standalone design without overlapping case) */}
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleCardClick}
          title="클릭하여 이벤트 상세 페이지로 이동"
          style={{
            position: 'relative',
            width: 'min(300px, 86vw)',
            height: '400px',
            borderRadius: '22px',
            background: 'linear-gradient(165deg, #18181b 0%, #0c0a09 45%, #000000 100%)',
            border: isEventOpen
              ? '1px solid rgba(52, 211, 153, 0.35)'
              : isEventEnded
              ? '1px solid rgba(148, 163, 184, 0.25)'
              : '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: isHovered
              ? isEventOpen
                ? '0 30px 70px rgba(0, 0, 0, 0.95), 0 0 45px rgba(16, 185, 129, 0.45)'
                : isEventEnded
                ? '0 30px 70px rgba(0, 0, 0, 0.95), 0 0 35px rgba(148, 163, 184, 0.2)'
                : '0 30px 70px rgba(0, 0, 0, 0.95), 0 0 45px rgba(239, 68, 68, 0.35)'
              : isEventOpen
              ? '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(16, 185, 129, 0.25)'
              : isEventEnded
              ? '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 20px rgba(148, 163, 184, 0.15)'
              : '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(239, 68, 68, 0.2)',
            transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '16px 14px',
            boxSizing: 'border-box',
            cursor: 'pointer',
          }}
        >
          {/* Registered Poster Image (if uploaded) */}
          {currentEvent.imageUrl && (
            <>
              <img
                src={currentEvent.imageUrl}
                alt={currentEvent.title}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: 0,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(180deg, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.2) 35%, rgba(0, 0, 0, 0.85) 100%)',
                  zIndex: 1,
                }}
              />
            </>
          )}

          {/* Top Serial & Dots (Asset Style - renders OVER image) */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '8px',
              borderBottom: isEventOpen
                ? '1px solid rgba(52, 211, 153, 0.4)'
                : isEventEnded
                ? '1px solid rgba(148, 163, 184, 0.3)'
                : '1px solid rgba(239, 68, 68, 0.35)',
              zIndex: 2,
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: isEventOpen ? '#34d399' : isEventEnded ? '#94a3b8' : '#ef4444',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                textShadow: '0 1px 4px rgba(0, 0, 0, 0.8)',
              }}
            >
              ORBIT EVENT · {currentEvent.volNumber} {isEventOpen ? '· OPEN' : isEventEnded ? '· END' : ''}
            </span>
            <div style={{ display: 'flex', gap: '3px' }}>
              <span
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: isEventOpen ? '#34d399' : isEventEnded ? '#94a3b8' : '#ef4444',
                }}
              />
              <span
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: isEventOpen
                    ? 'rgba(52, 211, 153, 0.65)'
                    : isEventEnded
                    ? 'rgba(148, 163, 184, 0.65)'
                    : 'rgba(239, 68, 68, 0.65)',
                }}
              />
              <span
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: isEventOpen
                    ? 'rgba(52, 211, 153, 0.35)'
                    : isEventEnded
                    ? 'rgba(148, 163, 184, 0.35)'
                    : 'rgba(239, 68, 68, 0.35)',
                }}
              />
            </div>
          </div>

          {/* Center Content: 3D Crystal Question Mark or Image Live Indicator */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              margin: 'auto 0',
              zIndex: 2,
            }}
          >
            {!currentEvent.imageUrl ? (
              /* 3D Liquid Crystal Question Mark Asset with Ambient Glow */
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'floatCrystalQuestion 3.2s infinite ease-in-out alternate',
                }}
              >
                {/* Backing Ambient Glow */}
                <div
                  style={{
                    position: 'absolute',
                    width: '110px',
                    height: '110px',
                    borderRadius: '50%',
                    background: isEventOpen
                      ? 'radial-gradient(circle, rgba(52, 211, 153, 0.55) 0%, rgba(14, 165, 233, 0.2) 50%, transparent 75%)'
                      : isEventEnded
                      ? 'radial-gradient(circle, rgba(148, 163, 184, 0.35) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(56, 189, 248, 0.5) 0%, rgba(14, 165, 233, 0.15) 50%, transparent 75%)',
                    filter: 'blur(16px)',
                    zIndex: 0,
                    pointerEvents: 'none',
                  }}
                />

                <img
                  src="/images/crystal_question_mark.png"
                  alt={isEventOpen ? 'Now Open Event' : isEventEnded ? 'Ended Event' : 'Coming Soon Event'}
                  style={{
                    position: 'relative',
                    width: '92px',
                    height: 'auto',
                    maxHeight: '135px',
                    objectFit: 'contain',
                    filter: isEventOpen
                      ? 'drop-shadow(0 14px 28px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 24px rgba(52, 211, 153, 0.75))'
                      : isEventEnded
                      ? 'drop-shadow(0 14px 28px rgba(0, 0, 0, 0.85)) grayscale(0.6)'
                      : 'drop-shadow(0 14px 28px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 24px rgba(56, 189, 248, 0.75))',
                    zIndex: 1,
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(0, 0, 0, 0.65)',
                  border: isEventOpen
                    ? '1px solid rgba(52, 211, 153, 0.6)'
                    : isEventEnded
                    ? '1px solid rgba(148, 163, 184, 0.5)'
                    : '1px solid rgba(239, 68, 68, 0.5)',
                  padding: '5px 14px',
                  borderRadius: '999px',
                  color: isEventOpen ? '#34d399' : isEventEnded ? '#94a3b8' : '#ef4444',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  backdropFilter: 'blur(6px)',
                }}
              >
                <span>{isEventOpen ? '🟢' : isEventEnded ? '🏁' : '🎟️'}</span>{' '}
                {isEventOpen
                  ? 'NOW OPEN'
                  : isEventEnded
                  ? formatVolEnd(currentEvent.volNumber)
                  : 'POSTER PREVIEW'}
              </div>
            )}
          </div>

          {/* Bottom Frosted Capsule Mockup: Dynamic COMMING SOON -> NOW OPEN -> VOL.1 END */}
          <div
            style={{
              position: 'relative',
              background: isEventOpen
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.32) 100%)'
                : isEventEnded
                ? 'rgba(255, 255, 255, 0.06)'
                : 'rgba(255, 255, 255, 0.10)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: isEventOpen
                ? '1px solid rgba(52, 211, 153, 0.45)'
                : isEventEnded
                ? '1px solid rgba(148, 163, 184, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.18)',
              borderTop: isEventOpen
                ? '2px solid rgba(110, 231, 183, 0.85)'
                : isEventEnded
                ? '2px solid rgba(148, 163, 184, 0.55)'
                : '2px solid rgba(255, 255, 255, 0.45)',
              borderRadius: '14px',
              padding: '12px 10px',
              textAlign: 'center',
              boxShadow: isEventOpen ? '0 8px 24px rgba(16, 185, 129, 0.25)' : 'none',
              zIndex: 3,
            }}
          >
            {isEventOpen ? (
              <>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '15px',
                    fontWeight: 900,
                    color: '#34d399',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    fontFamily: '"Outfit", sans-serif',
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.9), 0 0 16px rgba(52, 211, 153, 0.8)',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#10b981',
                      boxShadow: '0 0 10px #10b981, 0 0 18px #34d399',
                    }}
                  />
                  NOW OPEN
                </div>
                <div
                  style={{
                    fontSize: '11.5px',
                    color: '#a7f3d0',
                    marginTop: '5px',
                    fontWeight: 700,
                    textShadow: '0 1px 6px rgba(0, 0, 0, 0.8)',
                  }}
                >
                  {currentEvent.title || '지금 바로 참가 신청 가능'}
                </div>
              </>
            ) : isEventEnded ? (
              <>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 900,
                    color: '#94a3b8',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    fontFamily: '"Outfit", sans-serif',
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.9)',
                  }}
                >
                  {formatVolEnd(currentEvent.volNumber)}
                </div>
                <div
                  style={{
                    fontSize: '11.5px',
                    color: '#cbd5e1',
                    marginTop: '5px',
                    fontWeight: 600,
                    textShadow: '0 1px 6px rgba(0, 0, 0, 0.8)',
                  }}
                >
                  이벤트가 종료되었습니다
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 900,
                    color: '#ef4444',
                    letterSpacing: '3.5px',
                    textTransform: 'uppercase',
                    fontFamily: '"Outfit", sans-serif',
                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.9), 0 0 16px rgba(239, 68, 68, 0.75)',
                  }}
                >
                  COMMING SOON
                </div>
                <div
                  style={{
                    fontSize: '11.5px',
                    color: '#f87171',
                    marginTop: '5px',
                    fontWeight: 600,
                    textShadow: '0 1px 6px rgba(0, 0, 0, 0.8)',
                  }}
                >
                  {currentEvent.title || '가을밤 별빛 블라인드 데이트'}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Micro-hint & Direct Link Button */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '26px',
          width: '100%',
          maxWidth: '480px',
        }}
      >
        <Link
          href={`/events/${currentEvent.slug}`}
          style={{
            width: '100%',
            background: isEventOpen
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.4) 100%)'
              : isEventEnded
              ? 'rgba(255, 255, 255, 0.05)'
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.25) 100%)',
            border: isEventOpen
              ? '1px solid rgba(52, 211, 153, 0.55)'
              : isEventEnded
              ? '1px solid rgba(148, 163, 184, 0.3)'
              : '1px solid rgba(239, 68, 68, 0.4)',
            color: isEventOpen ? '#34d399' : isEventEnded ? '#94a3b8' : '#ef4444',
            padding: '12px 20px',
            borderRadius: '14px',
            fontSize: '13.5px',
            fontWeight: 800,
            textDecoration: 'none',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: isEventOpen ? '0 4px 18px rgba(16, 185, 129, 0.3)' : '0 4px 16px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.2s',
          }}
        >
          <span>{isEventOpen ? '🚀' : isEventEnded ? '🏁' : '🎟️'}</span>{' '}
          {isEventOpen
            ? `${currentEvent.volNumber} 이벤트 참가 신청하기 (OPEN) →`
            : isEventEnded
            ? `${formatVolEnd(currentEvent.volNumber)} 안내 보기 →`
            : `${currentEvent.volNumber} 이벤트 전용 페이지로 이동하기 →`}
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#94a3b8',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          <span>👆</span> 카드를 터치하면 이벤트 상세 페이지로 이동합니다
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EVENT DETAILS & PRE-REGISTRATION NOTIFICATION CARD                        */}
      {/* ========================================================================= */}
      <div
        className="profile-card"
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'rgba(22, 27, 46, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                background: '#ef4444',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '6px',
              }}
            >
              {currentEvent.volNumber}
            </span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
              {currentEvent.title}
            </span>
          </div>

          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#38bdf8',
              background: 'rgba(14, 165, 233, 0.15)',
              padding: '3px 8px',
              borderRadius: '999px',
            }}
          >
            {currentEvent.status === 'ongoing' ? '진행중' : '오픈 준비 중'}
          </span>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
          {currentEvent.description ||
            '회원님들의 취향과 가치관을 기반으로 준비 중인 공식 매칭 이벤트입니다. 프로필을 미리 등록해두시면 이벤트 오픈 시 가장 먼저 우선 신청 혜택을 받으실 수 있습니다.'}
        </p>

        {/* Feature highlight bullet points */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '12px',
            color: '#cbd5e1',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#38bdf8' }}>✓</span> 이상형 조건에 맞춤 매칭되는 프라이빗 이벤트
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#38bdf8' }}>✓</span> 프로필 등록 회원 전용 우선 초대권 제공
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#38bdf8' }}>✓</span> 세부 일정 및 장소는 오픈 시 일괄 안내
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
          <button
            type="button"
            onClick={onGoToProfile}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '14px',
              padding: '14px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(14, 165, 233, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            <span>💫</span> 프로필 등록/확인하러 가기 →
          </button>

          <button
            type="button"
            onClick={() => {
              window.open('https://pf.kakao.com/_txnqmX', '_blank', 'noopener,noreferrer');
              setIsNotificationSaved(true);
            }}
            style={{
              width: '100%',
              background: isNotificationSaved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              color: isNotificationSaved ? '#34d399' : 'var(--text-muted)',
              border: `1px solid ${isNotificationSaved ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '14px',
              padding: '11px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>{isNotificationSaved ? '✓' : '🔔'}</span>
            {isNotificationSaved ? '카카오톡 채널에서 오픈 알림을 받아보세요' : '이벤트 오픈 시 알림 받기'}
          </button>
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes pulseGlow {
          0% {
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.6);
            transform: scale(0.98);
          }
          100% {
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 38px rgba(56, 189, 248, 0.95);
            transform: scale(1.02);
          }
        }
        @keyframes floatCrystalQuestion {
          0% {
            transform: translateY(0px) scale(0.98);
          }
          100% {
            transform: translateY(-6px) scale(1.02);
          }
        }
      `}</style>
    </div>
  );
}
