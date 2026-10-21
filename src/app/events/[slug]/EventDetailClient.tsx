'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { OrbitEvent } from '@/types/event';

interface Props {
  event: OrbitEvent;
}

const formatVolEnd = (vol?: string) => {
  const v = (vol || 'VOL.1').trim();
  if (/end$/i.test(v)) return v.toUpperCase();
  const normalized = v.replace(/vol\.?\s*0*/i, 'VOL.').toUpperCase();
  return `${normalized} END`;
};

export default function EventDetailClient({ event: initialEvent }: Props) {
  const [event, setEvent] = useState<OrbitEvent>(initialEvent);
  const [isNotified, setIsNotified] = useState(false);
  const [copied, setCopied] = useState(false);

  // Application Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [showSuccessCard, setShowSuccessCard] = useState(false);

  // Form Fields
  const [appName, setAppName] = useState('');
  const [appPhone, setAppPhone] = useState('');
  const [appGender, setAppGender] = useState<'남성' | '여성'>('남성');
  const [appAge, setAppAge] = useState('');
  const [appMemo, setAppMemo] = useState('');

  // 1. Fetch fresh event data & check applied status on mount
  useEffect(() => {
    // Check local storage for existing application
    if (typeof window !== 'undefined') {
      const storedApplied = localStorage.getItem(`applied_event_${event.slug}`);
      if (storedApplied === 'true') {
        setIsApplied(true);
      }

      // Pre-fill from existing profile/session if available
      const savedPhone = localStorage.getItem('orbit_auth_phone') || '';
      if (savedPhone) setAppPhone(savedPhone);

      const savedDraft = localStorage.getItem('profile_form_draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed.name && !appName) setAppName(parsed.name);
          if (parsed.gender) setAppGender(parsed.gender === 'female' ? '여성' : '남성');
          if (parsed.age) setAppAge(String(parsed.age));
        } catch (e) {
          // ignore
        }
      }
    }

    // Refresh event status from backend
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.events)) {
          const fresh = data.events.find((e: OrbitEvent) => e.slug === event.slug);
          if (fresh) {
            setEvent(fresh);
          }
        }
      })
      .catch(() => {
        // Fallback to initial
      });
  }, [event.slug]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePhoneChange = (val: string) => {
    const numbers = val.replace(/[^0-9]/g, '');
    let formatted = numbers;
    if (numbers.length > 3 && numbers.length <= 7) {
      formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length > 7) {
      formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
    setAppPhone(formatted);
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError('');

    if (!appName.trim()) {
      setApplyError('이름(성명)을 입력해주세요.');
      return;
    }
    if (!appPhone.trim() || appPhone.replace(/[^0-9]/g, '').length < 10) {
      setApplyError('유효한 휴대폰 번호를 입력해주세요.');
      return;
    }

    setIsApplying(true);
    try {
      const res = await fetch('/api/events/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventSlug: event.slug,
          name: appName.trim(),
          phone: appPhone.trim(),
          gender: appGender,
          age: appAge.trim(),
          memo: appMemo.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsApplied(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`applied_event_${event.slug}`, 'true');
          localStorage.setItem('orbit_auth_phone', appPhone.trim());
        }
        setIsApplyModalOpen(false);
        setShowSuccessCard(true);
      } else {
        setApplyError(data.error || '참가 신청 처리 중 오류가 발생했습니다.');
      }
    } catch (err) {
      setApplyError('네트워크 통신 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsApplying(false);
    }
  };

  const isEventOpen = event.status === 'ongoing';
  const isEventEnded = event.status === 'ended';

  const statusLabel =
    event.status === 'ongoing'
      ? '참가 신청 접수 중 (NOW OPEN)'
      : isEventEnded
      ? `이벤트 종료 (${formatVolEnd(event.volNumber)})`
      : '오픈 대기중 (COMMING SOON)';
  const statusColor =
    event.status === 'ongoing' ? '#34d399' : isEventEnded ? '#94a3b8' : '#ef4444';
  const statusBg =
    event.status === 'ongoing'
      ? 'rgba(16, 185, 129, 0.15)'
      : isEventEnded
      ? 'rgba(148, 163, 184, 0.15)'
      : 'rgba(239, 68, 68, 0.15)';

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
          <span>←</span> 메인 홈으로
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
              background: isEventOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: isEventOpen ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(239, 68, 68, 0.35)',
              padding: '4px 14px',
              borderRadius: '999px',
              color: isEventOpen ? '#34d399' : '#ef4444',
              fontSize: '11.5px',
              fontWeight: 800,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginBottom: '14px',
            }}
          >
            <span>{isEventOpen ? '🟢' : '🎟️'}</span> ORBIT EVENT · {event.volNumber} {isEventOpen ? '· OPEN' : ''}
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
                fontSize: '12px',
                fontWeight: 700,
                padding: '5px 14px',
                borderRadius: '999px',
              }}
            >
              ● {statusLabel}
            </span>
          </div>
        </div>

        {/* Success Alert Card (if just applied) */}
        {showSuccessCard && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.35) 100%)',
              border: '1px solid rgba(52, 211, 153, 0.6)',
              borderRadius: '20px',
              padding: '24px 20px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.25)',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#34d399', margin: '0 0 8px' }}>
              참가 신청이 성공적으로 접수되었습니다!
            </h3>
            <p style={{ fontSize: '13.5px', color: '#e2e8f0', lineHeight: 1.6, margin: 0 }}>
              <strong>{appName || '회원'}</strong>님의 신청 내역이 Orbit 보안 관리 시스템에 안전하게 기록되었습니다.<br />
              성비 조율 및 매칭 선정이 완료되면 등록하신 번호(<strong>{appPhone}</strong>)로 개별 안내 문자가 발송됩니다.
            </p>
          </div>
        )}

        {/* Hero Card / Poster Display */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            borderRadius: '24px',
            background: 'linear-gradient(165deg, #18181b 0%, #09090b 100%)',
            border: isEventOpen ? '1px solid rgba(52, 211, 153, 0.35)' : '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: isEventOpen
              ? '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(16, 185, 129, 0.25)'
              : '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(239, 68, 68, 0.15)',
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
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: isEventOpen ? '#34d399' : '#ef4444',
                    letterSpacing: '1.5px',
                  }}
                >
                  {event.volNumber}
                </span>
                <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>
                  {isEventOpen ? '🟢 OFFICIAL NOW OPEN' : isEventEnded ? `🏁 ${formatVolEnd(event.volNumber)}` : 'OFFICIAL EVENT POSTER'}
                </span>
              </div>
            </div>
          ) : (
            /* Coming Soon or Now Open 3D Crystal Question Mark Hero Display */
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
                    background: isEventOpen
                      ? 'radial-gradient(circle, rgba(52, 211, 153, 0.55) 0%, transparent 70%)'
                      : isEventEnded
                      ? 'radial-gradient(circle, rgba(148, 163, 184, 0.35) 0%, transparent 70%)'
                      : 'radial-gradient(circle, rgba(56, 189, 248, 0.5) 0%, transparent 70%)',
                    filter: 'blur(20px)',
                  }}
                />
                <img
                  src="/images/crystal_question_mark.png"
                  alt={isEventOpen ? 'Now Open' : isEventEnded ? 'Event Ended' : 'Coming Soon'}
                  style={{
                    position: 'relative',
                    width: '100px',
                    height: 'auto',
                    objectFit: 'contain',
                    filter: isEventOpen
                      ? 'drop-shadow(0 15px 30px rgba(0,0,0,0.8)) drop-shadow(0 0 25px rgba(52,211,153,0.7))'
                      : isEventEnded
                      ? 'drop-shadow(0 15px 30px rgba(0,0,0,0.8)) grayscale(0.7)'
                      : 'drop-shadow(0 15px 30px rgba(0,0,0,0.8)) drop-shadow(0 0 25px rgba(56,189,248,0.7))',
                  }}
                />
              </div>

              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 900,
                  color: isEventOpen ? '#34d399' : isEventEnded ? '#94a3b8' : '#ef4444',
                  letterSpacing: '5px',
                  textTransform: 'uppercase',
                  fontFamily: '"Outfit", sans-serif',
                  textShadow: isEventOpen
                    ? '0 2px 10px rgba(0, 0, 0, 0.8), 0 0 16px rgba(52, 211, 153, 0.8)'
                    : isEventEnded
                    ? '0 2px 10px rgba(0, 0, 0, 0.8)'
                    : '0 2px 10px rgba(0, 0, 0, 0.8), 0 0 16px rgba(239, 68, 68, 0.7)',
                }}
              >
                {isEventOpen ? 'NOW OPEN' : isEventEnded ? formatVolEnd(event.volNumber) : 'comming soon'}
              </div>
              <p style={{ fontSize: '12.5px', color: isEventOpen ? '#a7f3d0' : isEventEnded ? '#cbd5e1' : '#f87171', marginTop: '8px' }}>
                {isEventOpen
                  ? '공식 오픈되었습니다! 아래 신청하기 버튼을 눌러 참가를 신청하세요.'
                  : isEventEnded
                  ? '본 이벤트는 종료되었습니다. 다음 볼륨 오픈을 기다려주세요!'
                  : '관리자 페이지에서 포스터 이미지가 등록되면 이곳에 고화질로 표시됩니다.'}
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
                {event.date || (isEventOpen ? '현재 참가 접수 진행 중' : '추후 공개 예정')}
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
          {isEventOpen ? (
            /* EVENT IS OPEN -> APPLICATION FLOW */
            isApplied ? (
              <button
                type="button"
                disabled
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.3) 100%)',
                  color: '#34d399',
                  border: '1px solid rgba(52, 211, 153, 0.5)',
                  borderRadius: '16px',
                  padding: '16px',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.2)',
                }}
              >
                <span>✓</span> 참가 신청 완료됨 (접수 완료)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(true)}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '16px',
                  fontSize: '15.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                }}
              >
                <span>🚀</span> 지금 이벤트 신청하기 ({event.volNumber})
              </button>
            )
          ) : isEventEnded ? (
            /* EVENT ENDED */
            <button
              type="button"
              disabled
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#94a3b8',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                borderRadius: '16px',
                padding: '16px',
                fontSize: '15px',
                fontWeight: 800,
                cursor: 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>🏁</span> 이벤트가 마감/종료되었습니다 ({formatVolEnd(event.volNumber)})
            </button>
          ) : (
            /* EVENT NOT OPEN YET -> NOTIFICATION / COMING SOON */
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
          )}

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

      {/* ======================================================== */}
      {/* APPLICATION MODAL POPUP                                  */}
      {/* ======================================================== */}
      {isApplyModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => !isApplying && setIsApplyModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '460px',
              background: 'linear-gradient(165deg, #1e293b 0%, #0f172a 100%)',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              borderRadius: '24px',
              padding: '30px 24px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(16, 185, 129, 0.2)',
              position: 'relative',
              boxSizing: 'border-box',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#34d399',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  ORBIT EVENT · {event.volNumber}
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: '4px 0 0' }}>
                  이벤트 참가 신청서
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                disabled={isApplying}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#94a3b8',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                ✕
              </button>
            </div>

            {applyError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  color: '#fca5a5',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  fontSize: '12.5px',
                  marginBottom: '16px',
                }}
              >
                ⚠️ {applyError}
              </div>
            )}

            <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>
                  이름 (성명) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 홍길동"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>
                  연락처 (휴대폰 번호) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="010-0000-0000"
                  value={appPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Gender & Age */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>
                    성별 <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {(['남성', '여성'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setAppGender(g)}
                        style={{
                          flex: 1,
                          padding: '10px 0',
                          borderRadius: '10px',
                          border: appGender === g ? '1px solid #34d399' : '1px solid rgba(255, 255, 255, 0.12)',
                          background: appGender === g ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.7)',
                          color: appGender === g ? '#34d399' : '#94a3b8',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>
                    나이
                  </label>
                  <input
                    type="text"
                    placeholder="예: 28세"
                    value={appAge}
                    onChange={(e) => setAppAge(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Memo */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '5px' }}>
                  신청 한 줄 메시지 / 기대평 (선택)
                </label>
                <textarea
                  placeholder="참가 계기나 선호하시는 분의 스타일을 적어주세요."
                  rows={2}
                  value={appMemo}
                  onChange={(e) => setAppMemo(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                    lineHeight: 1.5,
                  }}
                />
              </div>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  fontSize: '11.5px',
                  color: '#94a3b8',
                  lineHeight: 1.5,
                }}
              >
                🔒 작성하신 신청 정보는 본인 확인 및 매칭 선정에만 안전하게 사용되며 외부에 공개되지 않습니다.
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  disabled={isApplying}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#94a3b8',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '13px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  취소
                </button>

                <button
                  type="submit"
                  disabled={isApplying}
                  style={{
                    flex: 2,
                    background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '13px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: isApplying ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  {isApplying ? '신청서 접수 중...' : '✨ 참가 신청 완료하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
