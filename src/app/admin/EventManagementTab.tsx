'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { OrbitEvent } from '@/types/event';

interface Props {
  onShowToast: (msg: string) => void;
}

export default function EventManagementTab({ onShowToast }: Props) {
  const [events, setEvents] = useState<OrbitEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<string>('vol01');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState<Partial<OrbitEvent>>({
    volNumber: 'VOL.01',
    slug: 'vol01',
    title: '',
    subtitle: '',
    status: 'upcoming',
    imageUrl: '',
    dDayText: 'PREVIEW · D-DAY EVENT',
    badgeText: 'ORBIT EXCLUSIVE',
    date: '',
    location: '',
    capacity: '',
    content: '',
  });

  // Load events
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/events', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.events)) {
        setEvents(data.events);
        if (data.events.length > 0) {
          const current = data.events.find((e: OrbitEvent) => e.slug === selectedSlug) || data.events[0];
          setSelectedSlug(current.slug);
          setFormData(current);
        }
      }
    } catch (e) {
      onShowToast('이벤트 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectEvent = (event: OrbitEvent) => {
    setSelectedSlug(event.slug);
    setFormData(event);
  };

  const handleAddNewEvent = () => {
    const nextNum = events.length + 1;
    const nextVol = `VOL.${String(nextNum).padStart(2, '0')}`;
    const nextSlug = `vol${String(nextNum).padStart(2, '0')}`;

    const newEv: Partial<OrbitEvent> = {
      volNumber: nextVol,
      slug: nextSlug,
      title: `새로운 ${nextVol} 이벤트`,
      subtitle: '이벤트 라인업 준비 중',
      status: 'upcoming',
      imageUrl: '',
      dDayText: 'COMING SOON',
      badgeText: 'ORBIT SPECIAL',
      date: '추후 안내',
      location: '선정 회원 개별 안내',
      capacity: '선착순 모집',
      content: `${nextVol} 이벤트의 상세 내용을 작성해주세요.`,
    };

    setSelectedSlug(nextSlug);
    setFormData(newEv);
    onShowToast(`새 ${nextVol} 이벤트 편집 모드가 열렸습니다.`);
  };

  // Upload image handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일(JPG, PNG, WebP)만 업로드할 수 있습니다.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('이미지 크기는 최대 10MB까지 가능합니다.');
      return;
    }

    setIsUploading(true);
    try {
      const formPayload = new FormData();
      formPayload.append('files', file);
      formPayload.append('phone', `event_${formData.slug || 'vol'}`);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formPayload,
      });

      const data = await res.json();
      if (data.success && data.urls && data.urls.length > 0) {
        setFormData((prev) => ({ ...prev, imageUrl: data.urls[0] }));
        onShowToast('이벤트 이미지가 업로드되었습니다! (카드에 즉시 반영)');
      } else {
        // Fallback to Base64 data URL if storage upload failed
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
          onShowToast('이벤트 이미지가 적용되었습니다! (로컬 프리뷰)');
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      // Fallback to FileReader
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
        onShowToast('이벤트 이미지가 적용되었습니다.');
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearImage = () => {
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
    onShowToast('이미지가 제거되어 기본 3D 물음표 에셋으로 복원되었습니다.');
  };

  // Save Event
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.slug || !formData.volNumber || !formData.title) {
      alert('볼륨 번호, 슬러그(예: vol01), 이벤트 제목은 필수입니다.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onShowToast(`✓ ${formData.volNumber} 이벤트가 성공적으로 저장되었습니다!`);
        await fetchEvents();
      } else {
        alert(data.error || '이벤트 저장 중 오류가 발생했습니다.');
      }
    } catch (err: any) {
      alert('네트워크 오류로 저장하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Event
  const handleDeleteEvent = async (slug: string) => {
    if (!confirm(`${slug.toUpperCase()} 이벤트를 정말 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/admin/events?slug=${slug}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onShowToast(`${slug.toUpperCase()} 이벤트가 삭제되었습니다.`);
        await fetchEvents();
      } else {
        alert(data.error || '삭제 실패');
      }
    } catch (err) {
      alert('삭제 중 오류 발생');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div
        style={{
          background: 'rgba(30, 41, 59, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🎟️</span> 이벤트 카드 & 상세 페이지 관리
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0', lineHeight: 1.5 }}>
            카드에 들어갈 포스터 이미지를 등록하고 텍스트를 배치합니다. 카드를 누르면 이동할 <strong style={{ color: '#ef4444' }}>/events/vol01</strong> 링크도 자동 생성됩니다.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddNewEvent}
          style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
          }}
        >
          <span>➕</span> 새 이벤트 추가 (VOL.XX)
        </button>
      </div>

      {/* Main Two-Column Workspace */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Event List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📂</span> 등록된 이벤트 목록 ({events.length}개)
          </div>

          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              이벤트 로딩 중...
            </div>
          ) : events.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              등록된 이벤트가 없습니다. &apos;새 이벤트 추가&apos;를 눌러주세요.
            </div>
          ) : (
            events.map((ev) => {
              const isSelected = ev.slug === selectedSlug;
              return (
                <div
                  key={ev.id || ev.slug}
                  onClick={() => handleSelectEvent(ev)}
                  style={{
                    background: isSelected ? 'rgba(30, 41, 59, 0.85)' : 'rgba(20, 26, 43, 0.5)',
                    border: isSelected ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    boxShadow: isSelected ? '0 8px 25px rgba(239, 68, 68, 0.2)' : 'none',
                  }}
                >
                  {/* Thumbnail / Question mark icon */}
                  <div
                    style={{
                      width: '54px',
                      height: '70px',
                      borderRadius: '8px',
                      background: '#09090b',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {ev.imageUrl ? (
                      <img src={ev.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <img src="/images/crystal_question_mark.png" alt="?" style={{ width: '28px', height: 'auto' }} />
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#ef4444',
                          letterSpacing: '1px',
                        }}
                      >
                        {ev.volNumber}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '999px',
                          background:
                            ev.status === 'ongoing'
                              ? 'rgba(56, 189, 248, 0.2)'
                              : ev.status === 'ended'
                              ? 'rgba(148, 163, 184, 0.2)'
                              : 'rgba(52, 211, 153, 0.2)',
                          color:
                            ev.status === 'ongoing'
                              ? '#38bdf8'
                              : ev.status === 'ended'
                              ? '#94a3b8'
                              : '#34d399',
                        }}
                      >
                        {ev.status === 'ongoing' ? '진행중' : ev.status === 'ended' ? '종료' : '오픈 예정'}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#f8fafc',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {ev.title}
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      링크: <span style={{ color: '#94a3b8' }}>/events/{ev.slug}</span>
                    </div>
                  </div>

                  {/* Open Link */}
                  <Link
                    href={`/events/${ev.slug}`}
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#cbd5e1',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      fontSize: '12px',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      flexShrink: 0,
                    }}
                    title="새 탭에서 페이지 열기"
                  >
                    <span>↗</span> 열기
                  </Link>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Editor & Live Card Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card Live Preview Box */}
          <div
            style={{
              background: 'rgba(20, 26, 43, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>👁️</span> 카드 실시간 렌더링 미리보기
            </div>

            {/* Exact Miniature of Main Event Card */}
            <div
              style={{
                position: 'relative',
                width: '260px',
                height: '340px',
                borderRadius: '18px',
                background: 'linear-gradient(165deg, #18181b 0%, #0c0a09 45%, #000000 100%)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 20px 45px rgba(0, 0, 0, 0.8), 0 0 25px rgba(239, 68, 68, 0.25)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '14px 12px',
                boxSizing: 'border-box',
              }}
            >
              {/* Background Image if uploaded */}
              {formData.imageUrl && (
                <>
                  <img
                    src={formData.imageUrl}
                    alt=""
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
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 35%, rgba(0,0,0,0.85) 100%)',
                      zIndex: 1,
                    }}
                  />
                </>
              )}

              {/* Top Serial & Dots (In Red) */}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '6px',
                  borderBottom: '1px solid rgba(239, 68, 68, 0.35)',
                  zIndex: 2,
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: '#ef4444',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  ORBIT EVENT · {formData.volNumber || 'VOL.01'}
                </span>
                <div style={{ display: 'flex', gap: '3px' }}>
                  <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#ef4444' }} />
                  <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.65)' }} />
                  <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.35)' }} />
                </div>
              </div>

              {/* Center Content: Question mark or image badge */}
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
                {!formData.imageUrl ? (
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div
                      style={{
                        position: 'absolute',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.5) 0%, transparent 70%)',
                        filter: 'blur(14px)',
                      }}
                    />
                    <img
                      src="/images/crystal_question_mark.png"
                      alt="?"
                      style={{
                        position: 'relative',
                        width: '74px',
                        height: 'auto',
                        filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.8)) drop-shadow(0 0 16px rgba(56,189,248,0.7))',
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid rgba(239, 68, 68, 0.5)',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      color: '#ef4444',
                      fontSize: '10px',
                      fontWeight: 700,
                    }}
                  >
                    등록된 포스터 이미지 적용됨
                  </div>
                )}
              </div>

              {/* Sleeve Mockup Overlay */}
              <div
                style={{
                  position: 'relative',
                  background: 'rgba(255, 255, 255, 0.12)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderTop: '2px solid rgba(255, 255, 255, 0.5)',
                  borderRadius: '12px',
                  padding: '10px 8px',
                  textAlign: 'center',
                  zIndex: 3,
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 900,
                    color: '#ef4444',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    fontFamily: '"Outfit", sans-serif',
                  }}
                >
                  comming soon
                </div>
                <div style={{ fontSize: '10.5px', color: '#f87171', marginTop: '4px', fontWeight: 600 }}>
                  {formData.title || '비밀 인연 매칭 프로젝트'}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '12px', textAlign: 'center' }}>
              {formData.imageUrl
                ? '✓ 포스터 이미지가 배경에 들어가며, 텍스트가 이미지 위에 선명하게 렌더링됩니다.'
                : '✓ 이미지가 없을 때는 현재 3D 크리스탈 물음표 에셋이 자동으로 유지됩니다.'}
            </p>
          </div>

          {/* Edit Form */}
          <form
            onSubmit={handleSaveEvent}
            style={{
              background: 'rgba(30, 41, 59, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
              ✏️ {formData.volNumber} 이벤트 정보 설정
            </div>

            {/* Image Upload Box */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px dashed rgba(239, 68, 68, 0.4)',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🖼️</span> 카드 포스터 이미지 등록 (최대 10MB)
              </label>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageFileChange}
                  disabled={isUploading}
                  style={{
                    fontSize: '12px',
                    color: '#cbd5e1',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                />

                {isUploading && <span style={{ fontSize: '12px', color: '#38bdf8' }}>업로드 중...</span>}

                {formData.imageUrl && (
                  <button
                    type="button"
                    onClick={handleClearImage}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    물음표 에셋으로 복원
                  </button>
                )}
              </div>

              {formData.imageUrl && (
                <div style={{ fontSize: '11px', color: '#94a3b8', wordBreak: 'break-all' }}>
                  현재 이미지 URL: <span style={{ color: '#60a5fa' }}>{formData.imageUrl.substring(0, 60)}...</span>
                </div>
              )}
            </div>

            {/* Volume & Slug Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px', display: 'block' }}>
                  볼륨 번호
                </label>
                <input
                  type="text"
                  value={formData.volNumber || ''}
                  onChange={(e) => setFormData({ ...formData, volNumber: e.target.value })}
                  placeholder="예: VOL.01"
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px', display: 'block' }}>
                  페이지 URL 슬러그 (/events/...)
                </label>
                <input
                  type="text"
                  value={formData.slug || ''}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                  placeholder="예: vol01"
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px', display: 'block' }}>
                이벤트 제목
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="예: 비밀 인연 매칭 프로젝트"
                required
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#f8fafc',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px', display: 'block' }}>
                서브 타이틀 (간략한 설명)
              </label>
              <input
                type="text"
                value={formData.subtitle || ''}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="예: 곧 첫 번째 이벤트가 공개됩니다"
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#f8fafc',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Status & Ribbon Text */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px', display: 'block' }}>
                  이벤트 상태
                </label>
                <select
                  value={formData.status || 'upcoming'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="upcoming">오픈 예정 (Upcoming)</option>
                  <option value="ongoing">진행중 (Ongoing)</option>
                  <option value="ended">종료 (Ended)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px', display: 'block' }}>
                  하단 리본 문구
                </label>
                <input
                  type="text"
                  value={formData.dDayText || ''}
                  onChange={(e) => setFormData({ ...formData, dDayText: e.target.value })}
                  placeholder="예: PREVIEW · D-DAY EVENT"
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Date, Location, Capacity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px', display: 'block' }}>
                  일시 / 오픈 일정
                </label>
                <input
                  type="text"
                  value={formData.date || ''}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  placeholder="예: 2026.11.01 (토) 18:00"
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px', display: 'block' }}>
                  장소 및 방식
                </label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="예: 서울 강남 시크릿 라운지"
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#f8fafc',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Description / Content for Event Detail Page */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px', display: 'block' }}>
                이벤트 상세 페이지 내용
              </label>
              <textarea
                rows={4}
                value={formData.content || formData.description || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value, description: e.target.value })}
                placeholder="이벤트의 상세 소개, 참가 조건, 진행 방식 등을 입력하세요."
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#f8fafc',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  lineHeight: 1.6,
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)',
                }}
              >
                {isSaving ? '저장 중...' : `💾 ${formData.volNumber} 이벤트 카드 및 상세페이지 저장하기`}
              </button>

              {events.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteEvent(formData.slug || '')}
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  삭제
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
