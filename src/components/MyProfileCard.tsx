'use client';

import { useRef, useState } from 'react';
import { ProfileData } from '@/lib/types';
import { maskPhone } from '@/lib/format';
import ImageEditorModal from './ImageEditorModal';
import PhotoCarousel from './PhotoCarousel';
import { AnimalChoices, HeightInput, LocationPicker } from './onboarding';
import { Field, Icon, Modal, OrbitMark } from './ui';

const MAX_PHOTOS = 3;

interface Props {
  profile: ProfileData;
  onUpdate: (updated: ProfileData) => void;
  onLogout: () => void;
}

type View = 'card' | 'detail' | 'edit';
type Message = { type: 'success' | 'error'; text: string } | null;

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

async function saveProfile(profile: ProfileData): Promise<ProfileData> {
  const result = await (
    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
  ).json();
  if (!result.success) throw new Error(result.error || '저장하지 못했어요.');
  return result.data || profile;
}

export default function MyProfileCard({ profile, onUpdate, onLogout }: Props) {
  const [view, setView] = useState<View>('card');
  const [editData, setEditData] = useState<ProfileData>(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [editorQueue, setEditorQueue] = useState<{ pending: string[]; done: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  const photos = profile.photos || [];
  const editPhotos = editData.photos || [];
  const isEditing = view === 'edit';
  const workingPhotos = isEditing ? editPhotos : photos;
  const age = String(profile.age || '').endsWith('년생') ? profile.age : `${profile.age}년생`;
  const pickPhotos = () => fileInputRef.current?.click();

  const persistPhotos = async (next: string[]) => {
    if (isEditing) {
      setEditData((prev) => ({ ...prev, photos: next }));
      return;
    }
    const previous = profile;
    const updated = { ...profile, photos: next };
    onUpdate(updated);
    setEditData(updated);
    try {
      await saveProfile(updated);
    } catch (err) {
      onUpdate(previous);
      setEditData(previous);
      throw err;
    }
  };

  const handleFiles = async (files: FileList | null) => {
    const slots = MAX_PHOTOS - workingPhotos.length;
    if (!files?.length) return;
    if (slots <= 0) {
      setMessage({ type: 'error', text: `사진은 ${MAX_PHOTOS}장까지 등록할 수 있어요.` });
      return;
    }
    try {
      const pending = await Promise.all(Array.from(files).slice(0, slots).map(readAsDataUrl));
      setEditorQueue({ pending, done: [] });
    } catch {
      setMessage({ type: 'error', text: '사진을 읽지 못했어요. 다른 사진으로 시도해주세요.' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const uploadEdited = async (dataUrls: string[]) => {
    setIsUploading(true);
    setMessage(null);
    try {
      const result = await (
        await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: dataUrls }),
        })
      ).json();
      if (!result.success || !result.urls?.length) throw new Error(result.error || '사진을 올리지 못했어요.');
      const next = [...workingPhotos, ...result.urls].slice(0, MAX_PHOTOS);
      await persistPhotos(next);
      setPhotoIdx(next.length - 1);
      setMessage({ type: 'success', text: `사진 ${result.urls.length}장을 추가했어요.` });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : '사진을 올리지 못했어요.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdited = (dataUrl: string) => {
    if (!editorQueue) return;
    const done = [...editorQueue.done, dataUrl];
    if (done.length < editorQueue.pending.length) {
      setEditorQueue({ ...editorQueue, done });
    } else {
      setEditorQueue(null);
      void uploadEdited(done);
    }
  };

  const removePhoto = async (idx: number) => {
    const next = workingPhotos.filter((_, i) => i !== idx);
    try {
      await persistPhotos(next);
      setPhotoIdx((i) => Math.min(i, Math.max(0, next.length - 1)));
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : '사진을 지우지 못했어요.' });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      onUpdate(await saveProfile(editData));
      setMessage({ type: 'success', text: '프로필을 저장했어요.' });
      setView('detail');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : '저장하지 못했어요.' });
    } finally {
      setIsSaving(false);
    }
  };

  // The server deletes the profile, photos and event records and clears the session; then reset like a logout.
  const withdraw = async () => {
    setIsWithdrawing(true);
    setWithdrawError('');
    try {
      const result = await (await fetch('/api/profile', { method: 'DELETE' })).json();
      if (!result.success) throw new Error(result.error);
      onLogout();
    } catch (err) {
      setWithdrawError(err instanceof Error && err.message ? err.message : '탈퇴를 처리하지 못했어요. 잠시 뒤에 다시 시도해주세요.');
      setIsWithdrawing(false);
    }
  };

  const startEdit = () => {
    setEditData(profile);
    setMessage(null);
    setView('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addPhotoButton = (
    <button type="button" className="btn btn--ghost btn--sm" onClick={pickPhotos} disabled={isUploading || workingPhotos.length >= MAX_PHOTOS}>
      <Icon name="camera" />
      {isUploading ? '올리는 중' : workingPhotos.length >= MAX_PHOTOS ? `${MAX_PHOTOS}장 모두 등록됨` : '사진 추가'}
    </button>
  );

  return (
    <div className="stack stack--lg">
      <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleFiles(e.target.files)} />

      <header className="row row--between">
        <h1 className="title">내 프로필</h1>
        <button type="button" className="btn btn--quiet" onClick={onLogout}>
          <Icon name="logout" /> 로그아웃
        </button>
      </header>

      {message && (
        <p className={`notice notice--${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>
          {message.text}
        </p>
      )}

      {view === 'card' && (
        <article className="ticket">
          {photos[photoIdx] && <div className="ticket__backdrop" style={{ backgroundImage: `url("${photos[photoIdx]}")` }} />}
          <div className="ticket__inner stack">
            <PhotoCarousel photos={photos} alt={`${profile.nickname}의 사진`} index={Math.min(photoIdx, Math.max(0, photos.length - 1))} onIndex={setPhotoIdx}>
              <div className="photo-empty">
                <p className="title">아직 사진이 없어요</p>
                <p className="hint">얼굴을 가린 사진이나 분위기가 드러나는 사진을 올려보세요.</p>
                <button type="button" className="btn btn--primary btn--sm" onClick={pickPhotos}>
                  <Icon name="camera" /> 사진 올리기
                </button>
              </div>
            </PhotoCarousel>
            <button type="button" className="stack" style={{ textAlign: 'left', gap: 4 }} onClick={() => setView('detail')}>
              <span className="row row--between">
                <span className="display">{profile.nickname || '이름 없음'}</span>
                <span className="tag tag--aurora"><Icon name="check" /> 인증</span>
              </span>
              <span className="muted">
                {[profile.location, age, profile.gender, profile.height && `${profile.height}cm`, profile.mbti].filter(Boolean).join(', ')}
              </span>
              <span className="small" style={{ color: 'var(--starlight)' }}>눌러서 자세히 보기</span>
            </button>
          </div>
          <div className="ticket__stub">
            <OrbitMark />
          </div>
        </article>
      )}

      {view === 'detail' && (
        <section className="sheet stack stack--lg">
          <div className="row row--between row--wrap">
            <div className="stack" style={{ gap: 6 }}>
              <h2 className="display">
                {profile.nickname} <span className="muted small">{profile.name}</span>
              </h2>
              <div className="chips">
                <span className="tag">{profile.gender}, {age}</span>
                {profile.mbti && <span className="tag tag--gold">{profile.mbti}</span>}
                <span className="tag tag--aurora"><Icon name="check" /> 휴대폰 인증</span>
              </div>
            </div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={startEdit}>
              <Icon name="edit" /> 수정
            </button>
          </div>

          <div className="stack">
            <div className="row row--between">
              <span className="label">사진 {photos.length}/{MAX_PHOTOS}</span>
              {addPhotoButton}
            </div>
            {photos.length > 0 && (
              <>
                <PhotoCarousel photos={photos} alt={`${profile.nickname}의 사진`} index={Math.min(photoIdx, photos.length - 1)} onIndex={setPhotoIdx} />
                {photos.length > 1 && (
                  <div className="thumbs">
                    {photos.map((src, i) => (
                      <button key={src + i} type="button" className="thumb" aria-pressed={i === photoIdx} aria-label={`사진 ${i + 1} 보기`} onClick={() => setPhotoIdx(i)}>
                        <img src={src} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <dl className="facts panel">
            <div className="fact"><dt>키</dt><dd>{profile.height}cm</dd></div>
            {profile.mbti && <div className="fact"><dt>MBTI</dt><dd>{profile.mbti}</dd></div>}
            <div className="fact"><dt>사는 곳</dt><dd>{profile.location}</dd></div>
            <div className="fact"><dt>연락처</dt><dd>{maskPhone(profile.phone)}</dd></div>
          </dl>

          <dl className="facts panel">
            <div className="fact fact--block">
              <dt>끌리는 인상</dt>
              <dd className="chips">
                {profile.preferredAnimals?.length ? profile.preferredAnimals.map((a) => <span key={a} className="tag tag--gold">{a}</span>) : '상관없음'}
              </dd>
              {profile.preferredAppearanceDetail && <dd>{profile.preferredAppearanceDetail}</dd>}
            </div>
            <div className="fact fact--block"><dt>바라는 사람</dt><dd>{profile.preferredPartnerDetail}</dd></div>
            <div className="fact fact--block"><dt>나에 대하여</dt><dd>{profile.selfIntro}</dd></div>
          </dl>

          <p className="notice notice--info">매칭 접수가 완료됐어요. 진행 중인 이벤트가 있으면 메뉴에서 신청할 수 있어요.</p>

          <button type="button" className="btn btn--ghost btn--block" onClick={() => setView('card')}>
            카드로 돌아가기
          </button>
        </section>
      )}

      {view === 'edit' && (
        <section className="sheet stack stack--lg">
          <h2 className="display">프로필 수정</h2>

          <div className="field">
            <div className="row row--between">
              <span className="label">사진 (최대 {MAX_PHOTOS}장)</span>
              {addPhotoButton}
            </div>
            <div className="thumbs">
              {editPhotos.map((src, i) => (
                <div key={src + i} className="thumb">
                  <img src={src} alt={`사진 ${i + 1}`} />
                  <button type="button" className="thumb__remove" aria-label={`사진 ${i + 1} 삭제`} onClick={() => removePhoto(i)}>
                    <Icon name="close" className="icon" />
                  </button>
                  {i === 0 && <span className="thumb__badge">대표</span>}
                </div>
              ))}
              {editPhotos.length < MAX_PHOTOS && (
                <button type="button" className="thumb thumb--add" onClick={pickPhotos} aria-label="사진 추가">
                  <Icon name="plus" />
                </button>
              )}
            </div>
          </div>

          <Field label="닉네임" htmlFor="edit-nickname" required>
            <input id="edit-nickname" className="input" value={editData.nickname} maxLength={20}
              onChange={(e) => setEditData({ ...editData, nickname: e.target.value })} />
          </Field>
          <Field label="키" htmlFor="height">
            <HeightInput value={editData.height} onChange={(height) => setEditData({ ...editData, height })} />
          </Field>
          <Field label="MBTI" htmlFor="edit-mbti" optional>
            <input id="edit-mbti" className="input" value={editData.mbti || ''} maxLength={4} placeholder="ENFP"
              onChange={(e) => setEditData({ ...editData, mbti: e.target.value.toUpperCase() })} />
          </Field>
          <Field label={`사는 곳${editData.location ? ` · ${editData.location}` : ''}`}>
            <LocationPicker location={editData.location} onChange={(location) => setEditData({ ...editData, location })} />
          </Field>
          <Field label="끌리는 인상">
            <AnimalChoices selected={editData.preferredAnimals || []} onChange={(preferredAnimals) => setEditData({ ...editData, preferredAnimals })} />
          </Field>
          <Field label="외모 취향" htmlFor="edit-appearance" optional>
            <textarea id="edit-appearance" className="textarea" rows={3} maxLength={300} value={editData.preferredAppearanceDetail || ''}
              onChange={(e) => setEditData({ ...editData, preferredAppearanceDetail: e.target.value })} />
          </Field>
          <Field label="바라는 사람" htmlFor="edit-partner">
            <textarea id="edit-partner" className="textarea" rows={4} maxLength={1000} value={editData.preferredPartnerDetail}
              onChange={(e) => setEditData({ ...editData, preferredPartnerDetail: e.target.value })} />
            <div className="counter"><span /><span>{editData.preferredPartnerDetail.length}자</span></div>
          </Field>
          <Field label="나에 대하여" htmlFor="edit-self">
            <textarea id="edit-self" className="textarea" rows={4} maxLength={1000} value={editData.selfIntro}
              onChange={(e) => setEditData({ ...editData, selfIntro: e.target.value })} />
            <div className="counter"><span /><span>{editData.selfIntro.length}자</span></div>
          </Field>

          <div className="row">
            <button type="button" className="btn btn--ghost" onClick={() => { setEditData(profile); setView('detail'); setMessage(null); }} disabled={isSaving}>
              취소
            </button>
            <button type="button" className="btn btn--primary" style={{ flex: 1 }} onClick={handleSave} disabled={isSaving || !editData.nickname.trim()}>
              {isSaving ? '저장하는 중' : '변경사항 저장'}
            </button>
          </div>
        </section>
      )}

      {!isEditing && (
        <button type="button" className="btn btn--quiet btn--sm withdraw-link" onClick={() => { setWithdrawError(''); setIsWithdrawOpen(true); }}>
          회원 탈퇴
        </button>
      )}

      <Modal
        open={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        locked={isWithdrawing}
        title="회원 탈퇴할까요?"
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setIsWithdrawOpen(false)} disabled={isWithdrawing}>취소</button>
            <button type="button" className="btn btn--danger" onClick={withdraw} disabled={isWithdrawing}>
              {isWithdrawing ? '탈퇴 처리 중' : '탈퇴하기'}
            </button>
          </>
        }
      >
        <p>탈퇴하면 아래 정보가 바로 지워지고 되돌릴 수 없어요.</p>
        <ul className="small muted" style={{ paddingLeft: 18 }}>
          <li>프로필과 등록한 사진</li>
          <li>이벤트 신청 내역과 주고받은 관심, 매칭 기록</li>
        </ul>
        <p className="small muted">같은 번호로 다시 인증하면 새로 가입할 수 있어요.</p>
        {withdrawError && <p className="notice notice--error" role="alert">{withdrawError}</p>}
      </Modal>

      {editorQueue && (
        <ImageEditorModal
          key={editorQueue.done.length}
          isOpen
          imageSrc={editorQueue.pending[editorQueue.done.length]}
          currentIndex={editorQueue.done.length + 1}
          totalCount={editorQueue.pending.length}
          onCancel={() => setEditorQueue(null)}
          onComplete={handleEdited}
          onSkipEdit={handleEdited}
        />
      )}
    </div>
  );
}
