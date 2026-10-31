'use client';

import { useCallback, useEffect, useState } from 'react';
import { ProfileData } from '@/lib/types';
import { digitsOnly } from '@/lib/format';
import LoginScreen from '@/components/LoginScreen';
import MyProfileCard from '@/components/MyProfileCard';
import NavigationDrawer, { type MainTab } from '@/components/NavigationDrawer';
import EventsSection from '@/components/EventsSection';
import EventRoomModal from '@/components/EventRoomModal';
import { Icon, OrbitMark } from '@/components/ui';
import {
  Constellation,
  STEP_TITLES,
  StepAnimal,
  StepBasics,
  StepGenderAge,
  StepHeight,
  StepLocation,
  StepPartner,
  StepReview,
  StepSelf,
  StepSuccess,
  isValidHeight,
} from '@/components/onboarding';

const TOTAL_STEPS = STEP_TITLES.length;
// UI hint only (prefills the event apply form); the session itself is an HttpOnly cookie.
const SESSION_KEY = 'orbit_auth_phone';
const DRAFT_KEY = 'profile_form_draft';

const INITIAL_PROFILE: ProfileData = {
  name: '',
  nickname: '',
  phone: '',
  gender: '',
  age: '',
  height: '',
  location: '',
  mbti: '',
  preferredAnimals: [],
  preferredAppearanceDetail: '',
  preferredPartnerDetail: '',
  selfIntro: '',
  photos: [],
};

type ViewMode = 'LOADING' | 'LOGIN' | 'REGISTER' | 'MY_PROFILE';

/** Returns what is still missing on a step, or '' when the step is complete. */
function missingOnStep(step: number, d: ProfileData): string {
  switch (step) {
    case 1:
      return !d.name.trim() ? '이름을 입력해주세요.' : !d.nickname.trim() ? '닉네임을 입력해주세요.' : '';
    case 2:
      return !d.gender ? '성별을 골라주세요.' : digitsOnly(d.age).length < 2 ? '태어난 해를 입력해주세요.' : '';
    case 3:
      return isValidHeight(d.height) ? '' : '키를 120~230cm 사이로 입력해주세요.';
    case 4:
      return d.location.trim() ? '' : '사는 구를 골라주세요.';
    case 5:
      return d.preferredAnimals.length ? '' : '끌리는 인상을 1개 이상 골라주세요.';
    case 6:
      return d.preferredPartnerDetail.trim().length >= 5 ? '' : '바라는 사람을 5자 이상 적어주세요.';
    case 7:
      return d.selfIntro.trim().length >= 5 ? '' : '나에 대해 5자 이상 적어주세요.';
    default:
      return '';
  }
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<MainTab>('PROFILE');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRoomOpen, setIsRoomOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('LOADING');
  const [authPhone, setAuthPhone] = useState('');
  const [memberProfile, setMemberProfile] = useState<ProfileData | null>(null);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ProfileData>(INITIAL_PROFILE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const startRegistration = (phone: string) => {
    let draft: Partial<ProfileData> = {};
    try {
      draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}');
    } catch {
      // ignore a corrupt draft
    }
    setFormData({ ...INITIAL_PROFILE, ...draft, phone });
    setStep(1);
    setViewMode('REGISTER');
  };

  // Restore the session from the member cookie; 401 means not logged in.
  useEffect(() => {
    fetch('/api/profile')
      .then((res) => res.json())
      .then((result) => {
        if (!result.success || !result.phone) return setViewMode('LOGIN');
        setAuthPhone(result.phone);
        if (result.exists && result.data) {
          setMemberProfile(result.data);
          setViewMode('MY_PROFILE');
        } else {
          startRegistration(result.phone);
        }
      })
      .catch(() => setViewMode('LOGIN'));
  }, []);

  useEffect(() => {
    if (viewMode === 'REGISTER' && !isDone) localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData, viewMode, isDone]);

  const updateFormData = useCallback((fields: Partial<ProfileData>) => setFormData((prev) => ({ ...prev, ...fields })), []);

  const handleLoginSuccess = ({ phone, profile }: { phone: string; profile: ProfileData | null }) => {
    localStorage.setItem(SESSION_KEY, phone);
    setAuthPhone(phone);
    if (profile) {
      setMemberProfile(profile);
      setViewMode('MY_PROFILE');
    } else {
      setMemberProfile(null);
      startRegistration(phone);
    }
  };

  const handleLogout = () => {
    fetch('/api/member/logout', { method: 'POST' }).catch(() => {});
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(DRAFT_KEY);
    setAuthPhone('');
    setMemberProfile(null);
    setFormData(INITIAL_PROFILE);
    setStep(1);
    setIsDone(false);
    setViewMode('LOGIN');
  };

  const goTo = (target: number) => {
    setStep(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const missing = missingOnStep(step, formData);
  const handleNext = () => {
    if (!missing && step < TOTAL_STEPS) goTo(step + 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const payload = { ...formData, phone: authPhone || formData.phone };
      const result = await (
        await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      ).json();
      if (!result.success) throw new Error(result.error || '등록하지 못했어요. 잠시 후 다시 시도해주세요.');

      localStorage.removeItem(DRAFT_KEY);
      setMemberProfile({ ...payload, id: result.data?.[0]?.id, height: Number(formData.height), created_at: new Date().toISOString() });
      setIsDemo(Boolean(result.isDemo));
      setIsDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '등록하지 못했어요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const chrome = (
    <>
      <div className="topbar">
        <button type="button" className="icon-btn" onClick={() => setIsMenuOpen(true)} aria-label="메뉴 열기">
          <Icon name="menu" />
        </button>
        <span className="brand">
          <OrbitMark /> Orbit
        </span>
        {viewMode === 'REGISTER' && activeTab === 'PROFILE' ? (
          <button type="button" className="icon-btn" onClick={handleLogout} aria-label="로그아웃">
            <Icon name="logout" />
          </button>
        ) : (
          <span style={{ width: 44 }} />
        )}
      </div>
      <NavigationDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} activeTab={activeTab} onSelectTab={setActiveTab} onOpenRoom={() => setIsRoomOpen(true)} />
      <EventRoomModal open={isRoomOpen} onClose={() => setIsRoomOpen(false)} />
    </>
  );

  if (activeTab === 'EVENTS') {
    return (
      <main className="shell">
        {chrome}
        <EventsSection onGoToProfile={() => setActiveTab('PROFILE')} />
      </main>
    );
  }

  if (viewMode === 'LOADING') {
    return (
      <main className="shell">
        {chrome}
        <p className="center muted" role="status">
          <Icon name="refresh" className="icon spin" /> 프로필을 불러오는 중
        </p>
      </main>
    );
  }

  if (viewMode === 'LOGIN') {
    return (
      <main className="shell">
        {chrome}
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </main>
    );
  }

  if (viewMode === 'MY_PROFILE' && memberProfile) {
    return (
      <main className="shell">
        {chrome}
        <MyProfileCard profile={memberProfile} onUpdate={setMemberProfile} onLogout={handleLogout} />
      </main>
    );
  }

  return (
    <main className="shell">
      {chrome}
      {!isDone && <Constellation step={step} />}

      <section className="sheet stack stack--lg" key={isDone ? 'done' : step} style={{ animation: 'rise 0.3s var(--ease)' }}>
        {isDone ? (
          <StepSuccess data={formData} isDemo={isDemo} onViewMyProfile={() => setViewMode('MY_PROFILE')} />
        ) : (
          <>
            {step === 1 && <StepBasics data={formData} onChange={updateFormData} onEnter={handleNext} />}
            {step === 2 && <StepGenderAge data={formData} onChange={updateFormData} onEnter={handleNext} />}
            {step === 3 && <StepHeight data={formData} phone={authPhone || formData.phone} onChange={updateFormData} onEnter={handleNext} />}
            {step === 4 && <StepLocation data={formData} onChange={updateFormData} />}
            {step === 5 && <StepAnimal data={formData} onChange={updateFormData} />}
            {step === 6 && <StepPartner data={formData} onChange={updateFormData} />}
            {step === 7 && <StepSelf data={formData} onChange={updateFormData} />}
            {step === 8 && (
              <StepReview
                data={{ ...formData, phone: authPhone || formData.phone }}
                onGoToStep={goTo}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                error={submitError}
              />
            )}

            {step < TOTAL_STEPS && (
              <div className="stack">
                {missing && <p className="hint">{missing}</p>}
                <div className="row">
                  {step > 1 && (
                    <button type="button" className="btn btn--ghost" onClick={() => goTo(step - 1)}>
                      이전
                    </button>
                  )}
                  <button type="button" className="btn btn--primary" style={{ flex: 1 }} disabled={Boolean(missing)} onClick={handleNext}>
                    다음
                  </button>
                </div>
              </div>
            )}
            {step === TOTAL_STEPS && (
              <button type="button" className="btn btn--quiet" onClick={() => goTo(step - 1)}>
                <Icon name="back" /> 이전 단계로
              </button>
            )}
          </>
        )}
      </section>

      <p className="center small dim">개인정보는 매칭 목적으로만 보관돼요.</p>
    </main>
  );
}
