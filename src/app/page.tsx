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
import AdminProfileModal from '@/components/AdminProfileModal';

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
};

const STEP_TITLES: Record<number, string> = {
  1: '기본 인적사항',
  2: '성별 및 출생연도',
  3: '키 및 연락처',
  4: '사는 곳 (구)',
  5: '선호하는 동물상',
  6: '선호하는 이성 (자세히)',
  7: '자기소개 (자세히)',
  8: '최종 확인 및 제출',
};

export default function ProfilePage() {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<ProfileData>(INITIAL_PROFILE);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [receiptId, setReceiptId] = useState<string>('');
  const [isDemoSubmission, setIsDemoSubmission] = useState<boolean>(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(false);

  // Restore draft from localStorage on initial load
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('profile_form_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        setFormData((prev) => ({ ...prev, ...parsed }));
      }
      const savedVerified = localStorage.getItem('profile_phone_verified');
      if (savedVerified === 'true') {
        setIsPhoneVerified(true);
      }
    } catch (e) {
      console.log('No draft found', e);
    }
  }, []);

  // Save draft whenever formData changes (except on success)
  useEffect(() => {
    if (step <= TOTAL_STEPS) {
      try {
        localStorage.setItem('profile_form_draft', JSON.stringify(formData));
      } catch (e) {
        console.error('Failed to save draft:', e);
      }
    }
  }, [formData, step]);

  const updateFormData = (fields: Partial<ProfileData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
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
          formData.height <= 230 &&
          formData.phone.replace(/[^0-9]/g, '').length >= 10 &&
          isPhoneVerified
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
        if (formData.phone.replace(/[^0-9]/g, '').length < 10) return "전화번호를 '-' 없이 10~11자리 숫자로 입력해주세요.";
        if (!isPhoneVerified) return '옥토모(OCTOMO) 문자로 전화번호 점유 인증을 완료해주세요.';
        return '';
      case 4:
        if (!formData.location.trim()) return '거주 지역(구)을 선택하거나 입력해주세요.';
        return '';
      case 5:
        if (formData.preferredAnimals.length === 0) return '선호하는 동물상을 1개 이상 선택해주세요.';
        return '';
      case 6:
        if (formData.preferredPartnerDetail.trim().length < 5) return '자세히 작성해야 채택될 확률이 올라갑니다.';
        return '';
      case 7:
        if (formData.selfIntro.trim().length < 5) return '본인 소개를 5자 이상 적어주세요.';
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
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || '제출 중 오류가 발생했습니다.');
      }

      // Save to local backup list as well
      const record = {
        id: result.data?.id || 'prf-' + Date.now(),
        name: formData.name,
        nickname: formData.nickname,
        phone: formData.phone,
        gender: formData.gender,
        age: formData.age,
        height: Number(formData.height),
        location: formData.location,
        preferred_animals: formData.preferredAnimals,
        preferred_appearance_detail: formData.preferredAppearanceDetail,
        preferred_partner_detail: formData.preferredPartnerDetail,
        self_intro: formData.selfIntro,
        created_at: new Date().toISOString(),
      };

      const existingLocal = localStorage.getItem('submitted_profiles');
      const list = existingLocal ? JSON.parse(existingLocal) : [];
      list.unshift(record);
      localStorage.setItem('submitted_profiles', JSON.stringify(list));

      // Clear draft
      localStorage.removeItem('profile_form_draft');
      localStorage.removeItem('profile_phone_verified');

      setReceiptId(record.id);
      setIsDemoSubmission(Boolean(result.isDemo));
      setStep(9); // Move to Success screen
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '서버 오류가 발생했습니다.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_PROFILE);
    localStorage.removeItem('profile_form_draft');
    localStorage.removeItem('profile_phone_verified');
    setIsPhoneVerified(false);
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="app-container">
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

        <button
          type="button"
          onClick={() => setIsAdminModalOpen(true)}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'var(--text-muted)',
            borderRadius: '999px',
            padding: '6px 14px',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          📋 접수 목록
        </button>
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
            phone={formData.phone}
            isPhoneVerified={isPhoneVerified}
            onPhoneVerifyChange={(verified) => {
              setIsPhoneVerified(verified);
              try {
                localStorage.setItem('profile_phone_verified', verified ? 'true' : 'false');
              } catch (e) {
                console.error(e);
              }
            }}
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
            data={formData}
            onGoToStep={(targetStep) => setStep(targetStep)}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            errorMessage={submitError}
          />
        )}

        {step === 9 && (
          <StepSuccess
            data={formData}
            receiptId={receiptId}
            isDemo={isDemoSubmission}
            onReset={handleReset}
            onViewList={() => setIsAdminModalOpen(true)}
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
                <span>다음</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Footer info */}
      <footer
        style={{
          marginTop: '32px',
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--text-dim)',
          maxWidth: '480px',
          lineHeight: '1.6',
        }}
      >
        모든 프로필 정보는 안전하게 암호화되어 관리되며, 매칭 목적 이외의 용도로는 사용되지 않습니다.
        <br />
        Powered by Vercel & Supabase
      </footer>

      {/* Admin / Submissions Modal */}
      <AdminProfileModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />
    </main>
  );
}
