'use client';

import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface ProfileRecord {
  id: string;
  name: string;
  nickname: string;
  phone: string;
  gender: string;
  age: string | number;
  height: number;
  location: string;
  preferred_animals: string[];
  preferred_appearance_detail?: string;
  preferred_partner_detail: string;
  self_intro: string;
  created_at: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function maskPhoneNumber(phone: string): string {
  const digits = String(phone || '').replace(/[^0-9]/g, '');
  if (digits.length >= 10) {
    const middleFirst = digits[3] || '0';
    return `010-${middleFirst}xxx-xxxx`;
  }
  return '010-0xxx-xxxx';
}

export default function AdminProfileModal({ isOpen, onClose }: Props) {
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    fetchProfiles();

    // Setup Supabase Realtime WebSocket subscription
    const client = supabase;
    if (client && isSupabaseConfigured) {
      setIsRealtimeActive(true);
      const channel = client
        .channel('realtime:profiles')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          (payload) => {
            console.log('⚡ 실시간 Supabase 변경 감지:', payload);
            fetchProfiles();
          }
        )
        .subscribe();

      return () => {
        setIsRealtimeActive(false);
        client.removeChannel(channel);
      };
    }
  }, [isOpen]);

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch from Next.js server API
      const res = await fetch('/api/profile', { cache: 'no-store' });
      const json = await res.json();

      let serverList: ProfileRecord[] = [];
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        serverList = json.data;
      }

      // 2. Also merge any local storage records
      const localStored = localStorage.getItem('submitted_profiles');
      const localList: ProfileRecord[] = localStored ? JSON.parse(localStored) : [];

      // Combine by ID without duplicates
      const map = new Map<string, ProfileRecord>();
      [...serverList, ...localList].forEach((p) => {
        if (p.id) map.set(p.id, p);
      });

      setProfiles(Array.from(map.values()));
    } catch (err) {
      console.error('Failed to load profiles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#131627',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                📋 접수된 프로필 목록 ({profiles.length}건)
              </h3>
              {isRealtimeActive && (
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                  실시간 연동 중
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
              Supabase 데이터베이스 및 Vercel 실시간 동기화 상태입니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '22px',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {isLoading && profiles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
              Supabase에서 실시간 데이터를 불러오는 중...
            </div>
          ) : profiles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
              아직 등록된 프로필이 없습니다. 첫 프로필을 등록해보세요!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {profiles.map((p) => {
                const isExpanded = expandedId === p.id;

                return (
                  <div
                    key={p.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '16px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                            {p.nickname} ({p.name})
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '20px',
                              background: p.gender === '남성' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(236, 72, 153, 0.2)',
                              color: p.gender === '남성' ? '#93c5fd' : '#f9a8d4',
                              fontWeight: 600,
                            }}
                          >
                            {p.gender} · {String(p.age).endsWith('년생') ? p.age : `${p.age}년생`}
                          </span>
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                          📍 {p.location} · 📏 {p.height}cm · 📞 {maskPhoneNumber(p.phone)}
                        </div>
                      </div>
                      <span style={{ color: 'var(--text-dim)', fontSize: '13px' }}>
                        {isExpanded ? '▲ 닫기' : '▼ 상세보기'}
                      </span>
                    </div>

                    {/* Detailed Accordion */}
                    {isExpanded && (
                      <div
                        style={{
                          marginTop: '14px',
                          paddingTop: '14px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                          fontSize: '13px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                        }}
                      >
                        <div>
                          <b style={{ color: '#ff85a1' }}>선호 동물상:</b>{' '}
                          {Array.isArray(p.preferred_animals) && p.preferred_animals.length > 0
                            ? p.preferred_animals.join(', ')
                            : '없음 / 상관없음'}
                        </div>
                        {p.preferred_appearance_detail && (
                          <div>
                            <b style={{ color: '#ec4899' }}>원하는 외적 구체상:</b>
                            <p style={{ marginTop: '4px', color: 'var(--text-main)', lineHeight: 1.5, background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                              {p.preferred_appearance_detail}
                            </p>
                          </div>
                        )}
                        <div>
                          <b style={{ color: '#8b5cf6' }}>선호하는 이성 (자세히):</b>
                          <p style={{ marginTop: '4px', color: 'var(--text-main)', lineHeight: 1.5, background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                            {p.preferred_partner_detail}
                          </p>
                        </div>
                        <div>
                          <b style={{ color: '#3b82f6' }}>본인은 어떤 사람인가 (자세히):</b>
                          <p style={{ marginTop: '4px', color: 'var(--text-main)', lineHeight: 1.5, background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                            {p.self_intro}
                          </p>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'right' }}>
                          접수시간: {p.created_at ? new Date(p.created_at).toLocaleString('ko-KR') : '-'}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            className="btn-prev"
            onClick={fetchProfiles}
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            🔄 새로고침
          </button>

          <button
            type="button"
            className="btn-prev"
            onClick={onClose}
            style={{ padding: '8px 18px', fontSize: '13.5px' }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
