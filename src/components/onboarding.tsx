'use client';

import { useEffect, useState, type KeyboardEvent, type ReactNode } from 'react';
import confetti from 'canvas-confetti';
import { ANIMAL_OPTIONS, ProfileData } from '@/lib/types';
import { KOREA_REGIONS } from '@/lib/regions';
import { digitsOnly, formatPhone } from '@/lib/format';
import { Field, Icon } from './ui';
import PrivacyModal from './PrivacyModal';

type Update = (fields: Partial<ProfileData>) => void;

export const STEP_TITLES = ['이름과 닉네임', '성별과 나이', '키', '사는 곳', '끌리는 인상', '바라는 사람', '나에 대하여', '마지막 확인'];

/* ---------- Constellation progress: one star per step, lit as you go ---------- */

const STAR_Y = [34, 16, 30, 10, 26, 42, 22, 12];

export function Constellation({ step }: { step: number }) {
  const total = STEP_TITLES.length;
  const points = STAR_Y.map((y, i) => ({ x: 14 + (i * 292) / (total - 1), y }));
  return (
    <div className="constellation">
      <svg viewBox="0 0 320 52" role="img" aria-label={`${total}단계 중 ${step}단계`}>
        {points.slice(1).map((p, i) => (
          <line
            key={i}
            x1={points[i].x}
            y1={points[i].y}
            x2={p.x}
            y2={p.y}
            className={`constellation__line${i + 1 < step ? ' constellation__line--lit' : ''}`}
          />
        ))}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i + 1 === step ? 5.5 : 4}
            className={`constellation__star${i < step ? ' constellation__star--lit' : ''}${i + 1 === step ? ' constellation__star--current' : ''}`}
          />
        ))}
      </svg>
      <div className="constellation__caption">
        <strong>{STEP_TITLES[step - 1]}</strong>
        <span>
          {step} / {total}
        </span>
      </div>
    </div>
  );
}

function StepHead({ title, lede }: { title: ReactNode; lede?: ReactNode }) {
  return (
    <header className="stack">
      <h1 className="display">{title}</h1>
      {lede && <p className="lede">{lede}</p>}
    </header>
  );
}

const enterTo = (onEnter: () => void, ready: boolean) => (e: KeyboardEvent) => {
  if (e.key === 'Enter' && ready) {
    e.preventDefault();
    onEnter();
  }
};

/* ---------- Step 1 ---------- */

export function StepBasics({ data, onChange, onEnter }: { data: ProfileData; onChange: Update; onEnter: () => void }) {
  const onKeyDown = enterTo(onEnter, Boolean(data.name.trim() && data.nickname.trim()));
  return (
    <>
      <StepHead title="어떻게 불러드릴까요?" lede="닉네임은 프로필에 표시되는 이름이에요." />
      <Field label="이름" htmlFor="name" required>
        <input id="name" className="input" placeholder="홍길동" value={data.name} maxLength={20} autoFocus
          onChange={(e) => onChange({ name: e.target.value })} onKeyDown={onKeyDown} />
      </Field>
      <Field label="닉네임" htmlFor="nickname" required hint="기억에 남는 별명이면 좋아요.">
        <input id="nickname" className="input" placeholder="햇살, 코지, 낭만닥터" value={data.nickname} maxLength={20}
          onChange={(e) => onChange({ nickname: e.target.value })} onKeyDown={onKeyDown} />
      </Field>
    </>
  );
}

/* ---------- Step 2 ---------- */

export function StepGenderAge({ data, onChange, onEnter }: { data: ProfileData; onChange: Update; onEnter: () => void }) {
  const year = digitsOnly(data.age);
  const onKeyDown = enterTo(onEnter, Boolean(data.gender && year.length >= 2));
  return (
    <>
      <StepHead title="성별과 태어난 해를 알려주세요" lede="어울리는 연령대의 인연을 찾는 데 써요." />
      <Field label="성별" required>
        <div className="seg" role="group" aria-label="성별">
          {(['남성', '여성'] as const).map((g) => (
            <button key={g} type="button" aria-pressed={data.gender === g} onClick={() => onChange({ gender: g })}>
              {g}
            </button>
          ))}
        </div>
      </Field>
      <Field label="태어난 해" htmlFor="birth-year" required hint="98 또는 1998처럼 숫자만 입력하세요.">
        <div className="affix">
          <input id="birth-year" className="input" inputMode="numeric" placeholder="98" value={year} maxLength={4}
            onChange={(e) => {
              const digits = digitsOnly(e.target.value).slice(0, 4);
              onChange({ age: digits ? `${digits}년생` : '' });
            }}
            onKeyDown={onKeyDown} />
          <span className="affix__text">년생</span>
        </div>
      </Field>
      <Field label="MBTI" htmlFor="mbti" optional>
        <input id="mbti" className="input" placeholder="ENFP" value={data.mbti || ''} maxLength={4}
          onChange={(e) => onChange({ mbti: e.target.value.toUpperCase() })} onKeyDown={onKeyDown} />
      </Field>
    </>
  );
}

/* ---------- Step 3 ---------- */

const QUICK_HEIGHTS = [158, 163, 168, 173, 178, 183];
export const isValidHeight = (h: ProfileData['height']) => typeof h === 'number' && h >= 120 && h <= 230;

export function HeightInput({ value, onChange, onKeyDown }: { value: ProfileData['height']; onChange: (h: ProfileData['height']) => void; onKeyDown?: (e: KeyboardEvent) => void }) {
  return (
    <div className="stack">
      <div className="affix">
        <input id="height" className="input" type="number" inputMode="numeric" min={120} max={230} placeholder="175"
          value={value} onKeyDown={onKeyDown}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            onChange(Number.isNaN(n) ? '' : n);
          }} />
        <span className="affix__text">cm</span>
      </div>
      <div className="chips">
        {QUICK_HEIGHTS.map((h) => (
          <button key={h} type="button" className="chip" aria-pressed={value === h} onClick={() => onChange(h)}>
            {h}cm
          </button>
        ))}
      </div>
    </div>
  );
}

export function StepHeight({ data, phone, onChange, onEnter }: { data: ProfileData; phone: string; onChange: Update; onEnter: () => void }) {
  return (
    <>
      <StepHead title="키를 알려주세요" lede="상대에게 참고 정보로 보여져요." />
      <Field label="키" htmlFor="height" required>
        <HeightInput value={data.height} onChange={(height) => onChange({ height })}
          onKeyDown={enterTo(onEnter, isValidHeight(data.height))} />
      </Field>
      <div className="panel row row--between">
        <div>
          <div className="small muted">인증된 연락처</div>
          <div>{formatPhone(phone) || '-'}</div>
        </div>
        <span className="tag tag--aurora">
          <Icon name="check" className="icon" /> 인증 완료
        </span>
      </div>
    </>
  );
}

/* ---------- Step 4 ---------- */

// Stored as e.g. "서울 강남구"; the shortening rule must stay stable for existing rows.
const shortProvince = (province: string) =>
  province.replace('특별자치시', '').replace('특별자치도', '').replace('광역시', '').replace('특별시', '').replace('도', '');

export function LocationPicker({ location, onChange }: { location: string; onChange: (location: string) => void }) {
  const [province, setProvince] = useState(
    () => KOREA_REGIONS.find((r) => location.startsWith(`${shortProvince(r.province)} `))?.province || KOREA_REGIONS[0].province
  );
  const short = shortProvince(province);
  const districts = KOREA_REGIONS.find((r) => r.province === province)?.districts || [];

  return (
    <div className="stack">
      <label className="visually-hidden" htmlFor="province">시·도</label>
      <select id="province" className="select" value={province} onChange={(e) => setProvince(e.target.value)}>
        {KOREA_REGIONS.map((r) => (
          <option key={r.province} value={r.province}>
            {r.province}
          </option>
        ))}
      </select>
      <div className="chips" role="group" aria-label={`${province} 구·군`} style={{ maxHeight: 220, overflowY: 'auto' }}>
        {districts.map((d) => (
          <button key={d} type="button" className="chip" aria-pressed={location === `${short} ${d}`} onClick={() => onChange(`${short} ${d}`)}>
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StepLocation({ data, onChange }: { data: ProfileData; onChange: Update }) {
  return (
    <>
      <StepHead title="어디에 살고 계신가요?" lede="구 단위까지만 받아요. 가까운 분과 만나기 쉽도록 참고해요." />
      {data.location && (
        <p className="row">
          <Icon name="pin" />
          <span>{data.location}</span>
        </p>
      )}
      <LocationPicker location={data.location} onChange={(location) => onChange({ location })} />
    </>
  );
}

/* ---------- Step 5 ---------- */

export function toggleAnimal(selected: string[], label: string): string[] {
  if (label === '상관없음') return selected.includes(label) ? [] : [label];
  const rest = selected.filter((a) => a !== '상관없음');
  return rest.includes(label) ? rest.filter((a) => a !== label) : [...rest, label];
}

export function AnimalChoices({ selected, onChange }: { selected: string[]; onChange: (animals: string[]) => void }) {
  return (
    <div className="choice-grid" role="group" aria-label="끌리는 인상">
      {ANIMAL_OPTIONS.map((a) => (
        <button key={a.id} type="button" className="choice" aria-pressed={selected.includes(a.label)}
          onClick={() => onChange(toggleAnimal(selected, a.label))}>
          <span className="choice__emoji" aria-hidden="true">{a.emoji}</span>
          <span className="choice__label">{a.label}</span>
          <span className="choice__note">{a.tagline}</span>
        </button>
      ))}
    </div>
  );
}

export function StepAnimal({ data, onChange }: { data: ProfileData; onChange: Update }) {
  return (
    <>
      <StepHead title="어떤 인상에 끌리세요?" lede="여러 개 골라도 돼요. 상관없다면 '상관없음'을 고르세요." />
      <p className="small muted">{data.preferredAnimals.length > 0 ? `${data.preferredAnimals.length}개 선택` : '1개 이상 골라주세요'}</p>
      <AnimalChoices selected={data.preferredAnimals} onChange={(preferredAnimals) => onChange({ preferredAnimals })} />
      <Field label="외모 취향을 더 자세히" htmlFor="appearance" optional hint="눈매, 분위기, 스타일처럼 구체적일수록 찾기 쉬워요.">
        <textarea id="appearance" className="textarea" rows={3} maxLength={300} value={data.preferredAppearanceDetail}
          placeholder="웃는 모습이 예쁜 담백한 인상, 단정하고 깔끔한 분위기"
          onChange={(e) => onChange({ preferredAppearanceDetail: e.target.value })} />
      </Field>
    </>
  );
}

/* ---------- Steps 6 & 7: long-form writing with quick-add phrases ---------- */

const PARTNER_PHRASES = [
  '대화 코드가 잘 통하는 사람',
  '다정하고 감정 기복이 적은 분',
  '자기 일에 열정이 있는 성실한 사람',
  '주말에 카페, 산책, 전시를 함께 즐길 분',
  '연락이 편하고 솔직하게 대화하는 사람',
  '유머 감각이 있고 함께 있으면 편한 사람',
];

const SELF_PHRASES = [
  '처음엔 낯을 가리지만 친해지면 유쾌해요',
  '이야기를 잘 들어주고 공감을 잘해요',
  '운동과 활동적인 주말을 좋아해요',
  '맛집과 분위기 좋은 카페를 찾아다녀요',
  '약속을 잘 지키고 솔직한 소통을 중요하게 여겨요',
  '소소한 일상에서 행복을 찾는 편이에요',
];

const appendPhrase = (text: string, phrase: string) => (!text ? phrase : text.includes(phrase) ? text : `${text}, ${phrase}`);

function WritingStep(props: { id: string; title: string; lede: string; label: string; phrases: string[]; placeholder: string; value: string; onChange: (v: string) => void }) {
  const { id, title, lede, label, phrases, placeholder, value, onChange } = props;
  return (
    <>
      <StepHead title={title} lede={lede} />
      <div className="stack">
        <p className="small muted">눌러서 바로 넣을 수 있어요</p>
        <div className="chips">
          {phrases.map((p) => (
            <button key={p} type="button" className="chip chip--add" onClick={() => onChange(appendPhrase(value, p))}>
              + {p}
            </button>
          ))}
        </div>
      </div>
      <Field label={label} htmlFor={id} required>
        <textarea id={id} className="textarea" rows={6} maxLength={1000} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        <div className="counter">
          <span>자세할수록 매칭에 도움이 돼요 (5자 이상)</span>
          <span>{value.length}자</span>
        </div>
      </Field>
    </>
  );
}

export function StepPartner({ data, onChange }: { data: ProfileData; onChange: Update }) {
  return (
    <WritingStep id="partner" title="어떤 사람과 있을 때 편안한가요?" lede="성격, 생활 방식, 대화 방식, 가치관을 자유롭게 적어주세요."
      label="바라는 사람" phrases={PARTNER_PHRASES} value={data.preferredPartnerDetail}
      placeholder="사소한 일상도 편하게 나눌 수 있는 다정하고 솔직한 사람이면 좋겠어요."
      onChange={(preferredPartnerDetail) => onChange({ preferredPartnerDetail })} />
  );
}

export function StepSelf({ data, onChange }: { data: ProfileData; onChange: Update }) {
  return (
    <WritingStep id="self-intro" title="당신은 어떤 사람인가요?" lede="성격, 일상, 취미, 연애관처럼 상대가 나를 그려볼 수 있게 적어주세요."
      label="나에 대하여" phrases={SELF_PHRASES} value={data.selfIntro}
      placeholder="평소엔 차분하지만 친해지면 장난기가 많아요. 주말엔 전시를 보거나 산책을 해요."
      onChange={(selfIntro) => onChange({ selfIntro })} />
  );
}

/* ---------- Step 8 ---------- */

export function StepReview(props: { data: ProfileData; onGoToStep: (step: number) => void; onSubmit: () => void; isSubmitting: boolean; error?: string }) {
  const { data, onGoToStep, onSubmit, isSubmitting, error } = props;
  const [agreedMatch, setAgreedMatch] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const edit = (step: number) => (
    <button type="button" className="link-btn" onClick={() => onGoToStep(step)}>
      수정
    </button>
  );

  return (
    <>
      <StepHead title="이대로 등록할까요?" lede="고칠 부분이 있으면 '수정'을 눌러 바로 돌아갈 수 있어요." />
      {error && <p className="notice notice--error" role="alert">{error}</p>}

      <dl className="facts panel">
        <div className="fact"><dt>이름 · 닉네임</dt><dd>{data.name} ({data.nickname}) {edit(1)}</dd></div>
        <div className="fact"><dt>성별 · 나이</dt><dd>{data.gender}, {data.age}{data.mbti ? `, ${data.mbti}` : ''} {edit(2)}</dd></div>
        <div className="fact"><dt>키</dt><dd>{data.height}cm {edit(3)}</dd></div>
        <div className="fact"><dt>연락처</dt><dd>{formatPhone(data.phone)}</dd></div>
        <div className="fact"><dt>사는 곳</dt><dd>{data.location} {edit(4)}</dd></div>
      </dl>

      <dl className="facts panel">
        <div className="fact fact--block">
          <div className="row row--between"><dt>끌리는 인상</dt>{edit(5)}</div>
          <dd className="chips">{data.preferredAnimals.map((a) => <span key={a} className="tag tag--gold">{a}</span>)}</dd>
          {data.preferredAppearanceDetail && <dd>{data.preferredAppearanceDetail}</dd>}
        </div>
        <div className="fact fact--block">
          <div className="row row--between"><dt>바라는 사람</dt>{edit(6)}</div>
          <dd>{data.preferredPartnerDetail}</dd>
        </div>
        <div className="fact fact--block">
          <div className="row row--between"><dt>나에 대하여</dt>{edit(7)}</div>
          <dd>{data.selfIntro}</dd>
        </div>
      </dl>

      <div className="stack">
        <label className="check">
          <input type="checkbox" checked={agreedMatch} onChange={(e) => setAgreedMatch(e.target.checked)} />
          <span>작성한 프로필을 매칭에 활용하는 데 동의합니다. (필수)</span>
        </label>
        <div className="check">
          <input id="agree-privacy" type="checkbox" checked={agreedPrivacy} onChange={(e) => setAgreedPrivacy(e.target.checked)} />
          <label htmlFor="agree-privacy" style={{ flex: 1, cursor: 'pointer' }}>개인정보 수집·이용에 동의합니다. (필수)</label>
          <button type="button" className="link-btn" onClick={() => setPrivacyOpen(true)}>내용 보기</button>
        </div>
      </div>

      <button type="button" className="btn btn--primary btn--block" disabled={!agreedMatch || !agreedPrivacy || isSubmitting} onClick={onSubmit}>
        {isSubmitting ? <><Icon name="refresh" className="icon spin" /> 등록하는 중</> : '프로필 등록하기'}
      </button>

      <PrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} onAgree={() => setAgreedPrivacy(true)} />
    </>
  );
}

/* ---------- Done ---------- */

export function StepSuccess({ data, onViewMyProfile }: { data: ProfileData; onViewMyProfile: () => void }) {
  useEffect(() => {
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.55 }, colors: ['#f4c97a', '#e8e6f0', '#8fb4ff', '#ff9ec4'] });
  }, []);

  return (
    <div className="stack stack--lg center">
      <Icon name="star" className="icon" />
      <h1 className="display">{data.nickname}님의 별이 떴어요</h1>
      <p className="lede">
        프로필이 등록되었어요. 적어주신 이상형과 가치관을 바탕으로 인연을 찾아드릴게요.
      </p>
      <button type="button" className="btn btn--primary btn--block" onClick={onViewMyProfile}>
        내 프로필 카드 보기
      </button>
    </div>
  );
}
