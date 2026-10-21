'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { OrbitEvent } from '@/types/event';
import { EventApplication, EventApplicationStats } from '@/types/application';

interface Props {
  onShowToast: (msg: string) => void;
}

export default function EventOpenManagementTab({ onShowToast }: Props) {
  const [events, setEvents] = useState<OrbitEvent[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('vol01');
  const [isLoading, setIsLoading] = useState(true);

  // Applicants & Stats
  const [applications, setApplications] = useState<EventApplication[]>([]);
  const [stats, setStats] = useState<EventApplicationStats | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedSlug) {
      fetchApplications(selectedSlug);
    }
  }, [selectedSlug]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/events', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.events)) {
        setEvents(data.events);
        if (data.events.length > 0 && !selectedSlug) {
          setSelectedSlug(data.events[0].slug);
        }
      }
    } catch (e) {
      onShowToast('이벤트 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApplications = async (slug: string) => {
    try {
      const res = await fetch(`/api/admin/events/applications?slug=${slug}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setApplications(data.applications || []);
        setStats(data.stats || null);
      }
    } catch (e) {
      onShowToast('신청자 목록을 불러오지 못했습니다.');
    }
  };

  const currentEvent = events.find((e) => e.slug === selectedSlug) || events[0];

  // Toggle Event Open Status
  const handleToggleStatus = async (newStatus: 'upcoming' | 'ongoing' | 'ended') => {
    if (!currentEvent) return;
    setIsTogglingStatus(true);
    try {
      const res = await fetch('/api/admin/events/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: currentEvent.slug, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onShowToast(data.message || '상태가 변경되었습니다.');
        // Update local state
        setEvents((prev) =>
          prev.map((ev) => (ev.slug === currentEvent.slug ? { ...ev, status: newStatus } : ev))
        );
      } else {
        alert(data.error || '상태 변경 실패');
      }
    } catch (err) {
      alert('네트워크 오류');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Change applicant status
  const handleUpdateAppStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    try {
      const res = await fetch('/api/admin/events/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        onShowToast(`신청자 상태가 [${status === 'confirmed' ? '참석 확정' : '신청 취소'}]로 변경되었습니다.`);
        fetchApplications(selectedSlug);
      }
    } catch (e) {
      alert('변경 실패');
    }
  };

  // Delete applicant
  const handleDeleteApp = async (id: string, name: string) => {
    if (!confirm(`${name} 님의 신청 내역을 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/admin/events/applications?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onShowToast('신청 내역이 삭제되었습니다.');
        fetchApplications(selectedSlug);
      }
    } catch (e) {
      alert('삭제 실패');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (applications.length === 0) {
      alert('다운로드할 신청자가 없습니다.');
      return;
    }

    const headers = ['신청일시', '이벤트볼륨', '이름', '연락처', '성별', '나이', '상태'];
    const rows = applications.map((a) => [
      a.created_at ? new Date(a.created_at).toLocaleString('ko-KR') : '',
      a.volNumber,
      `"${a.name}"`,
      a.phone,
      a.gender || '-',
      a.age || '-',
      a.status === 'confirmed' ? '참석확정' : a.status === 'cancelled' ? '취소됨' : '대기',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orbit_${selectedSlug}_applicants_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast('신청자 명단이 CSV 파일로 다운로드되었습니다.');
  };

  // Filtered applicants
  const filteredApps = applications.filter((a) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = a.name.toLowerCase().includes(q);
      const matchPhone = a.phone.includes(q);
      if (!matchName && !matchPhone) return false;
    }
    if (genderFilter !== 'all') {
      const isMale = a.gender === '남성' || a.gender === 'male';
      if (genderFilter === 'male' && !isMale) return false;
      if (genderFilter === 'female' && isMale) return false;
    }
    return true;
  });

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
            <span>🚀</span> 이벤트 오픈 및 관리 (Open / End 결정 및 신청자 관리)
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0', lineHeight: 1.5 }}>
            이벤트의 공식 오픈(<strong style={{ color: '#34d399' }}>NOW OPEN</strong>) 및 마감/종료(<strong style={{ color: '#cbd5e1' }}>VOL.1 END</strong>) 상태를 결정하고, 실시간 신청자 명단을 관리합니다.
          </p>
        </div>

        {/* Volume Selector Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {events.map((ev) => {
            const isSelected = ev.slug === selectedSlug;
            const isOpen = ev.status === 'ongoing';
            return (
              <button
                key={ev.id || ev.slug}
                type="button"
                onClick={() => setSelectedSlug(ev.slug)}
                style={{
                  background: isSelected
                    ? isOpen
                      ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
                      : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                    : 'rgba(255, 255, 255, 0.06)',
                  color: isSelected ? '#fff' : '#94a3b8',
                  border: isSelected
                    ? `1px solid ${isOpen ? '#34d399' : '#38bdf8'}`
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? '0 4px 14px rgba(0,0,0,0.4)' : 'none',
                }}
              >
                <span>{isOpen ? '🟢' : '⏳'}</span>
                {ev.volNumber}
              </button>
            );
          })}
        </div>
      </div>

      {currentEvent && (
        <>
          {/* Event Open Status Master Control Card */}
          <div
            style={{
              background: currentEvent.status === 'ongoing' ? 'rgba(6, 78, 59, 0.25)' : 'rgba(30, 41, 59, 0.5)',
              border: `1.5px solid ${currentEvent.status === 'ongoing' ? 'rgba(52, 211, 153, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '20px',
              padding: '24px 22px',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '20px',
              boxShadow: currentEvent.status === 'ongoing' ? '0 10px 30px rgba(16, 185, 129, 0.15)' : 'none',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    letterSpacing: '1px',
                  }}
                >
                  {currentEvent.volNumber}
                </span>

                <span
                  style={{
                    background:
                      currentEvent.status === 'ongoing'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : currentEvent.status === 'ended'
                        ? 'rgba(148, 163, 184, 0.2)'
                        : 'rgba(245, 158, 11, 0.2)',
                    border: `1px solid ${
                      currentEvent.status === 'ongoing'
                        ? '#34d399'
                        : currentEvent.status === 'ended'
                        ? '#94a3b8'
                        : '#fbbf24'
                    }`,
                    color:
                      currentEvent.status === 'ongoing'
                        ? '#34d399'
                        : currentEvent.status === 'ended'
                        ? '#cbd5e1'
                        : '#fbbf24',
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '999px',
                  }}
                >
                  {currentEvent.status === 'ongoing'
                    ? '● 현재 공식 오픈 상태 (NOW OPEN)'
                    : currentEvent.status === 'ended'
                    ? `🏁 이벤트 종료 (${(currentEvent.volNumber || 'VOL.1').trim().replace(/vol\.?\s*0*/i, 'VOL.').toUpperCase()} END)`
                    : '● 오픈 대기 (Coming Soon)'}
                </span>

                <Link
                  href={`/events/${currentEvent.slug}`}
                  target="_blank"
                  style={{
                    fontSize: '12px',
                    color: '#60a5fa',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>↗</span> 이벤트 페이지 미리보기 (/events/{currentEvent.slug})
                </Link>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: '0 0 4px' }}>
                {currentEvent.title}
              </h3>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                {currentEvent.status === 'ongoing'
                  ? '공식 오픈되어 홈페이지 카드가 [NOW OPEN]으로 표시되며, 누구나 카드를 눌러 참가 신청할 수 있습니다.'
                  : currentEvent.status === 'ended'
                  ? `이벤트가 종료되어 홈페이지 카드가 [${(currentEvent.volNumber || 'VOL.1').trim().replace(/vol\.?\s*0*/i, 'VOL.').toUpperCase()} END]로 표시되며 신규 참가 신청이 마감되었습니다.`
                  : '오픈 전 상태입니다. [공식 오픈하기] 버튼을 누르면 홈페이지 카드의 comming soon이 [NOW OPEN]으로 변경되고 신청이 활성화됩니다.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {currentEvent.status === 'ongoing' ? (
                <>
                  <button
                    type="button"
                    disabled={isTogglingStatus}
                    onClick={() => handleToggleStatus('upcoming')}
                    style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      color: '#fbbf24',
                      borderRadius: '12px',
                      padding: '12px 20px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ⏸️ 오픈 일시정지 (Coming Soon으로 전환)
                  </button>

                  <button
                    type="button"
                    disabled={isTogglingStatus}
                    onClick={() => handleToggleStatus('ended')}
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      color: '#f87171',
                      borderRadius: '12px',
                      padding: '12px 20px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    🏁 이벤트 마감/종료 ({((currentEvent.volNumber || 'VOL.1').trim().replace(/vol\.?\s*0*/i, 'VOL.')).toUpperCase()} END 전환)
                  </button>
                </>
              ) : currentEvent.status === 'ended' ? (
                <>
                  <button
                    type="button"
                    disabled={isTogglingStatus}
                    onClick={() => handleToggleStatus('ongoing')}
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>🟢</span> 다시 공식 오픈하기 (NOW OPEN)
                  </button>

                  <button
                    type="button"
                    disabled={isTogglingStatus}
                    onClick={() => handleToggleStatus('upcoming')}
                    style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      color: '#fbbf24',
                      borderRadius: '12px',
                      padding: '12px 20px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ⏸️ 오픈 대기 상태로 되돌리기 (Coming Soon)
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isTogglingStatus}
                    onClick={() => handleToggleStatus('ongoing')}
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span>🟢</span> {currentEvent.volNumber} 공식 오픈하기 (NOW OPEN)
                  </button>

                  <button
                    type="button"
                    disabled={isTogglingStatus}
                    onClick={() => handleToggleStatus('ended')}
                    style={{
                      background: 'rgba(148, 163, 184, 0.15)',
                      border: '1px solid rgba(148, 163, 184, 0.35)',
                      color: '#94a3b8',
                      borderRadius: '12px',
                      padding: '12px 20px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    🏁 이벤트 종료 상태로 변경 ({((currentEvent.volNumber || 'VOL.1').trim().replace(/vol\.?\s*0*/i, 'VOL.')).toUpperCase()} END)
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          {stats && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
              }}
            >
              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '16px 18px',
                }}
              >
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>👥 총 신청자 수</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                  {stats.total}{' '}
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>명</span>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '16px 18px',
                }}
              >
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>🚻 성별 분포 (남:여)</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                  <span style={{ color: '#60a5fa' }}>남 {stats.male}</span> : <span style={{ color: '#f472b6' }}>여 {stats.female}</span>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '16px 18px',
                }}
              >
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>✓ 참석 확정자</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
                  {stats.confirmed}{' '}
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>명</span>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(30, 41, 59, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '16px 18px',
                }}
              >
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>취소 인원</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#f87171', marginTop: '4px' }}>
                  {stats.cancelled}{' '}
                  <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>명</span>
                </div>
              </div>
            </div>
          )}

          {/* Applicant List & Table */}
          <div
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
            {/* Table Header Bar */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📋</span> {currentEvent.volNumber} 신청자 명단 ({filteredApps.length}명)
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Search */}
                <input
                  type="text"
                  placeholder="이름, 연락처 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                  }}
                />

                {/* Gender filter */}
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value as any)}
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                  }}
                >
                  <option value="all">성별 전체</option>
                  <option value="male">남성만</option>
                  <option value="female">여성만</option>
                </select>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34d399',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  📊 엑셀/CSV 다운로드
                </button>
              </div>
            </div>

            {/* Table */}
            {filteredApps.length === 0 ? (
              <div
                style={{
                  padding: '50px 20px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '13.5px',
                  background: 'rgba(15, 23, 42, 0.4)',
                  borderRadius: '12px',
                }}
              >
                {searchTerm || genderFilter !== 'all'
                  ? '조건에 맞는 신청자가 없습니다.'
                  : currentEvent.status === 'ongoing'
                  ? '아직 접수된 신청자가 없습니다. 이벤트 페이지에서 신청이 들어오면 실시간으로 표시됩니다.'
                  : '이벤트를 공식 오픈하시면 사용자들이 카드를 눌러 신청을 시작할 수 있습니다.'}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    textAlign: 'left',
                    fontSize: '13px',
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                      <th style={{ padding: '12px 10px' }}>No</th>
                      <th style={{ padding: '12px 10px' }}>신청 일시</th>
                      <th style={{ padding: '12px 10px' }}>이름</th>
                      <th style={{ padding: '12px 10px' }}>연락처</th>
                      <th style={{ padding: '12px 10px' }}>성별/나이</th>
                      <th style={{ padding: '12px 10px' }}>상태</th>
                      <th style={{ padding: '12px 10px', textAlign: 'right' }}>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApps.map((app, idx) => (
                      <tr
                        key={app.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'background 0.2s',
                        }}
                      >
                        <td style={{ padding: '12px 10px', color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '12px 10px', color: '#94a3b8', fontSize: '12px' }}>
                          {app.created_at ? new Date(app.created_at).toLocaleString('ko-KR') : '-'}
                        </td>
                        <td style={{ padding: '12px 10px', fontWeight: 700, color: '#f8fafc' }}>
                          {app.name}
                        </td>
                        <td style={{ padding: '12px 10px', color: '#38bdf8', fontWeight: 600 }}>
                          {app.phone}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <span
                            style={{
                              color: app.gender === '남성' || app.gender === 'male' ? '#60a5fa' : '#f472b6',
                              fontWeight: 600,
                            }}
                          >
                            {app.gender || '-'}
                          </span>{' '}
                          <span style={{ color: '#94a3b8', fontSize: '11px' }}>({app.age || '-'})</span>
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              background:
                                app.status === 'confirmed'
                                  ? 'rgba(52, 211, 153, 0.15)'
                                  : app.status === 'cancelled'
                                  ? 'rgba(239, 68, 68, 0.15)'
                                  : 'rgba(245, 158, 11, 0.15)',
                              color:
                                app.status === 'confirmed'
                                  ? '#34d399'
                                  : app.status === 'cancelled'
                                  ? '#f87171'
                                  : '#fbbf24',
                            }}
                          >
                            {app.status === 'confirmed' ? '참석 확정' : app.status === 'cancelled' ? '신청 취소' : '대기'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            {app.status !== 'confirmed' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateAppStatus(app.id, 'confirmed')}
                                style={{
                                  background: 'rgba(52, 211, 153, 0.15)',
                                  border: '1px solid rgba(52, 211, 153, 0.3)',
                                  color: '#34d399',
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                }}
                              >
                                확정
                              </button>
                            )}
                            {app.status !== 'cancelled' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateAppStatus(app.id, 'cancelled')}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#f87171',
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                }}
                              >
                                취소
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteApp(app.id, app.name)}
                              style={{
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#94a3b8',
                                fontSize: '11px',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                              }}
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
