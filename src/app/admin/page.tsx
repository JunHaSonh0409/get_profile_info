'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { downloadCsv, today } from '@/lib/csv';
import { Field, Icon, Modal, OrbitMark, Toast } from '@/components/ui';
import EventManagementTab from './EventManagementTab';
import EventOpenManagementTab from './EventOpenManagementTab';

interface ProfileRecord {
  id: string;
  name: string;
  nickname: string;
  phone: string;
  gender: string;
  age: string | number;
  height: number;
  location: string;
  mbti?: string;
  preferredAnimals: string[];
  preferredAppearanceDetail: string;
  preferredPartnerDetail: string;
  selfIntro: string;
  photos: string[];
  created_at?: string;
}

interface Stats {
  total: number;
  male: number;
  female: number;
  withPhotos: number;
  today: number;
}

type AdminTab = 'profiles' | 'events' | 'open_manage';
type SortKey = 'newest' | 'oldest' | 'height_desc' | 'height_asc';

const TABS: { id: AdminTab; label: string }[] = [
  { id: 'profiles', label: '회원 프로필' },
  { id: 'events', label: '이벤트 카드' },
  { id: 'open_manage', label: '오픈·신청자' },
];

const isMale = (g: string) => g === 'male' || g === '남성';
const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);
const time = (p: ProfileRecord) => new Date(p.created_at || 0).getTime();
const SORTERS: Record<SortKey, (a: ProfileRecord, b: ProfileRecord) => number> = {
  newest: (a, b) => time(b) - time(a),
  oldest: (a, b) => time(a) - time(b),
  height_desc: (a, b) => (b.height || 0) - (a.height || 0),
  height_asc: (a, b) => (a.height || 0) - (b.height || 0),
};

function AdminLogin({ onLoggedIn }: { onLoggedIn: (username: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [lockout, setLockout] = useState(0);

  useEffect(() => {
    if (lockout <= 0) return;
    const t = setTimeout(() => setLockout((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [lockout]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return setError('아이디와 비밀번호를 모두 입력해주세요.');
    setIsLoggingIn(true);
    setError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onLoggedIn(data.username || username);
      } else {
        setError(data.error || '로그인하지 못했어요.');
        if (data.locked && data.remainingSeconds) setLockout(data.remainingSeconds);
      }
    } catch {
      setError('서버에 연결하지 못했어요.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const disabled = lockout > 0 || isLoggingIn;
  return (
    <main className="shell" style={{ paddingTop: 96 }}>
      <header className="stack">
        <OrbitMark />
        <h1 className="display">Orbit 관리자</h1>
        <p className="lede">관리자 계정으로 로그인하세요.</p>
      </header>
      <form className="sheet stack stack--lg" onSubmit={submit}>
        {lockout > 0 && (
          <p className="notice notice--error" role="alert">
            로그인 시도가 너무 많아 잠겼어요. {Math.floor(lockout / 60)}분 {lockout % 60}초 뒤에 다시 시도하세요.
          </p>
        )}
        <Field label="아이디" htmlFor="admin-user">
          <input id="admin-user" className="input" autoComplete="username" autoFocus value={username} disabled={disabled}
            onChange={(e) => setUsername(e.target.value)} />
        </Field>
        <Field label="비밀번호" htmlFor="admin-pass">
          <div className="affix">
            <input id="admin-pass" className="input" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
              value={password} disabled={disabled} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" className="affix__text" style={{ pointerEvents: 'auto' }} onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}>
              <Icon name={showPassword ? 'lock' : 'eye'} />
            </button>
          </div>
        </Field>
        {error && lockout <= 0 && <p className="notice notice--error" role="alert">{error}</p>}
        <button type="submit" className="btn btn--primary btn--block" disabled={disabled}>
          {isLoggingIn ? '확인하는 중' : '로그인'}
        </button>
        <p className="hint row"><Icon name="shield" /> 5회 연속 실패하면 15분 동안 잠겨요.</p>
      </form>
    </main>
  );
}

export default function AdminPage() {
  const [auth, setAuth] = useState<'checking' | 'out' | 'in'>('checking');
  const [adminUsername, setAdminUsername] = useState('');
  const [tab, setTab] = useState<AdminTab>('profiles');
  const [toast, setToast] = useState<string | null>(null);

  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [photoFilter, setPhotoFilter] = useState<'all' | 'with' | 'without'>('all');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ photos: string[]; index: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState<ProfileRecord | null>(null);

  const showToast = useCallback((msg: string) => setToast(msg), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/profiles', { cache: 'no-store' });
      if (res.status === 401) return setAuth('out');
      const json = await res.json();
      if (json.success) {
        setProfiles(json.data);
        setStats(json.stats);
      }
    } catch (err) {
      console.error('Failed to fetch admin profiles:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/admin/auth', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) return setAuth('out');
        setAdminUsername(data.username);
        setAuth('in');
        fetchProfiles();
      })
      .catch(() => setAuth('out'));
  }, [fetchProfiles]);

  const logout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' }).catch(() => {});
    setAuth('out');
    setProfiles([]);
    setStats(null);
  };

  const deleteProfile = async () => {
    if (!deleting) return;
    try {
      const data = await (await fetch(`/api/admin/profiles?id=${encodeURIComponent(deleting.id)}`, { method: 'DELETE' })).json();
      if (!data.success) throw new Error(data.error);
      showToast(`${deleting.name}님의 프로필을 삭제했어요.`);
      setDeleting(null);
      fetchProfiles();
    } catch (err) {
      showToast(err instanceof Error && err.message ? err.message : '삭제하지 못했어요.');
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return profiles
      .filter((p) => {
        if (q && ![p.name, p.nickname, p.phone, p.location, p.selfIntro, p.preferredPartnerDetail, p.mbti].some((v) => String(v || '').toLowerCase().includes(q))) return false;
        if (genderFilter !== 'all' && isMale(p.gender) !== (genderFilter === 'male')) return false;
        if (photoFilter !== 'all' && (p.photos.length > 0) !== (photoFilter === 'with')) return false;
        return true;
      })
      .sort(SORTERS[sortBy]);
  }, [profiles, search, genderFilter, photoFilter, sortBy]);

  const exportCsv = () => {
    if (filtered.length === 0) return showToast('내보낼 프로필이 없어요.');
    downloadCsv(
      `orbit_profiles_${today()}.csv`,
      ['ID', '등록일시', '이름', '닉네임', '성별', '출생연도', '키(cm)', '거주지역', '전화번호', 'MBTI', '선호동물상', '선호외모상세', '선호이성상세', '자기소개', '등록사진수', '사진URL목록'],
      filtered.map((p) => [
        p.id, p.created_at, p.name, p.nickname, isMale(p.gender) ? '남성' : '여성', p.age, p.height, p.location, p.phone, p.mbti,
        p.preferredAnimals.join(', '), p.preferredAppearanceDetail, p.preferredPartnerDetail, p.selfIntro, p.photos.length, p.photos.join(' | '),
      ])
    );
    showToast(`프로필 ${filtered.length}건을 CSV로 내려받았어요.`);
  };

  if (auth === 'checking') {
    return <p className="shell center muted" role="status">관리자 세션을 확인하는 중</p>;
  }
  if (auth === 'out') {
    return (
      <AdminLogin
        onLoggedIn={(username) => {
          setAdminUsername(username);
          setAuth('in');
          showToast('로그인했어요.');
          fetchProfiles();
        }}
      />
    );
  }

  return (
    <main className="shell shell--wide">
      <header className="admin-head">
        <div className="row">
          <OrbitMark />
          <div>
            <h1 className="title">Orbit 관리자</h1>
            <p className="small muted">{adminUsername} 계정으로 로그인됨</p>
          </div>
        </div>
        <div className="row row--wrap">
          {tab === 'profiles' && (
            <>
              <button type="button" className="btn btn--ghost btn--sm" onClick={fetchProfiles} disabled={isLoading}>
                <Icon name="refresh" className={isLoading ? 'icon spin' : 'icon'} /> 새로고침
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={exportCsv}>
                <Icon name="download" /> CSV
              </button>
            </>
          )}
          <button type="button" className="btn btn--quiet btn--sm" onClick={logout}>
            <Icon name="logout" /> 로그아웃
          </button>
        </div>
      </header>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
            {t.id === 'profiles' && ` (${profiles.length})`}
          </button>
        ))}
      </div>

      {tab === 'events' && <EventManagementTab onShowToast={showToast} onSwitchToOpenManage={() => setTab('open_manage')} />}
      {tab === 'open_manage' && <EventOpenManagementTab onShowToast={showToast} />}

      {tab === 'profiles' && (
        <>
          {stats && (
            <section className="stats">
              <div className="stat">
                <div className="stat__label">전체 회원</div>
                <div className="stat__value">{stats.total}<small>명</small></div>
              </div>
              <div className="stat">
                <div className="stat__label">성별 구성</div>
                <div className="stat__value">
                  <span style={{ color: 'var(--male)' }}>{stats.male}</span> : <span style={{ color: 'var(--female)' }}>{stats.female}</span>
                </div>
                <div className="hint">남 {pct(stats.male, stats.total)}%, 여 {pct(stats.female, stats.total)}%</div>
              </div>
              <div className="stat">
                <div className="stat__label">사진 등록</div>
                <div className="stat__value">{stats.withPhotos}<small>명 ({pct(stats.withPhotos, stats.total)}%)</small></div>
              </div>
              <div className="stat">
                <div className="stat__label">오늘 가입</div>
                <div className="stat__value">{stats.today}<small>명</small></div>
              </div>
            </section>
          )}

          <section className="toolbar">
            <label className="visually-hidden" htmlFor="profile-search">회원 검색</label>
            <input id="profile-search" className="input" placeholder="이름, 닉네임, 전화번호, 지역, 소개글 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="seg seg--sm" role="group" aria-label="성별 필터">
              {(['all', 'male', 'female'] as const).map((g) => (
                <button key={g} type="button" aria-pressed={genderFilter === g} onClick={() => setGenderFilter(g)}>
                  {g === 'all' ? '전체' : g === 'male' ? '남성' : '여성'}
                </button>
              ))}
            </div>
            <div className="seg seg--sm" role="group" aria-label="사진 필터">
              {(['all', 'with', 'without'] as const).map((p) => (
                <button key={p} type="button" aria-pressed={photoFilter === p} onClick={() => setPhotoFilter(p)}>
                  {p === 'all' ? '사진 전체' : p === 'with' ? '사진 있음' : '사진 없음'}
                </button>
              ))}
            </div>
            <label className="visually-hidden" htmlFor="profile-sort">정렬</label>
            <select id="profile-sort" className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)}>
              <option value="newest">최근 가입순</option>
              <option value="oldest">오래된 순</option>
              <option value="height_desc">키 큰 순</option>
              <option value="height_asc">키 작은 순</option>
            </select>
          </section>

          <p className="small muted">
            {filtered.length}명 표시 (전체 {profiles.length}명)
          </p>

          {filtered.length === 0 ? (
            <p className="panel center muted">조건에 맞는 회원이 없어요. 검색어나 필터를 바꿔보세요.</p>
          ) : (
            <div className="stack">
              {filtered.map((p) => {
                const male = isMale(p.gender);
                const expanded = expandedId === p.id;
                return (
                  <article key={p.id} className="member">
                    <div className="member__row">
                      <div className="row" style={{ gap: 14, minWidth: 240 }}>
                        {p.photos.length ? (
                          <button type="button" className="member__avatar" onClick={() => setPreview({ photos: p.photos, index: 0, name: p.name })} aria-label={`${p.name}님 사진 보기`}>
                            <img src={p.photos[0]} alt="" />
                            {p.photos.length > 1 && <span className="member__more">+{p.photos.length - 1}</span>}
                          </button>
                        ) : (
                          <span className="member__avatar"><Icon name="user" /></span>
                        )}
                        <div>
                          <div className="row row--wrap">
                            <strong>{p.name}</strong>
                            <span className="muted small">{p.nickname}</span>
                            <span className={`tag ${male ? 'tag--male' : 'tag--female'}`}>{male ? '남성' : '여성'}</span>
                          </div>
                          <div className="small muted">
                            {[p.age, p.height && `${p.height}cm`, p.location, p.mbti].filter(Boolean).join(', ')}
                          </div>
                        </div>
                      </div>
                      <div className="row row--wrap">
                        <strong>{p.phone}</strong>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => { navigator.clipboard.writeText(p.phone); showToast(`${p.name}님의 번호를 복사했어요.`); }}>
                          <Icon name="copy" /> 복사
                        </button>
                        <a className="btn btn--ghost btn--sm" href={`tel:${p.phone}`}>
                          <Icon name="phone" /> 전화
                        </a>
                      </div>
                      <div className="row">
                        <button type="button" className="btn btn--quiet btn--sm" aria-expanded={expanded} onClick={() => setExpandedId(expanded ? null : p.id)}>
                          {expanded ? '접기' : '자세히'}
                        </button>
                        <button type="button" className="btn btn--danger btn--sm" onClick={() => setDeleting(p)}>
                          <Icon name="trash" /> 삭제
                        </button>
                      </div>
                    </div>
                    {expanded && (
                      <div className="member__detail">
                        <div className="panel stack small">
                          <span className="label">나에 대하여</span>
                          <p className="pre">{p.selfIntro || '작성하지 않았어요.'}</p>
                        </div>
                        <div className="panel stack small">
                          <span className="label">바라는 사람</span>
                          <p className="pre">{p.preferredPartnerDetail || '작성하지 않았어요.'}</p>
                          {p.preferredAppearanceDetail && <p className="muted">외모 취향: {p.preferredAppearanceDetail}</p>}
                        </div>
                        <div className="panel stack small">
                          <span className="label">끌리는 인상</span>
                          <div className="chips">
                            {p.preferredAnimals.length ? p.preferredAnimals.map((a) => <span key={a} className="tag tag--gold">{a}</span>) : <span className="muted">선택 안 함</span>}
                          </div>
                          <p className="dim">가입: {p.created_at ? new Date(p.created_at).toLocaleString('ko-KR') : '-'}</p>
                          <p className="dim">ID: {p.id}</p>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal open={Boolean(preview)} onClose={() => setPreview(null)} wide title={preview ? `${preview.name}님의 사진 ${preview.index + 1}/${preview.photos.length}` : ''}>
        {preview && (
          <>
            <div style={{ position: 'relative' }}>
              <img src={preview.photos[preview.index]} alt="" style={{ width: '100%', maxHeight: '62vh', objectFit: 'contain', borderRadius: 12 }} />
              {preview.photos.length > 1 && (
                <>
                  <button type="button" className="carousel-btn carousel-btn--prev" aria-label="이전 사진"
                    onClick={() => setPreview({ ...preview, index: (preview.index - 1 + preview.photos.length) % preview.photos.length })}>
                    <Icon name="back" />
                  </button>
                  <button type="button" className="carousel-btn carousel-btn--next" aria-label="다음 사진"
                    onClick={() => setPreview({ ...preview, index: (preview.index + 1) % preview.photos.length })}>
                    <Icon name="next" />
                  </button>
                </>
              )}
            </div>
            {preview.photos.length > 1 && (
              <div className="thumbs" style={{ justifyContent: 'center' }}>
                {preview.photos.map((src, i) => (
                  <button key={src} type="button" className="thumb" aria-pressed={i === preview.index} aria-label={`사진 ${i + 1}`} onClick={() => setPreview({ ...preview, index: i })}>
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="프로필을 삭제할까요?"
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setDeleting(null)}>취소</button>
            <button type="button" className="btn btn--danger" onClick={deleteProfile}>삭제</button>
          </>
        }
      >
        {deleting && (
          <p>
            <strong>{deleting.name}</strong> ({deleting.phone})님의 프로필이 데이터베이스에서 영구 삭제돼요. 되돌릴 수 없어요.
          </p>
        )}
      </Modal>

      <Toast message={toast} />
    </main>
  );
}
