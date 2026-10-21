'use client';

import React, { useState } from 'react';

interface Props {
  onGoToProfile: () => void;
}

export default function EventsSection({ onGoToProfile }: Props) {
  const [isPulled, setIsPulled] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'ongoing' | 'upcoming'>('all');
  const [isNotificationSaved, setIsNotificationSaved] = useState(false);

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
      <div style={{ textAlign: 'center', marginBottom: '28px', width: '100%' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(14, 165, 233, 0.15)',
            border: '1px solid rgba(14, 165, 233, 0.35)',
            padding: '4px 12px',
            borderRadius: '999px',
            color: '#38bdf8',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            marginBottom: '12px',
          }}
        >
          <span>🎟️</span> ORBIT EXCLUSIVE EVENT
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.5px', margin: 0 }}>
          진행중 <span style={{ color: '#38bdf8' }}>이벤트</span>
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
          Orbit 회원들을 위한 특별한 오프라인 & 온라인 인연 매칭 라인업
        </p>

        {/* Filter Pills */}
        <div
          style={{
            display: 'inline-flex',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '999px',
            padding: '4px',
            gap: '4px',
            marginTop: '18px',
          }}
        >
          {(
            [
              { id: 'all', label: '전체 (1)' },
              { id: 'ongoing', label: '진행중 (0)' },
              { id: 'upcoming', label: '오픈 예정 (1)' },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              style={{
                background: activeFilter === filter.id ? '#0284c7' : 'transparent',
                color: activeFilter === filter.id ? '#fff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '999px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FROSTED GLASS POCKET SLEEVE ASSET (Inspired by user reference image)     */}
      {/* ========================================================================= */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          padding: '40px 0 30px',
          perspective: '1000px',
        }}
      >
        {/* Left Ghost Pocket Preview (Aesthetic shelf context) */}
        <div
          style={{
            position: 'absolute',
            left: '-20px',
            width: '90px',
            height: '240px',
            opacity: 0.25,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          {/* Ghost Card Peek */}
          <div
            style={{
              height: '180px',
              background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
              borderRadius: '16px 16px 0 0',
              boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
            }}
          />
          {/* Ghost Sleeve */}
          <div
            style={{
              height: '140px',
              marginTop: '-100px',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '0 0 16px 16px',
            }}
          />
        </div>

        {/* Right Ghost Pocket Preview */}
        <div
          style={{
            position: 'absolute',
            right: '-20px',
            width: '90px',
            height: '240px',
            opacity: 0.25,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          {/* Ghost Card Peek */}
          <div
            style={{
              height: '180px',
              background: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
              borderRadius: '16px 16px 0 0',
              boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
            }}
          />
          {/* Ghost Sleeve */}
          <div
            style={{
              height: '140px',
              marginTop: '-100px',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '0 0 16px 16px',
            }}
          />
        </div>

        {/* Center Main Event Pocket Container */}
        <div
          onMouseEnter={() => setIsPulled(true)}
          onMouseLeave={() => setIsPulled(false)}
          onClick={() => setIsPulled(!isPulled)}
          style={{
            position: 'relative',
            width: 'min(300px, 80vw)',
            height: '420px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          {/* 1. Backing Pocket Slot */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              height: '240px',
              background: 'rgba(10, 14, 26, 0.85)',
              borderRadius: '0 0 24px 24px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)',
            }}
          />

          {/* 2. THE EVENT CARD (Black background with 3D crystal question mark) */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              width: '92%',
              height: '380px',
              borderRadius: '20px 20px 14px 14px',
              background: 'linear-gradient(165deg, #18181b 0%, #0c0a09 45%, #000000 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: isPulled
                ? '0 24px 50px rgba(0, 0, 0, 0.85), 0 0 35px rgba(239, 68, 68, 0.25)'
                : '0 12px 30px rgba(0, 0, 0, 0.75)',
              transform: isPulled ? 'translateY(-48px)' : 'translateY(0)',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              padding: '18px 14px',
              boxSizing: 'border-box',
              zIndex: 2,
            }}
          >
            {/* Top Serial & Dots (Asset Style - Red) */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '8px',
                borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#ef4444',
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                }}
              >
                ORBIT EVENT · VOL.01
              </span>
              <div style={{ display: 'flex', gap: '3px' }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.65)' }} />
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.35)' }} />
              </div>
            </div>

            {/* Upper Content: 3D Crystal Question Mark Asset (Hero Position) */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '10px',
                width: '100%',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'floatCrystalQuestion 3.2s infinite ease-in-out alternate',
                }}
              >
                {/* Backing Ambient Cyan Glow to make 3D crystal pop on black */}
                <div
                  style={{
                    position: 'absolute',
                    width: '110px',
                    height: '110px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(56, 189, 248, 0.5) 0%, rgba(14, 165, 233, 0.15) 50%, transparent 75%)',
                    filter: 'blur(16px)',
                    zIndex: 0,
                    pointerEvents: 'none',
                  }}
                />

                <img
                  src="/images/crystal_question_mark.png"
                  alt="Coming Soon Event"
                  style={{
                    position: 'relative',
                    width: '94px',
                    height: 'auto',
                    maxHeight: '140px',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 22px rgba(56, 189, 248, 0.75))',
                    zIndex: 1,
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          {/* 3. FROSTED GLASS POCKET (Front Sleeve - texts rendered clearly ON the case) */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              width: '100%',
              height: '230px',
              background: 'rgba(255, 255, 255, 0.10)',
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              borderTop: '2.5px solid rgba(255, 255, 255, 0.55)',
              borderRadius: '0 0 24px 24px',
              boxShadow:
                '0 20px 45px rgba(0, 0, 0, 0.65), inset 0 1px 3px rgba(255, 255, 255, 0.35)',
              pointerEvents: 'none',
              zIndex: 3,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '24px 18px 16px',
              boxSizing: 'border-box',
              textAlign: 'center',
            }}
          >
            {/* Center Content: Written ON the Card Case directly below '?' */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '12px',
                width: '100%',
              }}
            >
              {/* Exact 'comming soon' Typography in Red ON Card Case */}
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  color: '#ef4444',
                  letterSpacing: '4.5px',
                  textTransform: 'uppercase',
                  fontFamily: '"Outfit", sans-serif',
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.9), 0 0 18px rgba(239, 68, 68, 0.75)',
                }}
              >
                comming soon
              </div>

              <div
                style={{
                  fontSize: '12px',
                  color: '#f87171',
                  marginTop: '10px',
                  lineHeight: 1.5,
                  fontWeight: 600,
                  textShadow: '0 1px 6px rgba(0, 0, 0, 0.8)',
                }}
              >
                비밀 인연 매칭 프로젝트<br />
                <span style={{ fontSize: '10.5px', color: '#fca5a5', opacity: 0.95 }}>
                  곧 첫 번째 이벤트가 공개됩니다
                </span>
              </div>
            </div>

            {/* Bottom Graphic Ribbon in Red ON Card Case */}
            <div
              style={{
                width: '100%',
                textAlign: 'center',
                paddingTop: '10px',
                borderTop: '1px solid rgba(239, 68, 68, 0.35)',
                fontSize: '10.5px',
                color: '#ef4444',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textShadow: '0 1px 8px rgba(0, 0, 0, 0.8)',
              }}
            >
              PREVIEW · D-DAY EVENT
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Micro-hint */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#38bdf8',
          fontSize: '12px',
          fontWeight: 600,
          marginBottom: '24px',
          cursor: 'pointer',
          padding: '6px 14px',
          borderRadius: '999px',
          background: 'rgba(14, 165, 233, 0.1)',
          border: '1px solid rgba(14, 165, 233, 0.2)',
        }}
        onClick={() => setIsPulled(!isPulled)}
      >
        <span>{isPulled ? '👇 카드를 다시 넣으려면 터치' : '👆 카드를 터치하여 위로 꺼내보세요'}</span>
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
                background: '#0284c7',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '6px',
              }}
            >
              EVENT #01
            </span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
              비밀 인연 매칭 프로젝트
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
            오픈 준비 중
          </span>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
          회원님들의 취향과 가치관을 기반으로 준비 중인 첫 번째 공식 매칭 이벤트입니다.
          프로필을 미리 등록해두시면 이벤트 오픈 시 가장 먼저 우선 신청 혜택을 받으실 수 있습니다.
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
            onClick={() => setIsNotificationSaved(true)}
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
            {isNotificationSaved ? '이벤트 오픈 알림이 예약되었습니다' : '이벤트 오픈 시 알림 받기'}
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
            transform: translateY(-5px) scale(1.02);
          }
        }
      `}</style>
    </div>
  );
}
