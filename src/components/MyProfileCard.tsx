'use client';

import { useState } from 'react';
import { ProfileData, ANIMAL_OPTIONS } from '@/lib/types';
import StepLocation from './StepLocation';

interface Props {
  profile: ProfileData;
  onUpdate: (updated: ProfileData) => void;
  onLogout: () => void;
}

export default function MyProfileCard({ profile, onUpdate, onLogout }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ProfileData>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAnimalToggle = (animalLabel: string) => {
    setEditData((prev) => {
      const current = prev.preferredAnimals || [];
      if (current.includes(animalLabel)) {
        return { ...prev, preferredAnimals: current.filter((a) => a !== animalLabel) };
      }
      return { ...prev, preferredAnimals: [...current, animalLabel] };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || '수정 중 오류가 발생했습니다.');
      }

      onUpdate(result.data || editData);
      setSaveMessage({ type: 'success', text: '프로필이 성공적으로 수정되었습니다!' });
      setIsEditing(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '저장 실패';
      setSaveMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(profile);
    setIsEditing(false);
    setSaveMessage(null);
  };

  return (
    <div className="animate-fade" style={{ width: '100%', maxWidth: '580px', margin: '0 auto' }}>
      {/* Top Controls */}
      <div
        style={{
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
            }}
          >
            💫
          </div>
          <span style={{ fontSize: '17px', fontWeight: 800, color: '#fff' }}>
            내 프로필 <span style={{ color: '#ff4370' }}>카드</span>
          </span>
        </div>

        <button
          type="button"
          onClick={onLogout}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: 'var(--text-muted)',
            borderRadius: '999px',
            padding: '6px 14px',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          🚪 로그아웃
        </button>
      </div>

      {saveMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            marginBottom: '16px',
            background: saveMessage.type === 'success' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: saveMessage.type === 'success' ? '#34d399' : '#fca5a5',
            border: `1px solid ${saveMessage.type === 'success' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          }}
        >
          {saveMessage.text}
        </div>
      )}

      {/* VIEW MODE */}
      {!isEditing ? (
        <div className="profile-card">
          {/* Card Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', margin: 0 }}>
                  {profile.nickname}
                </h2>
                <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>({profile.name})</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '11.5px',
                    padding: '2px 9px',
                    borderRadius: '20px',
                    background: profile.gender === '남성' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(236, 72, 153, 0.2)',
                    color: profile.gender === '남성' ? '#93c5fd' : '#f9a8d4',
                    fontWeight: 600,
                  }}
                >
                  {profile.gender} · {String(profile.age).endsWith('년생') ? profile.age : `${profile.age}년생`}
                </span>
                <span
                  style={{
                    fontSize: '11.5px',
                    padding: '2px 9px',
                    borderRadius: '20px',
                    background: 'rgba(52, 211, 153, 0.15)',
                    color: '#34d399',
                    fontWeight: 600,
                  }}
                >
                  ✓ 옥토모 인증 완료
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditing(true)}
              style={{
                background: 'linear-gradient(135deg, #ff4370 0%, #8b5cf6 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(255, 67, 112, 0.3)',
              }}
            >
              ✏️ 프로필 수정
            </button>
          </div>

          {/* Quick Specs Grid */}
          <div className="summary-box" style={{ marginBottom: '16px' }}>
            <div className="summary-row">
              <span className="summary-key">키 (신장)</span>
              <span className="summary-val">{profile.height} cm</span>
            </div>
            <div className="summary-row">
              <span className="summary-key">거주 지역</span>
              <span className="summary-val">{profile.location}</span>
            </div>
            <div className="summary-row">
              <span className="summary-key">연락처</span>
              <span className="summary-val">{profile.phone}</span>
            </div>
          </div>

          {/* Preferences and Bio */}
          <div className="summary-box" style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '14px' }}>
              <span className="summary-key" style={{ display: 'block', marginBottom: '8px' }}>선호하는 동물상</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {profile.preferredAnimals && profile.preferredAnimals.length > 0 ? (
                  profile.preferredAnimals.map((animal) => (
                    <span
                      key={animal}
                      style={{
                        fontSize: '12px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: 'rgba(255, 67, 112, 0.15)',
                        color: '#ff85a1',
                        border: '1px solid rgba(255, 67, 112, 0.3)',
                        fontWeight: 600,
                      }}
                    >
                      {animal}
                    </span>
                  ))
                ) : (
                  <span style={{ color: 'var(--text-dim)', fontSize: '13px' }}>상관없음</span>
                )}
              </div>
            </div>

            {profile.preferredAppearanceDetail && (
              <div style={{ marginBottom: '14px' }}>
                <span className="summary-key" style={{ display: 'block', marginBottom: '4px' }}>
                  원하는 외적인 구체상
                </span>
                <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-main)', lineHeight: 1.6, background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '10px' }}>
                  {profile.preferredAppearanceDetail}
                </p>
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <span className="summary-key" style={{ display: 'block', marginBottom: '4px' }}>
                선호하는 이성 (자세히)
              </span>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-line', background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '10px' }}>
                {profile.preferredPartnerDetail}
              </p>
            </div>

            <div>
              <span className="summary-key" style={{ display: 'block', marginBottom: '4px' }}>
                본인은 어떤 사람인가 (자세히)
              </span>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-line', background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '10px' }}>
                {profile.selfIntro}
              </p>
            </div>
          </div>

          {/* Matching Status */}
          <div
            style={{
              padding: '16px',
              borderRadius: '14px',
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#c4b5fd', marginBottom: '4px' }}>
              ✨ 1:1 인연 매칭 접수 완료 상태
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
              등록된 조건에 부합하는 멋진 인연이 매칭되면 안내 문자가 발송됩니다.
            </p>
          </div>
        </div>
      ) : (
        /* EDIT MODE */
        <div className="profile-card">
          <div className="card-badge" style={{ marginBottom: '12px' }}>EDIT MODE · 프로필 수정</div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '18px' }}>
            내 프로필 정보 수정하기
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 닉네임 */}
            <div className="form-group">
              <label className="form-label">프로필 닉네임</label>
              <input
                type="text"
                className="form-input"
                value={editData.nickname}
                onChange={(e) => setEditData({ ...editData, nickname: e.target.value })}
                maxLength={20}
              />
            </div>

            {/* 키 */}
            <div className="form-group">
              <label className="form-label">키 (cm)</label>
              <input
                type="number"
                className="form-input"
                value={editData.height === '' ? '' : editData.height}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                  setEditData({ ...editData, height: isNaN(val as number) ? '' : val });
                }}
                min={120}
                max={230}
              />
            </div>

            {/* 거주 지역 (구 단위) */}
            <div className="form-group">
              <label className="form-label">사는 곳 (구 단위)</label>
              <StepLocation
                location={editData.location}
                onChange={({ location }) => setEditData({ ...editData, location: location || '' })}
              />
            </div>

            {/* 선호 동물상 */}
            <div className="form-group">
              <label className="form-label">선호하는 동물상</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {ANIMAL_OPTIONS.map((opt) => {
                  const isSelected = (editData.preferredAnimals || []).includes(opt.label);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleAnimalToggle(opt.label)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '20px',
                        border: isSelected ? '1px solid #ff4370' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: isSelected ? 'rgba(255, 67, 112, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        color: isSelected ? '#ff85a1' : 'var(--text-muted)',
                        fontSize: '13px',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {opt.emoji} {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 외적인 구체상 */}
            <div className="form-group">
              <label className="form-label">원하시는 외적인 구체적인 상을 설명해주세요(정보가 많아야 찾기 쉬워요)</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={editData.preferredAppearanceDetail || ''}
                onChange={(e) => setEditData({ ...editData, preferredAppearanceDetail: e.target.value })}
              />
            </div>

            {/* 선호하는 이성 */}
            <div className="form-group">
              <label className="form-label">선호하는 이성 (자세히)</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={editData.preferredPartnerDetail}
                onChange={(e) => setEditData({ ...editData, preferredPartnerDetail: e.target.value })}
              />
              <div className="char-counter">
                <span style={{ fontWeight: 700, color: '#ff85a1', fontSize: '12.5px' }}>
                  💡 자세히 작성해야 채택될 확률이 올라갑니다.
                </span>
                <span>{editData.preferredPartnerDetail.length}자</span>
              </div>
            </div>

            {/* 본인은 어떤 사람인가 */}
            <div className="form-group">
              <label className="form-label">본인은 어떤 사람인가 (자세히)</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={editData.selfIntro}
                onChange={(e) => setEditData({ ...editData, selfIntro: e.target.value })}
              />
              <div className="char-counter">
                <span style={{ fontWeight: 700, color: '#ff85a1', fontSize: '12.5px' }}>
                  💡 자세히 작성해야 채택될 확률이 올라갑니다.
                </span>
                <span>{editData.selfIntro.length}자</span>
              </div>
            </div>

            {/* Save / Cancel Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                className="btn-prev"
                onClick={handleCancel}
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={isSaving}
              >
                취소
              </button>
              <button
                type="button"
                className="btn-next"
                onClick={handleSave}
                style={{ flex: 2, justifyContent: 'center' }}
                disabled={isSaving || !editData.nickname.trim()}
              >
                {isSaving ? '저장 중...' : '💾 변경사항 저장하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
