'use client';

import { useEffect, useRef, useState } from 'react';
import { ProfileData } from '@/lib/types';
import { digitsOnly } from '@/lib/format';
import { Field, Icon } from './ui';

interface Props {
  onLoginSuccess: (data: { phone: string; profile: ProfileData | null }) => void;
}

interface Verification {
  targetNumber: string;
  text: string;
}

type Status = { type: 'error' | 'success' | 'info'; text: string } | null;

const POLL_MS = 3000;

export default function LoginScreen({ onLoginSuccess }: Props) {
  const [phone, setPhone] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [status, setStatus] = useState<Status>(null);
  const [copied, setCopied] = useState<'number' | 'text' | null>(null);
  const doneRef = useRef(false);

  const expired = Boolean(verification) && timeLeft <= 0;

  // Countdown
  useEffect(() => {
    if (!verification || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [verification, timeLeft]);

  const finish = async (verifiedPhone: string) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setStatus({ type: 'success', text: '인증되었어요. 프로필을 확인하는 중이에요.' });
    try {
      const data = await (await fetch('/api/profile')).json();
      onLoginSuccess({ phone: verifiedPhone, profile: data.exists ? data.data : null });
    } catch {
      onLoginSuccess({ phone: verifiedPhone, profile: null });
    }
  };

  const check = async (silent: boolean) => {
    if (!verification || doneRef.current) return;
    if (!silent) {
      setIsChecking(true);
      setStatus(null);
    }
    try {
      const res = await fetch('/api/verify/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.verified) await finish(phone);
      // A server error (e.g. login not configured) is shown even during background polling;
      // "no SMS yet" stays quiet until the member checks manually.
      else if (!data.success || !silent) setStatus({ type: 'error', text: data.error || data.message || '아직 문자가 도착하지 않았어요. 보낸 뒤 다시 확인해주세요.' });
    } catch {
      if (!silent) setStatus({ type: 'error', text: '인증을 확인하지 못했어요. 네트워크를 확인해주세요.' });
    } finally {
      if (!silent) setIsChecking(false);
    }
  };

  // Background polling while the code is valid
  useEffect(() => {
    if (!verification || expired) return;
    const id = setInterval(() => void check(true), POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only when a new code is issued or it expires
  }, [verification, expired]);

  const requestCode = async () => {
    if (phone.length < 10) {
      setStatus({ type: 'error', text: '휴대폰 번호 10~11자리를 입력해주세요.' });
      return;
    }
    setIsRequesting(true);
    setStatus(null);
    try {
      const res = await fetch('/api/verify/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || '인증 요청에 실패했어요.');
      doneRef.current = false;
      setVerification({ targetNumber: data.targetNumber, text: data.text });
      setTimeLeft(data.expiresInSeconds || 300);
      setStatus({ type: 'info', text: '문자를 보내면 자동으로 확인해요.' });
    } catch (err) {
      setStatus({ type: 'error', text: err instanceof Error ? err.message : '인증 요청에 실패했어요.' });
    } finally {
      setIsRequesting(false);
    }
  };

  const copy = (value: string, field: 'number' | 'text') => {
    navigator.clipboard.writeText(value);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');

  return (
    <div className="stack stack--lg">
      <header className="stack">
        <h1 className="display display--lg">우주 모든 인연이<br />만날 때까지</h1>
        <p className="lede">휴대폰 번호로 시작해요. 처음이면 프로필을 만들고, 이미 있다면 내 프로필로 바로 이동해요.</p>
      </header>

      <section className="sheet stack stack--lg">
        <Field label="휴대폰 번호" htmlFor="login-phone" hint="비밀번호 없이 번호가 아이디가 돼요.">
          <div className="row">
            <input
              id="login-phone"
              className="input"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="01012345678"
              value={phone}
              maxLength={11}
              disabled={isRequesting}
              onChange={(e) => {
                setPhone(digitsOnly(e.target.value).slice(0, 11));
                setVerification(null);
                setStatus(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && !verification && phone.length >= 10 && requestCode()}
            />
            <button type="button" className="btn btn--primary" onClick={requestCode} disabled={phone.length < 10 || isRequesting} style={{ flex: 'none' }}>
              {isRequesting ? '요청 중' : verification ? '다시 받기' : '인증하기'}
            </button>
          </div>
        </Field>

        {verification && (
          <div className="panel stack">
            <div className="row row--between">
              <span className="label">이 내용으로 문자를 보내주세요</span>
              <span className={timeLeft <= 60 ? 'tag tag--ember' : 'tag tag--gold'} aria-live="off">
                {mm}:{ss}
              </span>
            </div>
            <dl className="facts">
              <div className="fact">
                <dt>받는 번호</dt>
                <dd className="row">
                  {verification.targetNumber}
                  <button type="button" className="link-btn" onClick={() => copy(verification.targetNumber, 'number')}>
                    {copied === 'number' ? '복사됨' : '복사'}
                  </button>
                </dd>
              </div>
              <div className="fact">
                <dt>보낼 내용</dt>
                <dd className="row">
                  {verification.text}
                  <button type="button" className="link-btn" onClick={() => copy(verification.text, 'text')}>
                    {copied === 'text' ? '복사됨' : '복사'}
                  </button>
                </dd>
              </div>
            </dl>
            <a className="btn btn--primary btn--block" href={`sms:${digitsOnly(verification.targetNumber)}?body=${encodeURIComponent(verification.text)}`}>
              <Icon name="message" /> 문자 앱에서 보내기
            </a>
            <button type="button" className="btn btn--ghost btn--block" onClick={() => check(false)} disabled={isChecking || expired}>
              {isChecking ? '확인하는 중' : '보냈어요, 인증 확인'}
            </button>
          </div>
        )}

        {expired && <p className="notice notice--error" role="alert">인증 시간이 끝났어요. 다시 받기를 눌러주세요.</p>}
        {!expired && status && (
          <p className={`notice notice--${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>
            {status.text}
          </p>
        )}
      </section>
    </div>
  );
}
