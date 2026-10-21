'use client';

import { useState, useEffect, useRef } from 'react';
import { ProfileData, ANIMAL_OPTIONS } from '@/lib/types';
import StepLocation from './StepLocation';
import ImageEditorModal from './ImageEditorModal';

interface Props {
  profile: ProfileData;
  onUpdate: (updated: ProfileData) => void;
  onLogout: () => void;
}

// Compress client-side images before uploading/storing as base64
// Compress and optimize photo to lightweight WebP (target: ~30KB - 50KB)
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 720;
        const MAX_HEIGHT = 960;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Try high-efficiency WebP format first (typically 30~50KB)
          try {
            const webpUrl = canvas.toDataURL('image/webp', 0.72);
            if (webpUrl && webpUrl.startsWith('data:image/webp')) {
              resolve(webpUrl);
              return;
            }
          } catch {
            // WebP not supported in browser, fall back to JPEG
          }

          resolve(canvas.toDataURL('image/jpeg', 0.70));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => reject(new Error('이미지를 불러오지 못했습니다.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
    reader.readAsDataURL(file);
  });
}

// Mask phone number as 010-0xxx-xxxx as specified
function formatMaskedPhone(phoneStr: string): string {
  const digits = String(phoneStr || '').replace(/[^0-9]/g, '');
  if (digits.length >= 11) {
    const prefix = digits.slice(0, 3);
    const midFirst = digits.slice(3, 4);
    return `${prefix}-${midFirst}xxx-xxxx`;
  } else if (digits.length === 10) {
    const prefix = digits.slice(0, 3);
    const midFirst = digits.slice(3, 4);
    return `${prefix}-${midFirst}xx-xxxx`;
  }
  return '010-0xxx-xxxx';
}

export default function MyProfileCard({ profile, onUpdate, onLogout }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ProfileData>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Photo Swiper State
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photo Editor Modal State (Crop & Mosaic)
  const [editorState, setEditorState] = useState<{
    isOpen: boolean;
    pendingQueue: string[];
    currentIndex: number;
    processedUrls: string[];
  }>({
    isOpen: false,
    pendingQueue: [],
    currentIndex: 0,
    processedUrls: [],
  });

  // Sync profile photos with local storage backup so they persist reliably
  useEffect(() => {
    const cleanPhone = String(profile.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone) {
      const cached = localStorage.getItem(`orbit_photos_${cleanPhone}`);
      if (cached && (!profile.photos || profile.photos.length === 0)) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const updated = { ...profile, photos: parsed };
            onUpdate(updated);
            setEditData(updated);
          }
        } catch (e) {
          console.error('Failed to parse cached photos:', e);
        }
      }
    }
  }, [profile.phone]);

  const currentPhotos = profile.photos && profile.photos.length > 0 ? profile.photos : [];
  const editPhotos = editData.photos && editData.photos.length > 0 ? editData.photos : [];

  // Active photo for the dynamic blurred background and central display
  const activePhoto = currentPhotos[activePhotoIdx] || (currentPhotos.length > 0 ? currentPhotos[0] : null);

  // Next / Prev photo handlers
  const handlePrevPhoto = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentPhotos.length <= 1) return;
    setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : currentPhotos.length - 1));
  };

  const handleNextPhoto = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentPhotos.length <= 1) return;
    setActivePhotoIdx((prev) => (prev < currentPhotos.length - 1 ? prev + 1 : 0));
  };

  // Touch swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (currentPhotos.length <= 1) return;
    setTouchStartX(e.touches[0].clientX);
    setTouchDeltaX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || currentPhotos.length <= 1) return;
    const currentX = e.touches[0].clientX;
    setTouchDeltaX(currentX - touchStartX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || currentPhotos.length <= 1) return;
    const threshold = 40; // min swipe distance in px
    if (touchDeltaX > threshold) {
      // Swiped right -> go to prev
      setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : currentPhotos.length - 1));
    } else if (touchDeltaX < -threshold) {
      // Swiped left -> go to next
      setActivePhotoIdx((prev) => (prev < currentPhotos.length - 1 ? prev + 1 : 0));
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
  };

  // Upload photos: Read files first and open ImageEditorModal (Crop & Mosaic)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentList = isEditing ? editPhotos : currentPhotos;
    const remainingSlots = Math.max(0, 3 - currentList.length);

    if (remainingSlots <= 0) {
      setSaveMessage({ type: 'error', text: '사진은 최대 3장까지만 등록 가능합니다.' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const selectedFiles = Array.from(files).slice(0, remainingSlots);
    const readPromises = selectedFiles.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    try {
      const rawDataUrls = await Promise.all(readPromises);
      if (rawDataUrls.length > 0) {
        setEditorState({
          isOpen: true,
          pendingQueue: rawDataUrls,
          currentIndex: 0,
          processedUrls: [],
        });
      }
    } catch (err) {
      console.error('File read error:', err);
      setSaveMessage({ type: 'error', text: '사진을 읽는 중 오류가 발생했습니다.' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEditorComplete = async (editedDataUrl: string) => {
    const nextProcessed = [...editorState.processedUrls, editedDataUrl];

    if (editorState.currentIndex + 1 < editorState.pendingQueue.length) {
      // Proceed to next photo in queue
      setEditorState((prev) => ({
        ...prev,
        currentIndex: prev.currentIndex + 1,
        processedUrls: nextProcessed,
      }));
    } else {
      // All queue photos processed! Close modal and upload to Storage
      setEditorState({
        isOpen: false,
        pendingQueue: [],
        currentIndex: 0,
        processedUrls: [],
      });
      await uploadAndSavePhotos(nextProcessed);
    }
  };

  const handleEditorSkip = async (originalDataUrl: string) => {
    handleEditorComplete(originalDataUrl);
  };

  const handleEditorCancel = () => {
    setEditorState({
      isOpen: false,
      pendingQueue: [],
      currentIndex: 0,
      processedUrls: [],
    });
  };

  const uploadAndSavePhotos = async (dataUrls: string[]) => {
    setIsUploadingPhoto(true);
    setSaveMessage(null);

    try {
      const cleanPhone = String(profile.phone || '').replace(/[^0-9]/g, '');

      // Upload to Supabase Storage via /api/upload
      let uploadedUrls: string[] = [];
      try {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images: dataUrls,
            phone: cleanPhone,
          }),
        });
        const uploadResult = await uploadRes.json();
        if (uploadResult.success && Array.isArray(uploadResult.urls) && uploadResult.urls.length > 0) {
          uploadedUrls = uploadResult.urls;
        } else {
          throw new Error(uploadResult.error || '스토리지 업로드 실패');
        }
      } catch (uploadErr) {
        console.warn('Storage upload error, using fallback:', uploadErr);
        uploadedUrls = dataUrls;
      }

      const currentList = isEditing ? editPhotos : currentPhotos;
      const combined = [...currentList, ...uploadedUrls].slice(0, 3);

      if (cleanPhone) {
        localStorage.setItem(`orbit_photos_${cleanPhone}`, JSON.stringify(combined));
      }

      if (isEditing) {
        setEditData((prev) => ({ ...prev, photos: combined }));
      } else {
        // Direct save when added in view mode
        const updated = { ...profile, photos: combined };
        onUpdate(updated);
        setEditData(updated);

        // Save to DB in background
        fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        }).catch((err) => console.warn('Background photo update err:', err));
      }

      setActivePhotoIdx(combined.length - 1);
      setSaveMessage({ type: 'success', text: `사진 ${uploadedUrls.length}장이 안전하게 등록되었습니다! (최대 3장)` });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '사진 처리 실패';
      setSaveMessage({ type: 'error', text: msg });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = (idxToRemove: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetPhotos = isEditing ? editPhotos : currentPhotos;
    const filtered = targetPhotos.filter((_, idx) => idx !== idxToRemove);

    const cleanPhone = String(profile.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone) {
      localStorage.setItem(`orbit_photos_${cleanPhone}`, JSON.stringify(filtered));
    }

    if (isEditing) {
      setEditData((prev) => ({ ...prev, photos: filtered }));
    } else {
      const updated = { ...profile, photos: filtered };
      onUpdate(updated);
      setEditData(updated);
      fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch((err) => console.warn('Background photo remove err:', err));
    }

    if (activePhotoIdx >= filtered.length) {
      setActivePhotoIdx(Math.max(0, filtered.length - 1));
    }
  };

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

      const updated = result.data || editData;
      const cleanPhone = String(updated.phone || profile.phone || '').replace(/[^0-9]/g, '');
      if (cleanPhone && updated.photos) {
        localStorage.setItem(`orbit_photos_${cleanPhone}`, JSON.stringify(updated.photos));
      }

      onUpdate(updated);
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

  // Age string formatting
  const formattedAge = String(profile.age || '').endsWith('년생')
    ? profile.age
    : `${profile.age}년생`;

  return (
    <div className="animate-fade" style={{ width: '100%', maxWidth: '580px', margin: '0 auto' }}>
      {/* Hidden file input for adding photos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handlePhotoUpload}
        style={{ display: 'none' }}
      />

      {/* Top Navigation Bar */}
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
              boxShadow: '0 0 15px rgba(255, 67, 112, 0.4)',
            }}
          >
            💫
          </div>
          <span style={{ fontSize: '17px', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
            내 프로필 <span style={{ color: '#ff4370' }}>카드</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isExpanded && !isEditing && (
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                borderRadius: '999px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              ✕ 카드 접기
            </button>
          )}

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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{saveMessage.text}</span>
          <button
            type="button"
            onClick={() => setSaveMessage(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '14px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. COMPACT PROFILE CARD VIEW (Photo Backdrop Gradient Aesthetic)          */}
      {/* ========================================================================= */}
      {!isExpanded && !isEditing ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Outer Glass Card Container */}
          <div
            onClick={() => setIsExpanded(true)}
            role="button"
            tabIndex={0}
            style={{
              width: '100%',
              maxWidth: '380px',
              borderRadius: '38px',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease',
              userSelect: 'none',
              overflow: 'hidden',
              zIndex: 2,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 32px 75px rgba(0, 0, 0, 0.85), inset 0 1px 2px rgba(255, 255, 255, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 25px 60px rgba(0, 0, 0, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.25)';
            }}
          >
            {/* 1. Blurred Photo Backdrop Layer (Sampled from selected profile photo as in the reference asset) */}
            {activePhoto ? (
              <div
                style={{
                  position: 'absolute',
                  top: '-40px',
                  left: '-40px',
                  right: '-40px',
                  bottom: '-40px',
                  backgroundImage: `url(${activePhoto})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(32px) brightness(0.7) saturate(130%)',
                  transform: 'scale(1.2)',
                  zIndex: 0,
                  transition: 'background-image 0.4s ease',
                }}
              />
            ) : (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(28, 32, 48, 0.85) 0%, rgba(14, 16, 26, 0.96) 100%)',
                  zIndex: 0,
                }}
              />
            )}

            {/* 2. Smooth Vignette Gradient Overlay (ensures text readability and depth) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(10, 12, 20, 0.2) 0%, rgba(10, 12, 20, 0.45) 50%, rgba(10, 12, 20, 0.82) 80%, rgba(10, 12, 20, 0.96) 100%)',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            />

            {/* 3. Card Content Layer */}
            <div style={{ position: 'relative', zIndex: 2, padding: '16px 16px 22px 16px' }}>
              {/* Inner Photo Frame */}
              <div
                style={{
                  width: '100%',
                  height: '380px',
                  borderRadius: '26px',
                  overflow: 'hidden',
                  position: 'relative',
                  background: activePhoto ? '#000000' : 'rgba(255, 255, 255, 0.05)',
                  border: '1.5px solid rgba(255, 255, 255, 0.22)',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {activePhoto ? (
                  <>
                    {/* Photo Display */}
                    <img
                      src={activePhoto}
                      alt={`${profile.nickname}의 사진 ${activePhotoIdx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        transition: 'opacity 0.25s ease',
                      }}
                    />

                    {/* Left / Right Navigation Buttons (Visible when multiple photos exist) */}
                    {currentPhotos.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={handlePrevPhoto}
                          aria-label="이전 사진"
                          style={{
                            position: 'absolute',
                            left: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: 'rgba(0, 0, 0, 0.5)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#fff',
                            fontSize: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            zIndex: 3,
                          }}
                        >
                          ‹
                        </button>

                        <button
                          type="button"
                          onClick={handleNextPhoto}
                          aria-label="다음 사진"
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            background: 'rgba(0, 0, 0, 0.5)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: '#fff',
                            fontSize: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            zIndex: 3,
                          }}
                        >
                          ›
                        </button>
                      </>
                    )}

                    {/* Top-Right Photo Count Pill */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(8px)',
                        color: '#ffffff',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        padding: '4px 9px',
                        borderRadius: '999px',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        zIndex: 3,
                        letterSpacing: '0.5px',
                      }}
                    >
                      {activePhotoIdx + 1} / {currentPhotos.length}
                    </div>

                    {/* Bottom Center Dots Indicator */}
                    {currentPhotos.length > 1 && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '12px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          zIndex: 3,
                          background: 'rgba(0, 0, 0, 0.45)',
                          backdropFilter: 'blur(8px)',
                          padding: '4px 8px',
                          borderRadius: '999px',
                        }}
                      >
                        {currentPhotos.map((_, idx) => (
                          <div
                            key={idx}
                            style={{
                              width: activePhotoIdx === idx ? '16px' : '6px',
                              height: '6px',
                              borderRadius: '999px',
                              background: activePhotoIdx === idx ? '#ffffff' : 'rgba(255, 255, 255, 0.45)',
                              boxShadow: activePhotoIdx === idx ? '0 0 6px rgba(255, 255, 255, 0.8)' : 'none',
                              transition: 'all 0.22s ease',
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  /* Empty state matching the reference asset's "moments" aesthetic */
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      width: '100%',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: '"Outfit", "Georgia", serif',
                        fontStyle: 'italic',
                        fontWeight: 800,
                        fontSize: '44px',
                        color: '#ffffff',
                        letterSpacing: '-1.5px',
                        display: 'block',
                        marginBottom: '10px',
                        textShadow: '0 2px 14px rgba(255, 255, 255, 0.25)',
                      }}
                    >
                      moments
                    </span>
                    <p
                      style={{
                        fontSize: '13px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontWeight: 600,
                        margin: '0 0 16px 0',
                      }}
                    >
                      나만의 멋진 순간들을 공유해보세요
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #ff4370 0%, #8b5cf6 100%)',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        padding: '8px 18px',
                        borderRadius: '999px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(255, 67, 112, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      📷 사진 등록하기 (+)
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Text Area (Greeting & Specs) */}
              <div style={{ padding: '16px 6px 4px 6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2
                    style={{
                      fontSize: '25px',
                      fontWeight: 800,
                      color: '#ffffff',
                      margin: 0,
                      letterSpacing: '-0.5px',
                      textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
                    }}
                  >
                    {profile.nickname || '익명 회원'}
                  </h2>
                  <span
                    style={{
                      fontSize: '11px',
                      background: 'rgba(255, 255, 255, 0.16)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: '999px',
                    }}
                  >
                    ✓ 휴대폰인증
                  </span>
                </div>

                {/* Subtitle: Location, Age, Gender, Height */}
                <p
                  style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.92)',
                    fontWeight: 500,
                    margin: '5px 0 12px 0',
                    letterSpacing: '-0.2px',
                    textShadow: '0 1px 4px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  {profile.location || '지역 미입력'} · {formattedAge} · {profile.gender || '성별'}
                  {profile.height ? ` · ${profile.height}cm` : ''}
                  {profile.mbti ? ` · ${profile.mbti}` : ''}
                </p>

                {/* Expand Hint Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '999px',
                    padding: '8px 12px',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    transition: 'all 0.2s',
                  }}
                >
                  <span>✨ 카드를 누르면 상세 정보가 펼쳐집니다</span>
                  <span style={{ fontSize: '13px' }}>▾</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Layered Ticket Tab (Frosted Glass Finish with Circular Cutout Notches) */}
          <div
            onClick={() => setIsExpanded(true)}
            role="button"
            tabIndex={0}
            style={{
              width: '180px',
              height: '44px',
              margin: '-12px auto 0 auto',
              paddingTop: '12px',
              position: 'relative',
              zIndex: 1,
              background: 'rgba(28, 32, 50, 0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 28px rgba(0, 0, 0, 0.6), 0 0 16px rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Left circular ticket notch cutout */}
            <div
              style={{
                position: 'absolute',
                left: '-6px',
                top: 'calc(50% + 6px)',
                transform: 'translateY(-50%)',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#08090f',
              }}
            />

            {/* Ticket Tab Center Icon (2nd Asset White Mark) */}
            <img
              src="/orbit-mark-white.png"
              alt="Orbit Brand Mark"
              style={{
                height: '24px',
                width: 'auto',
                maxWidth: '28px',
                objectFit: 'contain',
                display: 'block',
                filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.65))',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />

            {/* Right circular ticket notch cutout */}
            <div
              style={{
                position: 'absolute',
                right: '-6px',
                top: 'calc(50% + 6px)',
                transform: 'translateY(-50%)',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#08090f',
              }}
            />
          </div>
        </div>
      ) : !isEditing ? (
        /* ========================================================================= */
        /* 2. EXPANDED DETAILED CARD VIEW (Opened upon Tapping the Card)             */
        /* ========================================================================= */
        <div
          className="profile-card animate-fade"
          style={{
            background: 'linear-gradient(180deg, rgba(22, 25, 40, 0.92) 0%, rgba(16, 18, 30, 0.96) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)',
            borderRadius: '32px',
            padding: '28px 24px',
          }}
        >
          {/* Header Row */}
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
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: 0 }}>
                  {profile.nickname}
                </h2>
                {profile.name && (
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>({profile.name})</span>
                )}
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
                  {profile.gender} · {formattedAge}
                </span>
                {profile.mbti && (
                  <span
                    style={{
                      fontSize: '11.5px',
                      padding: '2px 9px',
                      borderRadius: '20px',
                      background: 'rgba(99, 102, 241, 0.2)',
                      color: '#a5b4fc',
                      fontWeight: 700,
                      border: '1px solid rgba(99, 102, 241, 0.35)',
                    }}
                  >
                    {profile.mbti}
                  </span>
                )}
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
                  ✓ 휴대폰인증 완료
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                style={{
                  background: 'linear-gradient(135deg, #ff4370 0%, #8b5cf6 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(255, 67, 112, 0.35)',
                }}
              >
                ✏️ 수정
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                }}
              >
                ✕ 접기
              </button>
            </div>
          </div>

          {/* Photo Gallery Swiper in Detailed View */}
          <div
            style={{
              marginBottom: '20px',
              borderRadius: '20px',
              overflow: 'hidden',
              background: '#0d0f17',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '12px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
                padding: '0 4px',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#ff85a1' }}>
                📸 프로필 사진 ({currentPhotos.length}/3장)
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto || currentPhotos.length >= 3}
                style={{
                  background: currentPhotos.length >= 3 ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: currentPhotos.length >= 3 ? 'rgba(255, 255, 255, 0.4)' : '#fff',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '8px',
                  cursor: currentPhotos.length >= 3 ? 'not-allowed' : 'pointer',
                }}
              >
                {isUploadingPhoto ? '업로드 중...' : currentPhotos.length >= 3 ? '최대 3장 등록됨' : '+ 사진 추가하기'}
              </button>
            </div>

            {currentPhotos.length > 0 ? (
              <div>
                {/* Main Selected Photo */}
                <div
                  style={{
                    width: '100%',
                    height: '280px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    position: 'relative',
                    background: '#000',
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <img
                    src={activePhoto || currentPhotos[0]}
                    alt={`프로필 사진 ${activePhotoIdx + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                    }}
                  />

                  {currentPhotos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevPhoto}
                        style={{
                          position: 'absolute',
                          left: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.5)',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={handleNextPhoto}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'rgba(0,0,0,0.5)',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {currentPhotos.length > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: '10px',
                      overflowX: 'auto',
                      paddingBottom: '4px',
                    }}
                  >
                    {currentPhotos.map((photoUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActivePhotoIdx(idx)}
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          cursor: 'pointer',
                          border: activePhotoIdx === idx ? '2px solid #ff4370' : '2px solid transparent',
                          opacity: activePhotoIdx === idx ? 1 : 0.65,
                          transition: 'all 0.2s',
                        }}
                      >
                        <img
                          src={photoUrl}
                          alt={`썸네일 ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  padding: '30px 16px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '14px',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                <div style={{ fontSize: '13.5px', color: '#fff', fontWeight: 600, marginBottom: '4px' }}>
                  등록된 프로필 사진이 없습니다
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '12px' }}>
                  사진을 등록하시면 상대방에게 훨씬 매력적으로 어필할 수 있습니다.
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: 'linear-gradient(135deg, #ff4370 0%, #8b5cf6 100%)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '7px 16px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  지금 사진 추가하기
                </button>
              </div>
            )}
          </div>

          {/* Quick Specs Grid */}
          <div className="summary-box" style={{ marginBottom: '16px' }}>
            <div className="summary-row">
              <span className="summary-key">키 (신장)</span>
              <span className="summary-val">{profile.height} cm</span>
            </div>
            {profile.mbti && (
              <div className="summary-row">
                <span className="summary-key">MBTI</span>
                <span className="summary-val" style={{ color: '#a5b4fc', fontWeight: 800 }}>
                  {profile.mbti}
                </span>
              </div>
            )}
            <div className="summary-row">
              <span className="summary-key">거주 지역</span>
              <span className="summary-val">{profile.location}</span>
            </div>
            <div className="summary-row">
              <span className="summary-key">연락처</span>
              <span className="summary-val" style={{ color: '#34d399', fontWeight: 700 }}>
                {formatMaskedPhone(profile.phone)} (인증완료)
              </span>
            </div>
          </div>

          {/* Preferences and Bio */}
          <div className="summary-box" style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '14px' }}>
              <span className="summary-key" style={{ display: 'block', marginBottom: '8px' }}>
                선호하는 동물상
              </span>
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
                <p
                  style={{
                    margin: 0,
                    fontSize: '13.5px',
                    color: 'var(--text-main)',
                    lineHeight: 1.6,
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                  }}
                >
                  {profile.preferredAppearanceDetail}
                </p>
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <span className="summary-key" style={{ display: 'block', marginBottom: '4px' }}>
                선호하는 이성 (자세히)
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: '13.5px',
                  color: 'var(--text-main)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                }}
              >
                {profile.preferredPartnerDetail}
              </p>
            </div>

            <div>
              <span className="summary-key" style={{ display: 'block', marginBottom: '4px' }}>
                본인은 어떤 사람인가 (자세히)
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: '13.5px',
                  color: 'var(--text-main)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                }}
              >
                {profile.selfIntro}
              </p>
            </div>
          </div>

          {/* Matching Status */}
          <div
            style={{
              padding: '16px',
              borderRadius: '14px',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              textAlign: 'center',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#c4b5fd', marginBottom: '4px' }}>
              ✨ 1:1 인연 매칭 접수 완료 상태
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
              진행중인 이벤트가 있으면 참여하여 인연을 잡으세요!
            </p>
          </div>

          {/* Bottom Action Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn-prev"
              onClick={() => setIsExpanded(false)}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              ✕ 카드 접기
            </button>
            <button
              type="button"
              className="btn-next"
              onClick={() => {
                setIsEditing(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{
                flex: 1.6,
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #ff4370 0%, #8b5cf6 100%)',
              }}
            >
              ✏️ 프로필 정보 수정
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 3. EDIT MODE (Full Profile & Photo Modification)                          */
        /* ========================================================================= */
        <div className="profile-card">
          <div className="card-badge" style={{ marginBottom: '12px' }}>
            EDIT MODE · 프로필 수정
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '18px' }}>
            내 프로필 정보 및 사진 수정
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Photos Manager in Edit Mode */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>프로필 사진 (최대 3장)</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto || editPhotos.length >= 3}
                  style={{
                    background: editPhotos.length >= 3 ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 67, 112, 0.15)',
                    border: editPhotos.length >= 3 ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 67, 112, 0.4)',
                    color: editPhotos.length >= 3 ? 'rgba(255, 255, 255, 0.35)' : '#ff85a1',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: editPhotos.length >= 3 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isUploadingPhoto ? '처리 중...' : editPhotos.length >= 3 ? '최대 3장 등록됨' : '+ 사진 추가'}
                </button>
              </label>

              {editPhotos.length > 0 ? (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {editPhotos.map((photoUrl, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        width: '80px',
                        height: '80px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                      }}
                    >
                      <img
                        src={photoUrl}
                        alt={`등록 사진 ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <button
                        type="button"
                        onClick={(e) => handleRemovePhoto(idx, e)}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'rgba(0, 0, 0, 0.75)',
                          color: '#fff',
                          border: 'none',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ✕
                      </button>
                      {idx === 0 && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '0',
                            right: '0',
                            background: 'rgba(255, 67, 112, 0.9)',
                            color: '#fff',
                            fontSize: '9px',
                            fontWeight: 700,
                            textAlign: 'center',
                            padding: '1px 0',
                          }}
                        >
                          대표사진
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1.5px dashed rgba(255, 255, 255, 0.15)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.02)',
                  }}
                >
                  <span style={{ fontSize: '20px', display: 'block', marginBottom: '4px' }}>📷</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>클릭하여 사진을 추가해보세요</span>
                </div>
              )}
            </div>

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

            {/* MBTI 직접 입력 text 칸 */}
            <div className="form-group">
              <label className="form-label">MBTI</label>
              <input
                type="text"
                className="form-input"
                placeholder="MBTI를 입력해주세요 (예: ENFP, ISTJ)"
                value={editData.mbti || ''}
                onChange={(e) => setEditData({ ...editData, mbti: e.target.value.toUpperCase() })}
                maxLength={10}
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
                style={{
                  flex: 2,
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #ff4370 0%, #8b5cf6 100%)',
                }}
                disabled={isSaving || !editData.nickname.trim()}
              >
                {isSaving ? '저장 중...' : '💾 변경사항 저장하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Editor Modal (Crop & Mosaic/Blur) */}
      {editorState.isOpen && editorState.pendingQueue[editorState.currentIndex] && (
        <ImageEditorModal
          isOpen={editorState.isOpen}
          imageSrc={editorState.pendingQueue[editorState.currentIndex]}
          currentIndex={editorState.currentIndex + 1}
          totalCount={editorState.pendingQueue.length}
          onCancel={handleEditorCancel}
          onComplete={handleEditorComplete}
          onSkipEdit={handleEditorSkip}
        />
      )}
    </div>
  );
}
