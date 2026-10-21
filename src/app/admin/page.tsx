'use client';

import { useState, useEffect, useMemo } from 'react';
import EventManagementTab from './EventManagementTab';

interface ProfileRecord {
  id: string;
  name: string;
  nickname: string;
  phone: string;
  gender: string;
  age: string | number;
  height: number;
  location: string;
  preferred_animals?: string[];
  preferredAnimals?: string[];
  preferred_appearance_detail?: string;
  preferredAppearanceDetail?: string;
  preferred_partner_detail?: string;
  preferredPartnerDetail?: string;
  self_intro?: string;
  selfIntro?: string;
  photos?: string[];
  created_at?: string;
}

interface StatsData {
  total: number;
  male: number;
  female: number;
  withPhotos: number;
  withoutPhotos: number;
  today: number;
}

export default function AdminPage() {
  // Auth state
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');

  // Login form state
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Dashboard state
  const [adminTab, setAdminTab] = useState<'profiles' | 'events'>('profiles');
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [photoFilter, setPhotoFilter] = useState<'all' | 'with' | 'without'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'height_desc' | 'height_asc'>('newest');

  // Interactive state
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [previewPhotos, setPreviewPhotos] = useState<{ photos: string[]; index: number; name: string } | null>(null);
  const [deletingProfile, setDeletingProfile] = useState<ProfileRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Initial auth check
  useEffect(() => {
    checkCurrentSession();
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const checkCurrentSession = async () => {
    setCheckingAuth(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'GET',
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok && data.authenticated) {
        setIsAuthenticated(true);
        setAdminUsername(data.username || 'admin');
        fetchAdminProfiles();
      } else {
        setIsAuthenticated(false);
      }
    } catch (e) {
      setIsAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  // 2. Login submit handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser.trim() || !loginPass.trim()) {
      setLoginError('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setAdminUsername(data.username || loginUser);
        setLoginPass('');
        showToast('보안 관리자 세션이 시작되었습니다.');
        fetchAdminProfiles();
      } else {
        setLoginError(data.error || '인증에 실패했습니다.');
        if (data.locked && data.remainingSeconds) {
          setLockoutSeconds(data.remainingSeconds);
        }
      }
    } catch (err) {
      setLoginError('인증 통신 오류가 발생했습니다.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 3. Logout handler
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
    setIsAuthenticated(false);
    setProfiles([]);
    setStats(null);
    showToast('관리자 세션이 안전하게 종료되었습니다.');
  };

  // 4. Fetch profiles data
  const fetchAdminProfiles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/profiles', {
        method: 'GET',
        cache: 'no-store',
      });
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setProfiles(json.data);
        if (json.stats) setStats(json.stats);
      }
    } catch (err) {
      console.error('Failed to fetch admin profiles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Delete profile handler
  const handleDeleteProfile = async () => {
    if (!deletingProfile) return;
    try {
      const res = await fetch(`/api/admin/profiles?id=${encodeURIComponent(deletingProfile.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`${deletingProfile.name} 회원의 프로필이 삭제되었습니다.`);
        setDeletingProfile(null);
        fetchAdminProfiles();
      } else {
        alert(data.error || '삭제 처리 중 오류가 발생했습니다.');
      }
    } catch (e) {
      alert('삭제 요청 실패: 네트워크 상태를 확인하세요.');
    }
  };

  // 6. CSV Export with UTF-8 BOM
  const handleExportCSV = () => {
    if (profiles.length === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }

    const headers = [
      'ID',
      '등록일시',
      '이름',
      '닉네임',
      '성별',
      '출생연도',
      '키(cm)',
      '거주지역',
      '전화번호',
      '선호동물상',
      '선호외모상세',
      '선호이성상세',
      '자기소개',
      '등록사진수',
      '사진URL목록',
    ];

    const rows = filteredProfiles.map((p) => {
      const animals = (p.preferred_animals || p.preferredAnimals || []).join(', ');
      const appearance = (p.preferred_appearance_detail || p.preferredAppearanceDetail || '').replace(/\r?\n/g, ' ');
      const partner = (p.preferred_partner_detail || p.preferredPartnerDetail || '').replace(/\r?\n/g, ' ');
      const intro = (p.self_intro || p.selfIntro || '').replace(/\r?\n/g, ' ');
      const photos = Array.isArray(p.photos) ? p.photos : [];

      return [
        p.id,
        p.created_at || '',
        p.name || '',
        p.nickname || '',
        p.gender === 'male' || p.gender === '남성' ? '남성' : '여성',
        p.age || '',
        p.height || '',
        p.location || '',
        p.phone || '',
        animals,
        appearance,
        partner,
        intro,
        photos.length,
        photos.join(' | '),
      ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`);
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orbit_profiles_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('전체 프로필이 CSV 엑셀 파일로 저장되었습니다.');
  };

  // 7. Filter & Search logic
  const filteredProfiles = useMemo(() => {
    return profiles
      .filter((p) => {
        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const nameMatch = (p.name || '').toLowerCase().includes(q);
          const nickMatch = (p.nickname || '').toLowerCase().includes(q);
          const phoneMatch = (p.phone || '').includes(q);
          const locMatch = (p.location || '').toLowerCase().includes(q);
          const introMatch = (p.self_intro || p.selfIntro || '').toLowerCase().includes(q);
          const partnerMatch = (p.preferred_partner_detail || p.preferredPartnerDetail || '').toLowerCase().includes(q);
          if (!nameMatch && !nickMatch && !phoneMatch && !locMatch && !introMatch && !partnerMatch) {
            return false;
          }
        }

        // Gender filter
        if (genderFilter !== 'all') {
          const isMale = p.gender === 'male' || p.gender === '남성';
          if (genderFilter === 'male' && !isMale) return false;
          if (genderFilter === 'female' && isMale) return false;
        }

        // Photo filter
        const hasPhotos = Array.isArray(p.photos) && p.photos.length > 0;
        if (photoFilter === 'with' && !hasPhotos) return false;
        if (photoFilter === 'without' && hasPhotos) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        }
        if (sortBy === 'height_desc') {
          return Number(b.height || 0) - Number(a.height || 0);
        }
        if (sortBy === 'height_asc') {
          return Number(a.height || 0) - Number(b.height || 0);
        }
        return 0;
      });
  }, [profiles, searchTerm, genderFilter, photoFilter, sortBy]);

  // Loading state during auth check
  if (checkingAuth) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}
      >
        <div style={{ fontSize: '32px', animation: 'spin 1.5s infinite linear' }}>🛡️</div>
        <p style={{ color: '#94a3b8', fontSize: '14px', letterSpacing: '0.5px' }}>
          관리자 보안 프로토콜 확인 중...
        </p>
      </div>
    );
  }

  // ========================================================
  // LOGIN VIEW (DARK CYBER GATEWAY)
  // ========================================================
  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: 'radial-gradient(ellipse at 50% 20%, #172554 0%, #090d16 70%)',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '420px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px',
            padding: '40px 32px',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(59, 130, 246, 0.15)',
          }}
        >
          {/* Gateway Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 16px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '30px',
                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
              }}
            >
              🛡️
            </div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#60a5fa',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              Restricted Security Gateway
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Orbit Admin Portal
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px', lineHeight: 1.5 }}>
              인가된 관리자만 접근할 수 있는 격리된 영역입니다.
            </p>
          </div>

          {/* Lockout Banner */}
          {lockoutSeconds > 0 && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '12px',
                padding: '14px',
                color: '#fca5a5',
                fontSize: '13px',
                lineHeight: 1.5,
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              ⛔ <strong>보안 잠금 가동 중</strong>
              <div style={{ marginTop: '4px', fontSize: '12px', color: '#f87171' }}>
                해제까지 남은 시간:{' '}
                <strong>
                  {Math.floor(lockoutSeconds / 60)}분 {lockoutSeconds % 60}초
                </strong>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  marginBottom: '6px',
                  letterSpacing: '0.3px',
                }}
              >
                관리자 아이디
              </label>
              <input
                type="text"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="Admin Username"
                disabled={lockoutSeconds > 0 || isLoggingIn}
                autoFocus
                autoComplete="username"
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '13px 16px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  marginBottom: '6px',
                  letterSpacing: '0.3px',
                }}
              >
                비밀번호
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="Admin Password"
                  disabled={lockoutSeconds > 0 || isLoggingIn}
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '13px 44px 13px 16px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '4px',
                  }}
                >
                  {showPassword ? '👁️' : '🔒'}
                </button>
              </div>
            </div>

            {loginError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  padding: '11px 14px',
                  color: '#fca5a5',
                  fontSize: '12.5px',
                  lineHeight: 1.4,
                }}
              >
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={lockoutSeconds > 0 || isLoggingIn}
              style={{
                marginTop: '8px',
                width: '100%',
                background:
                  lockoutSeconds > 0
                    ? '#334155'
                    : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: lockoutSeconds > 0 ? 'not-allowed' : 'pointer',
                boxShadow: lockoutSeconds > 0 ? 'none' : '0 8px 24px rgba(37, 99, 235, 0.4)',
                transition: 'all 0.2s',
              }}
            >
              {isLoggingIn ? '보안 인증 검증 중...' : '관리자 보안 로그인 →'}
            </button>
          </form>

          {/* Security Features Info */}
          <div
            style={{
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '11px',
              color: '#64748b',
              textAlign: 'center',
            }}
          >
            <div>🔒 SHA-256 상시 시간 타이밍 공격 방어</div>
            <div>🛡️ 5회 연속 실패 시 15분 IP 자동 차단</div>
            <div>🔑 HttpOnly & SameSite=Strict 암호화 세션</div>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // AUTHENTICATED DASHBOARD VIEW
  // ========================================================
  return (
    <div style={{ minHeight: '100vh', padding: '24px 20px 80px', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Toast Banner */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'rgba(30, 41, 59, 0.95)',
            border: '1px solid #3b82f6',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <span>✨</span> {toastMessage}
        </div>
      )}

      {/* Top Navbar */}
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          paddingBottom: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.35)',
            }}
          >
            🛡️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Orbit Security Control
              </h1>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#34d399',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}
              >
                ● 보안 격리 세션
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '3px 0 0 0' }}>
              관리자 계정: <strong style={{ color: '#60a5fa' }}>{adminUsername}</strong> · 전용 암호화 통신
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={fetchAdminProfiles}
            disabled={isLoading}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#e2e8f0',
              padding: '9px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.2s',
            }}
          >
            <span style={{ display: 'inline-block', animation: isLoading ? 'spin 1s infinite linear' : 'none' }}>
              🔄
            </span>
            {isLoading ? '동기화 중...' : '새로고침'}
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              padding: '9px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📊 엑셀/CSV 다운로드
          </button>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '9px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* Main Admin Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '16px',
          marginBottom: '28px',
        }}
      >
        <button
          type="button"
          onClick={() => setAdminTab('profiles')}
          style={{
            background:
              adminTab === 'profiles'
                ? 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)'
                : 'rgba(255, 255, 255, 0.05)',
            color: adminTab === 'profiles' ? '#fff' : '#94a3b8',
            border: adminTab === 'profiles' ? '1px solid #60a5fa' : '1px solid rgba(255, 255, 255, 0.1)',
            padding: '11px 22px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: adminTab === 'profiles' ? '0 4px 16px rgba(59, 130, 246, 0.35)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          <span>👥</span> 프로필 관리 ({profiles.length})
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('events')}
          style={{
            background:
              adminTab === 'events'
                ? 'linear-gradient(135deg, #991b1b 0%, #ef4444 100%)'
                : 'rgba(255, 255, 255, 0.05)',
            color: adminTab === 'events' ? '#fff' : '#94a3b8',
            border: adminTab === 'events' ? '1px solid #f87171' : '1px solid rgba(255, 255, 255, 0.1)',
            padding: '11px 22px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: adminTab === 'events' ? '0 4px 16px rgba(239, 68, 68, 0.35)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          <span>🎟️</span> 이벤트 카드 관리
        </button>
      </div>

      {adminTab === 'events' ? (
        <EventManagementTab onShowToast={showToast} />
      ) : (
        <>
          {/* Stats Metric Cards */}
      {stats && (
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '18px 20px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
              👥 전체 접수 회원
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#f8fafc' }}>
              {stats.total}{' '}
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>명</span>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '18px 20px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
              🚻 성별 구성비
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc' }}>
              <span style={{ color: '#60a5fa' }}>남 {stats.male}</span> /{' '}
              <span style={{ color: '#f472b6' }}>여 {stats.female}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              {stats.total > 0
                ? `남성 ${Math.round((stats.male / stats.total) * 100)}% · 여성 ${Math.round(
                    (stats.female / stats.total) * 100
                  )}%`
                : '-'}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '18px 20px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
              📸 사진 등록자
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#a78bfa' }}>
              {stats.withPhotos}{' '}
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>
                명 ({stats.total > 0 ? Math.round((stats.withPhotos / stats.total) * 100) : 0}%)
              </span>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(30, 41, 59, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '18px 20px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
              ⚡ 오늘 신규 접수
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#34d399' }}>
              +{stats.today}{' '}
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>명</span>
            </div>
          </div>
        </section>
      )}

      {/* Filter and Search Bar */}
      <section
        style={{
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Search input */}
        <div style={{ flex: '1 1 260px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
            🔍
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="이름, 닉네임, 전화번호, 지역, 소개글 검색..."
            style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '10px 14px 10px 36px',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Filters Group */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          {/* Gender Filter */}
          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '10px', padding: '3px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {(['all', 'male', 'female'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGenderFilter(g)}
                style={{
                  background: genderFilter === g ? '#3b82f6' : 'transparent',
                  color: genderFilter === g ? '#fff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {g === 'all' ? '성별 전체' : g === 'male' ? '남성' : '여성'}
              </button>
            ))}
          </div>

          {/* Photo Filter */}
          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '10px', padding: '3px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {(['all', 'with', 'without'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPhotoFilter(p)}
                style={{
                  background: photoFilter === p ? '#8b5cf6' : 'transparent',
                  color: photoFilter === p ? '#fff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '7px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {p === 'all' ? '사진 전체' : p === 'with' ? '사진 있음' : '사진 없음'}
              </button>
            ))}
          </div>

          {/* Sort Selection */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '8px 12px',
              color: '#cbd5e1',
              fontSize: '12.5px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="newest">최신 등록순</option>
            <option value="oldest">오래된 순</option>
            <option value="height_desc">키 큰 순</option>
            <option value="height_asc">키 작은 순</option>
          </select>
        </div>
      </section>

      {/* Results Count Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', fontSize: '13px', color: '#94a3b8' }}>
        <div>
          조회 결과: <strong style={{ color: '#fff' }}>{filteredProfiles.length}</strong>명{' '}
          <span style={{ fontSize: '12px', color: '#64748b' }}>(전체 {profiles.length}명)</span>
        </div>
        <div style={{ fontSize: '11.5px', color: '#64748b' }}>
          * 전화번호는 보안 권한을 가진 관리자에게만 원문 전체가 표시됩니다.
        </div>
      </div>

      {/* Main Members Data Grid */}
      {filteredProfiles.length === 0 ? (
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.3)',
            border: '1px dashed rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '60px 20px',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
          <div style={{ fontSize: '15px', color: '#94a3b8', fontWeight: 600 }}>
            조건에 일치하는 회원 프로필이 없습니다.
          </div>
          <div style={{ fontSize: '12.5px', marginTop: '4px' }}>
            검색어나 필터 설정을 변경해보세요.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredProfiles.map((p) => {
            const isMale = p.gender === 'male' || p.gender === '남성';
            const photos = Array.isArray(p.photos) ? p.photos : [];
            const hasPhotos = photos.length > 0;
            const isExpanded = expandedRowId === p.id;
            const animals = p.preferred_animals || p.preferredAnimals || [];
            const intro = p.self_intro || p.selfIntro || '';
            const partner = p.preferred_partner_detail || p.preferredPartnerDetail || '';
            const appearance = p.preferred_appearance_detail || p.preferredAppearanceDetail || '';

            return (
              <div
                key={p.id}
                style={{
                  background: 'rgba(30, 41, 59, 0.45)',
                  border: isExpanded ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  transition: 'all 0.2s',
                }}
              >
                {/* Main Row Info */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}
                >
                  {/* Left: Thumbnail & Core Details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '260px' }}>
                    {/* Photo Thumbnail */}
                    <div style={{ position: 'relative' }}>
                      {hasPhotos ? (
                        <div
                          onClick={() => setPreviewPhotos({ photos, index: 0, name: p.name })}
                          style={{
                            width: '54px',
                            height: '54px',
                            borderRadius: '14px',
                            overflow: 'hidden',
                            border: '2px solid rgba(255, 255, 255, 0.15)',
                            cursor: 'pointer',
                            position: 'relative',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          }}
                        >
                          <img
                            src={photos[0]}
                            alt={p.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          {photos.length > 1 && (
                            <span
                              style={{
                                position: 'absolute',
                                right: '3px',
                                bottom: '3px',
                                background: 'rgba(0,0,0,0.75)',
                                color: '#fff',
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '1px 4px',
                                borderRadius: '4px',
                              }}
                            >
                              +{photos.length - 1}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            width: '54px',
                            height: '54px',
                            borderRadius: '14px',
                            background: isMale ? 'rgba(59, 130, 246, 0.15)' : 'rgba(244, 114, 182, 0.15)',
                            border: `1px solid ${isMale ? 'rgba(59, 130, 246, 0.3)' : 'rgba(244, 114, 182, 0.3)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '22px',
                          }}
                        >
                          {isMale ? '👦' : '👧'}
                        </div>
                      )}
                    </div>

                    {/* Name, Nickname & Demographics */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
                          {p.name}
                        </span>
                        <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                          ({p.nickname})
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '6px',
                            background: isMale ? 'rgba(59, 130, 246, 0.2)' : 'rgba(244, 114, 182, 0.2)',
                            color: isMale ? '#93c5fd' : '#f9a8d4',
                          }}
                        >
                          {isMale ? '남성' : '여성'}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '4px' }}>
                        {p.age} · {p.height}cm · {p.location}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Real Unmasked Phone with 1-Click Action */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '8px 14px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span style={{ fontSize: '14px' }}>📞</span>
                      <strong style={{ fontSize: '14px', color: '#f8fafc', letterSpacing: '0.5px' }}>
                        {p.phone}
                      </strong>
                    </div>

                    <button
                      type="button"
                      title="전화번호 복사"
                      onClick={() => {
                        navigator.clipboard.writeText(p.phone);
                        showToast(`${p.name}님의 전화번호가 복사되었습니다.`);
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#cbd5e1',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      📋 복사
                    </button>

                    <a
                      href={`tel:${p.phone}`}
                      title="직접 전화 걸기"
                      style={{
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        color: '#60a5fa',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        textDecoration: 'none',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      통화
                    </a>
                  </div>

                  {/* Right: Expand & Delete Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setExpandedRowId(isExpanded ? null : p.id)}
                      style={{
                        background: isExpanded ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: isExpanded ? '#fff' : '#cbd5e1',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {isExpanded ? '상세 접기 ▲' : '상세 보기 ▼'}
                    </button>

                    <button
                      type="button"
                      title="프로필 영구 삭제"
                      onClick={() => setDeletingProfile(p)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '16px',
                    }}
                  >
                    {/* Intro */}
                    <div
                      style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '12px',
                        padding: '14px',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                        💬 자기소개
                      </div>
                      <p style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
                        {intro || '자기소개가 작성되지 않았습니다.'}
                      </p>
                    </div>

                    {/* Ideal Partner */}
                    <div
                      style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '12px',
                        padding: '14px',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#f472b6', marginBottom: '6px' }}>
                        💘 선호하는 이성 (이상형)
                      </div>
                      <p style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
                        {partner || '선호 이성 상세가 작성되지 않았습니다.'}
                      </p>
                      {appearance && (
                        <div style={{ marginTop: '8px', fontSize: '12px', color: '#cbd5e1' }}>
                          <span style={{ color: '#a78bfa', fontWeight: 600 }}>외모 상세:</span> {appearance}
                        </div>
                      )}
                    </div>

                    {/* Preferences & Meta */}
                    <div
                      style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '12px',
                        padding: '14px',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#a78bfa', marginBottom: '8px' }}>
                        🐾 선호 동물상 & 등록 정보
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                        {animals.length > 0 ? (
                          animals.map((a) => (
                            <span
                              key={a}
                              style={{
                                background: 'rgba(167, 139, 250, 0.2)',
                                border: '1px solid rgba(167, 139, 250, 0.4)',
                                color: '#ddd6fe',
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '6px',
                              }}
                            >
                              #{a}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '12px', color: '#64748b' }}>선택 안함</span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        접수 일시: {p.created_at ? new Date(p.created_at).toLocaleString('ko-KR') : '-'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        고유 ID: {p.id}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* Photo Lightbox Modal */}
      {previewPhotos && (
        <div
          onClick={() => setPreviewPhotos(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '560px',
              width: '100%',
              background: '#0f172a',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
            }}
          >
            {/* Modal Top Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                📸 {previewPhotos.name}님의 등록 사진 ({previewPhotos.index + 1}/{previewPhotos.photos.length})
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhotos(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Photo View */}
            <div style={{ position: 'relative', width: '100%', maxHeight: '65vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={previewPhotos.photos[previewPhotos.index]}
                alt="Profile Preview"
                style={{ width: '100%', maxHeight: '65vh', objectFit: 'contain' }}
              />

              {previewPhotos.photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewPhotos({
                        ...previewPhotos,
                        index: (previewPhotos.index - 1 + previewPhotos.photos.length) % previewPhotos.photos.length,
                      })
                    }
                    style={{
                      position: 'absolute',
                      left: '12px',
                      background: 'rgba(0,0,0,0.6)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      fontSize: '18px',
                    }}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewPhotos({
                        ...previewPhotos,
                        index: (previewPhotos.index + 1) % previewPhotos.photos.length,
                      })
                    }
                    style={{
                      position: 'absolute',
                      right: '12px',
                      background: 'rgba(0,0,0,0.6)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      fontSize: '18px',
                    }}
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail dots */}
            {previewPhotos.photos.length > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '14px' }}>
                {previewPhotos.photos.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setPreviewPhotos({ ...previewPhotos, index: i })}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: i === previewPhotos.index ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.2)',
                      padding: 0,
                      cursor: 'pointer',
                    }}
                  >
                    <img src={src} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProfile && (
        <div
          onClick={() => setDeletingProfile(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '420px',
              width: '100%',
              background: '#0f172a',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '20px',
              padding: '28px',
              textAlign: 'center',
              boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                margin: '0 auto 16px',
              }}
            >
              ⚠️
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              프로필 영구 삭제
            </h2>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '10px', lineHeight: 1.5 }}>
              <strong style={{ color: '#fff' }}>{deletingProfile.name}</strong> ({deletingProfile.phone}) 님의
              데이터베이스 프로필을 정말 영구 삭제하시겠습니까?
            </p>
            <div style={{ fontSize: '12px', color: '#f87171', marginTop: '4px' }}>
              이 작업은 되돌릴 수 없습니다.
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => setDeletingProfile(null)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDeleteProfile}
                style={{
                  flex: 1,
                  background: '#ef4444',
                  border: 'none',
                  color: '#fff',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                }}
              >
                영구 삭제 실행
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
