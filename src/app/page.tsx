'use client';

import { useState, useEffect } from 'react';
import { ProfileData } from '@/lib/types';
import ProgressBar from '@/components/ProgressBar';
import StepNameNickname from '@/components/StepNameNickname';
import StepGenderAge from '@/components/StepGenderAge';
import StepHeightPhone from '@/components/StepHeightPhone';
import StepLocation from '@/components/StepLocation';
import StepAnimalType from '@/components/StepAnimalType';
import StepPartnerDetail from '@/components/StepPartnerDetail';
import StepSelfIntro from '@/components/StepSelfIntro';
import StepReview from '@/components/StepReview';
import StepSuccess from '@/components/StepSuccess';
import LoginScreen from '@/components/LoginScreen';
import MyProfileCard from '@/components/MyProfileCard';
import NavigationDrawer from '@/components/NavigationDrawer';
import EventsSection from '@/components/EventsSection';

const TOTAL_STEPS = 8;

const INITIAL_PROFILE: ProfileData = {
  name: '',
  nickname: '',
  phone: '',
  gender: '',
  age: '',
  height: '',
  location: '',
  preferredAnimals: [],
  preferredAppearanceDetail: '',
  preferredPartnerDetail: '',
  selfIntro: '',
  photos: [],
};

const STEP_TITLES: Record<number, string> = {
  1: '기본 인적사항',
  2: '성별 및 출생연도',
  3: '키 (신체 스펙)',
  4: '사는 곳 (구)',
  5: '선호하는 동물상',
  6: '선호하는 이성 (자세히)',
  7: '자기소개 (자세히)',
  8: '최종 확인 및 제출',
};

type ViewMode = 'LOADING' | 'LOGIN' | 'REGISTER' | 'MY_PROFILE';
type MainTab = 'PROFILE' | 'EVENTS';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<MainTab>('PROFILE');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('LOADING');
  const [authPhone, setAuthPhone] = useState<string>('');
  const [memberProfile, setMemberProfile] = useState<ProfileData | null>(null);

  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<ProfileData>(INITIAL_PROFILE);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [receiptId, setReceiptId] = useState<string>('');
  const [isDemoSubmission, setIsDemoSubmission] = useState<boolean>(false);

  // Initial check: Restore session by authenticated phone
  useEffect(() => {
    const checkAuthSession = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const queryPhone = urlParams.get('login') || urlParams.get('phone');
        const storedPhone = queryPhone || localStorage.getItem('orbit_auth_phone');
        if (storedPhone) {
          if (queryPhone) {
            localStorage.setItem('orbit_auth_phone', queryPhone);
          }
          const res = await fetch(`/api/profile?phone=${storedPhone}`);
          const result = await res.json();
          if (result.exists && result.data) {
            const queryPhoto = urlParams.get('photo');
            if (queryPhoto && (!result.data.photos || result.data.photos.length === 0)) {
              result.data.photos = [
                queryPhoto === 'demo'
                  ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'
                  : queryPhoto,
              ];
            }
            setAuthPhone(storedPhone);
            setMemberProfile(result.data);
            setViewMode('MY_PROFILE');
            return;
          } else {
            // Phone authenticated, but no profile registered yet
            setAuthPhone(storedPhone);
            setFormData((prev) => ({ ...prev, phone: storedPhone }));
            const savedDraft = localStorage.getItem('profile_form_draft');
            if (savedDraft) {
              setFormData((prev) => ({ ...prev, ...JSON.parse(savedDraft), phone: storedPhone }));
            }
            setViewMode('REGISTER');
            return;
          }
        }
      } catch (e) {
        console.error('Session restore error:', e);
      }
      setViewMode('LOGIN');
    };

    checkAuthSession();
  }, []);

  // Save draft whenever formData changes (during registration)
  useEffect(() => {
    if (viewMode === 'REGISTER' && step <= TOTAL_STEPS) {
      try {
        localStorage.setItem('profile_form_draft', JSON.stringify(formData));
      } catch (e) {
        console.error('Failed to save draft:', e);
      }
    }
  }, [formData, step, viewMode]);

  const updateFormData = (fields: Partial<ProfileData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  // Login handler
  const handleLoginSuccess = ({
    phone,
    profile,
    isNewUser,
  }: {
    phone: string;
    profile: ProfileData | null;
    isNewUser: boolean;
  }) => {
    localStorage.setItem('orbit_auth_phone', phone);
    setAuthPhone(phone);

    if (!isNewUser && profile) {
      setMemberProfile(profile);
      setViewMode('MY_PROFILE');
    } else {
      setMemberProfile(null);
      setFormData((prev) => ({ ...prev, phone }));
      setStep(1);
      setViewMode('REGISTER');
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('orbit_auth_phone');
    localStorage.removeItem('profile_form_draft');
    localStorage.removeItem('profile_phone_verified');
    setAuthPhone('');
    setMemberProfile(null);
    setFormData(INITIAL_PROFILE);
    setStep(1);
    setViewMode('LOGIN');
  };

  // Validation per step
  const isCurrentStepValid = (): boolean => {
    switch (step) {
      case 1:
        return formData.name.trim().length > 0 && formData.nickname.trim().length > 0;
      case 2:
        return (
          (formData.gender === '남성' || formData.gender === '여성') &&
          formData.age.replace(/[^0-9]/g, '').length >= 2
        );
      case 3:
        return (
          typeof formData.height === 'number' &&
          formData.height >= 120 &&
          formData.height <= 230
        );
      case 4:
        return formData.location.trim().length > 0;
      case 5:
        return formData.preferredAnimals.length > 0;
      case 6:
        return formData.preferredPartnerDetail.trim().length >= 5;
      case 7:
        return formData.selfIntro.trim().length >= 5;
      case 8:
        return true;
      default:
        return false;
    }
  };

  const getStepIncompleteHint = (): string => {
    switch (step) {
      case 1:
        if (!formData.name.trim()) return '이름을 입력해주세요.';
        if (!formData.nickname.trim()) return '닉네임을 입력해주세요.';
        return '';
      case 2:
        if (!formData.gender) return '성별(남/여)을 선택해주세요.';
        if (formData.age.replace(/[^0-9]/g, '').length < 2) return '출생연도 숫자(예: 98 또는 1998)를 입력해주세요.';
        return '';
      case 3:
        if (!formData.height || formData.height < 120) return '키(cm)를 입력해주세요.';
        return '';
      case 4:
        if (!formData.location.trim()) return '거주 지역(구)을 선택하거나 입력해주세요.';
        return '';
      case 5:
        if (formData.preferredAnimals.length === 0) return '선호하는 동물상을 1개 이상 선택해주세요.';
        return '';
      case 6:
        return '';
      case 7:
        return '';
      default:
        return '';
    }
  };

  const handleNext = () => {
    if (isCurrentStepValid() && step < TOTAL_STEPS) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const submitPayload = {
        ...formData,
        phone: authPhone || formData.phone,
      };

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitPayload),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || '제출 중 오류가 발생했습니다.');
      }

      const record: ProfileData = {
        id: result.data?.id || 'prf-' + Date.now(),
        name: formData.name,
        nickname: formData.nickname,
        phone: submitPayload.phone,
        gender: formData.gender,
        age: formData.age,
        height: Number(formData.height),
        location: formData.location,
        preferredAnimals: formData.preferredAnimals,
        preferredAppearanceDetail: formData.preferredAppearanceDetail,
        preferredPartnerDetail: formData.preferredPartnerDetail,
        selfIntro: formData.selfIntro,
        photos: formData.photos || [],
        created_at: new Date().toISOString(),
      };

      // Save to local backup list
      const existingLocal = localStorage.getItem('submitted_profiles');
      const list = existingLocal ? JSON.parse(existingLocal) : [];
      list.unshift(record);
      localStorage.setItem('submitted_profiles', JSON.stringify(list));

      // Clear draft
      localStorage.removeItem('profile_form_draft');

      setReceiptId(record.id || '');
      setMemberProfile(record);
      setIsDemoSubmission(Boolean(result.isDemo));
      setStep(9); // Success screen
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '서버 오류가 발생했습니다.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({ ...INITIAL_PROFILE, phone: authPhone });
    localStorage.removeItem('profile_form_draft');
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reusable Top-Left Menu Trigger Button
  const renderMenuTrigger = () => (
    <button
      type="button"
      onClick={() => setIsMenuOpen(true)}
      aria-label="서비스 메뉴 열기"
      style={{
        position: 'fixed',
        top: '18px',
        left: '18px',
        zIndex: 900,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.16)',
        borderRadius: '999px',
        padding: '8px 14px',
        color: '#fff',
        fontSize: '13px',
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), 0 0 16px rgba(14, 165, 233, 0.15)',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <span style={{ display: 'flex', flexDirection: 'column', gap: '3.5px', width: '15px' }}>
        <span style={{ width: '100%', height: '2px', background: '#fff', borderRadius: '2px' }} />
        <span
          style={{
            width: '65%',
            height: '2px',
            background: activeTab === 'EVENTS' ? '#38bdf8' : '#ff4370',
            borderRadius: '2px',
          }}
        />
        <span style={{ width: '100%', height: '2px', background: '#fff', borderRadius: '2px' }} />
      </span>
      <span style={{ letterSpacing: '-0.3px' }}>메뉴</span>
      {activeTab === 'EVENTS' && (
        <span
          style={{
            fontSize: '10px',
            background: '#0ea5e9',
            color: '#fff',
            padding: '1px 6px',
            borderRadius: '999px',
            fontWeight: 800,
          }}
        >
          이벤트
        </span>
      )}
    </button>
  );

  const renderNavDrawer = () => (
    <NavigationDrawer
      isOpen={isMenuOpen}
      onClose={() => setIsMenuOpen(false)}
      activeTab={activeTab}
      onSelectTab={(tab) => setActiveTab(tab)}
    />
  );

  // 1. Ongoing Events View Tab
  if (activeTab === 'EVENTS') {
    return (
      <main className="app-container" style={{ paddingTop: '64px' }}>
        {renderMenuTrigger()}
        {renderNavDrawer()}
        <EventsSection onGoToProfile={() => setActiveTab('PROFILE')} />
      </main>
    );
  }

  // 2. Loading State
  if (viewMode === 'LOADING') {
    return (
      <main className="app-container" style={{ justifyContent: 'center', alignItems: 'center', paddingTop: '64px' }}>
        {renderMenuTrigger()}
        {renderNavDrawer()}
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px', display: 'inline-block', animation: 'spin 1.5s infinite linear' }}>
            💫
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>Orbit Profile 불러오는 중...</div>
        </div>
      </main>
    );
  }

  // 3. Login Screen View
  if (viewMode === 'LOGIN') {
    return (
      <main className="app-container" style={{ justifyContent: 'center', alignItems: 'center', paddingTop: '64px' }}>
        {renderMenuTrigger()}
        {renderNavDrawer()}
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </main>
    );
  }

  // 4. Existing Member: My Profile Card View
  if (viewMode === 'MY_PROFILE' && memberProfile) {
    return (
      <main className="app-container" style={{ paddingTop: '64px' }}>
        {renderMenuTrigger()}
        {renderNavDrawer()}
        <MyProfileCard
          profile={memberProfile}
          onUpdate={(updated) => setMemberProfile(updated)}
          onLogout={handleLogout}
        />
      </main>
    );
  }

  // 5. New Member: Registration Flow
  return (
    <main className="app-container" style={{ paddingTop: '64px' }}>
      {renderMenuTrigger()}
      {renderNavDrawer()}
      {/* Top Navigation Brand */}
      <header
        style={{
          width: '100%',
          maxWidth: '580px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #ff4370 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              boxShadow: '0 0 15px rgba(255, 67, 112, 0.4)',
            }}
          >
            💫
          </div>
          <span style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.3px', color: '#fff' }}>
            Orbit <span style={{ color: '#ff4370' }}>Profile</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-dim)',
              borderRadius: '999px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* Progress Bar (Visible during steps 1 to 8) */}
      {step <= TOTAL_STEPS && (
        <ProgressBar
          currentStep={step}
          totalSteps={TOTAL_STEPS}
          stepTitle={STEP_TITLES[step]}
        />
      )}

      {/* Main Form Card */}
      <section className="profile-card">
        {step === 1 && (
          <StepNameNickname
            name={formData.name}
            nickname={formData.nickname}
            onChange={updateFormData}
            onEnter={handleNext}
          />
        )}

        {step === 2 && (
          <StepGenderAge
            gender={formData.gender}
            age={formData.age}
            onChange={updateFormData}
            onEnter={handleNext}
          />
        )}

        {step === 3 && (
          <StepHeightPhone
            height={formData.height}
            phone={formData.phone || authPhone}
            onChange={updateFormData}
            onEnter={handleNext}
          />
        )}

        {step === 4 && (
          <StepLocation
            location={formData.location}
            onChange={updateFormData}
            onEnter={handleNext}
          />
        )}

        {step === 5 && (
          <StepAnimalType
            preferredAnimals={formData.preferredAnimals}
            preferredAppearanceDetail={formData.preferredAppearanceDetail}
            onChange={updateFormData}
            onEnter={handleNext}
          />
        )}

        {step === 6 && (
          <StepPartnerDetail
            detail={formData.preferredPartnerDetail}
            onChange={updateFormData}
          />
        )}

        {step === 7 && (
          <StepSelfIntro
            selfIntro={formData.selfIntro}
            onChange={updateFormData}
          />
        )}

        {step === 8 && (
          <StepReview
            data={{ ...formData, phone: authPhone || formData.phone }}
            onGoToStep={(targetStep) => setStep(targetStep)}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            errorMessage={submitError}
          />
        )}

        {step === 9 && (
          <StepSuccess
            data={{ ...formData, phone: authPhone || formData.phone }}
            receiptId={receiptId}
            isDemo={isDemoSubmission}
            onReset={handleReset}
            onViewMyProfile={() => setViewMode('MY_PROFILE')}
          />
        )}

        {/* Action Navigation Buttons (Steps 1 to 7) */}
        {step < 8 && (
          <div>
            {!isCurrentStepValid() && getStepIncompleteHint() && (
              <div
                style={{
                  fontSize: '12.5px',
                  color: '#ff85a1',
                  textAlign: 'right',
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '4px',
                }}
              >
                <span>ℹ️</span>
                <span>{getStepIncompleteHint()}</span>
              </div>
            )}

            <div className="action-buttons">
              {step > 1 ? (
                <button
                  type="button"
                  id="btn-prev"
                  className="btn-prev"
                  onClick={handlePrev}
                >
                  ← 이전
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                id="btn-next"
                className="btn-next"
                disabled={!isCurrentStepValid()}
                onClick={handleNext}
              >
                다음 단계 →
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Footer Info */}
      <footer style={{ marginTop: '30px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
        <p>© 2026 Orbit Profile · 개인정보는 매칭 목적으로만 안전하게 보관됩니다.</p>
      </footer>
    </main>
  );
}
