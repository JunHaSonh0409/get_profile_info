'use client';

import React, { useEffect } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'EVENTS' | 'PROFILE';
  onSelectTab: (tab: 'EVENTS' | 'PROFILE') => void;
}

export default function NavigationDrawer({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
}: Props) {
  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
      }}
    >
      {/* Dimmed Blurred Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(5, 7, 14, 0.72)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          animation: 'drawerBackdropFade 0.25s ease-out forwards',
        }}
      />

      {/* Slide-out Drawer Panel (From Left) */}
      <aside
        role="dialog"
        aria-label="서비스 메뉴"
        style={{
          position: 'relative',
          width: 'min(330px, 84vw)',
          height: '100%',
          background: 'linear-gradient(180deg, #101526 0%, #0a0d18 100%)',
          borderRight: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '16px 0 50px rgba(0, 0, 0, 0.75)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 20px',
          animation: 'drawerSlideLeft 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          zIndex: 10000,
        }}
      >
        {/* Top: Header & Menu Navigation */}
        <div>
          {/* Drawer Top Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ff4370 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  boxShadow: '0 4px 16px rgba(255, 67, 112, 0.4)',
                }}
              >
                💫
              </div>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
                  Orbit <span style={{ color: '#ff4370' }}>Menu</span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', letterSpacing: '-0.2px', marginTop: '1px' }}>
                  우주 모든 인연이 만날 때까지
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="메뉴 닫기"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              ✕
            </button>
          </div>

          {/* Section Category Title */}
          <div
            style={{
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#64748b',
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              marginBottom: '12px',
              paddingLeft: '4px',
            }}
          >
            Navigation
          </div>

          {/* Menu Items List (Strict Order: 1. 진행중 이벤트, 2. 프로필) */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* 1. 진행중 이벤트 (Active Events - TOP) */}
            <button
              type="button"
              onClick={() => {
                onSelectTab('EVENTS');
                onClose();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: '16px',
                border:
                  activeTab === 'EVENTS'
                    ? '1.5px solid #38bdf8'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                background:
                  activeTab === 'EVENTS'
                    ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.22) 0%, rgba(30, 41, 59, 0.6) 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                boxShadow:
                  activeTab === 'EVENTS'
                    ? '0 8px 24px rgba(14, 165, 233, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
                    : 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.35)',
                  }}
                >
                  🎟️
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: activeTab === 'EVENTS' ? '#38bdf8' : '#f8fafc',
                      }}
                    >
                      진행중 이벤트
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        background: '#0ea5e9',
                        color: '#fff',
                        padding: '1px 6px',
                        borderRadius: '999px',
                        letterSpacing: '0.5px',
                      }}
                    >
                      NEW
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    특별 매칭 이벤트 & 커밍순
                  </div>
                </div>
              </div>

              {activeTab === 'EVENTS' ? (
                <span style={{ fontSize: '14px', color: '#38bdf8' }}>●</span>
              ) : (
                <span style={{ fontSize: '16px', color: '#475569' }}>›</span>
              )}
            </button>

            {/* 2. 프로필 (Profile - SECOND) */}
            <button
              type="button"
              onClick={() => {
                onSelectTab('PROFILE');
                onClose();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: '16px',
                border:
                  activeTab === 'PROFILE'
                    ? '1.5px solid #ff4370'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                background:
                  activeTab === 'PROFILE'
                    ? 'linear-gradient(135deg, rgba(255, 67, 112, 0.2) 0%, rgba(30, 41, 59, 0.6) 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                boxShadow:
                  activeTab === 'PROFILE'
                    ? '0 8px 24px rgba(255, 67, 112, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
                    : 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #ff4370 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    boxShadow: '0 4px 12px rgba(255, 67, 112, 0.35)',
                  }}
                >
                  👤
                </div>
                <div>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: activeTab === 'PROFILE' ? '#ff4370' : '#f8fafc',
                    }}
                  >
                    프로필
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    내 프로필 카드 및 등록 관리
                  </div>
                </div>
              </div>

              {activeTab === 'PROFILE' ? (
                <span style={{ fontSize: '14px', color: '#ff4370' }}>●</span>
              ) : (
                <span style={{ fontSize: '16px', color: '#475569' }}>›</span>
              )}
            </button>
          </nav>
        </div>

        {/* Bottom Footer Info in Drawer */}
        <div
          style={{
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '11px',
            color: '#64748b',
          }}
        >
          <div>✨ Orbit Profile & Event Portal</div>
          <div>© 2026 Orbit · 감성 매칭 플랫폼</div>
        </div>
      </aside>

      {/* Drawer Animations Style */}
      <style jsx>{`
        @keyframes drawerBackdropFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes drawerSlideLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
