'use client';

import { useState, useEffect, useRef } from 'react';

interface Props {
  height: number | '';
  phone: string;
  isPhoneVerified: boolean;
  onPhoneVerifyChange: (verified: boolean) => void;
  onChange: (fields: { height?: number | ''; phone?: string }) => void;
  onEnter?: () => void;
}

export default function StepHeightPhone({
  height,
  phone,
  isPhoneVerified,
  onPhoneVerifyChange,
  onChange,
  onEnter,
}: Props) {
  // Verification states
  const [isRequesting, setIsRequesting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [verificationData, setVerificationData] = useState<{
    targetNumber: string;
    text: string;
    code: string;
    expiresIn: number;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState(300);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [copiedField, setCopiedField] = useState<'number' | 'text' | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer countdown
  useEffect(() => {
    if (!verificationData || isPhoneVerified || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatusMessage({ type: 'error', text: '인증 시간이 만료되었습니다. 다시 시도해주세요.' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [verificationData, isPhoneVerified, timeLeft]);

  // Clean up auto-polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
    onChange({ phone: digitsOnly });
    // Reset verification if phone number changes
    if (isPhoneVerified) {
      onPhoneVerifyChange(false);
      setVerificationData(null);
      setStatusMessage(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && height && phone.length >= 10 && isPhoneVerified && onEnter) {
      e.preventDefault();
      onEnter();
    }
  };

  // Request verification code
  const handleRequestVerification = async () => {
    if (phone.length < 10) return;
    setIsRequesting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/verify/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || '인증 요청 실패');
      }

      setVerificationData({
        targetNumber: data.targetNumber,
        text: data.text,
        code: data.code,
        expiresIn: data.expiresInSeconds || 300,
      });
      setTimeLeft(data.expiresInSeconds || 300);
      setStatusMessage({
        type: 'info',
        text: '문자 앱으로 인증 문자를 발송하신 후 [인증 확인]을 눌러주세요.',
      });

      // Start auto-checking every 3.5 seconds
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(() => {
        checkVerificationSilently(data.text);
      }, 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '인증 요청 중 오류가 발생했습니다.';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsRequesting(false);
    }
  };

  // Check verification with Octomo API
  const handleCheckVerification = async () => {
    if (!verificationData || isChecking) return;
    setIsChecking(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/verify/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          text: verificationData.text,
        }),
      });
      const data = await res.json();

      if (data.verified) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        onPhoneVerifyChange(true);
        setStatusMessage({ type: 'success', text: '✅ 전화번호 인증이 완료되었습니다!' });
      } else {
        setStatusMessage({
          type: 'error',
          text: data.message || '아직 인증 문자가 수신되지 않았습니다. 문자 발송 후 다시 눌러주세요.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '인증 확인 중 오류가 발생했습니다.';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsChecking(false);
    }
  };

  // Background polling without blocking UI
  const checkVerificationSilently = async (textToCheck: string) => {
    if (isPhoneVerified) return;
    try {
      const res = await fetch('/api/verify/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, text: textToCheck }),
      });
      const data = await res.json();
      if (data.verified) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        onPhoneVerifyChange(true);
        setStatusMessage({ type: 'success', text: '✅ 전화번호 인증이 완료되었습니다!' });
      }
    } catch (e) {
      console.log('Silent poll error', e);
    }
  };

  const copyToClipboard = (val: string, field: 'number' | 'text') => {
    navigator.clipboard.writeText(val);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Build SMS link for iOS (&body=) and Android (?body=)
  const getSmsLink = () => {
    if (!verificationData) return '#';
    const num = verificationData.targetNumber.replace(/[^0-9]/g, '');
    const encodedText = encodeURIComponent(verificationData.text);
    return `sms:${num}?body=${encodedText}`;
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="animate-slide">
      <div className="card-badge">STEP 3 · 신체 스펙 & 연락처 인증</div>
      <h2 className="step-title">키와 연락처를<br />입력하고 인증해주세요.</h2>
      <p className="step-subtitle">신뢰할 수 있는 매칭을 위해 OCTOMO 모바일 점유 인증을 진행합니다.</p>

      {/* 키 입력 */}
      <div className="form-group">
        <label className="form-label">
          키 (cm) <span className="required-dot">*</span>
        </label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="number"
            className="form-input"
            placeholder="예: 175"
            min={130}
            max={220}
            value={height === '' ? '' : height}
            onChange={(e) => {
              const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
              onChange({ height: isNaN(val as number) ? '' : val });
            }}
            onKeyDown={handleKeyDown}
            style={{ paddingRight: '48px' }}
          />
          <span
            style={{
              position: 'absolute',
              right: '16px',
              color: 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: 600,
              pointerEvents: 'none',
            }}
          >
            cm
          </span>
        </div>

        {/* Quick height tags */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
          {[158, 163, 168, 173, 178, 183].map((h) => (
            <button
              key={h}
              type="button"
              className={`quick-tag ${height === h ? 'active' : ''}`}
              onClick={() => onChange({ height: h })}
            >
              {h}cm
            </button>
          ))}
        </div>
      </div>

      {/* 전화번호 입력 및 OCTOMO 인증 */}
      <div className="form-group" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label className="form-label" style={{ margin: 0 }}>
            전화번호 <span className="required-dot">*</span>
          </label>
          {isPhoneVerified ? (
            <span style={{ fontSize: '12px', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>✅</span> 점유 인증 완료
            </span>
          ) : (
            phone && (
              <span style={{ fontSize: '12px', color: phone.length >= 10 ? '#ff85a1' : '#f59e0b', fontWeight: 600 }}>
                {phone.length}/11자리 (인증 필요)
              </span>
            )
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            className="form-input"
            placeholder="'-' 없이 숫자만 입력 (예: 01012345678)"
            value={phone}
            onChange={handlePhoneChange}
            onKeyDown={handleKeyDown}
            maxLength={11}
            disabled={isPhoneVerified}
            style={{
              flex: 1,
              borderColor: isPhoneVerified ? 'rgba(52, 211, 153, 0.4)' : undefined,
              background: isPhoneVerified ? 'rgba(52, 211, 153, 0.05)' : undefined,
            }}
          />

          {!isPhoneVerified ? (
            <button
              type="button"
              onClick={handleRequestVerification}
              disabled={phone.length < 10 || isRequesting}
              style={{
                background: phone.length >= 10 ? 'linear-gradient(135deg, #ff4370 0%, #8b5cf6 100%)' : 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '0 16px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: phone.length >= 10 ? 'pointer' : 'not-allowed',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {isRequesting ? '요청 중...' : verificationData ? '재요청' : '인증하기'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onPhoneVerifyChange(false);
                setVerificationData(null);
                setStatusMessage(null);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-muted)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '0 14px',
                fontSize: '12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              번호 변경
            </button>
          )}
        </div>

        {/* OCTOMO 인증 진행 안내 카드 */}
        {verificationData && !isPhoneVerified && (
          <div
            style={{
              marginTop: '16px',
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '16px',
              padding: '18px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#c4b5fd', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📲</span> 옥토모(OCTOMO) 문자 인증
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: timeLeft <= 60 ? '#ef4444' : '#f59e0b', fontFamily: 'monospace' }}>
                ⏱️ {formatTimer(timeLeft)}
              </span>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '14px' }}>
              본인 휴대폰에서 아래 수신번호로 인증 문자를 보내주세요.
              <br />(별도의 유료 정보이용료가 발생하지 않습니다.)
            </p>

            {/* 수신 번호 & 보낼 내용 복사 박스 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-dim)', marginRight: '8px' }}>받는 번호:</span>
                  <b style={{ color: '#fff', fontSize: '14px' }}>{verificationData.targetNumber}</b>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(verificationData.targetNumber, 'number')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    color: '#ff85a1',
                    cursor: 'pointer',
                  }}
                >
                  {copiedField === 'number' ? '복사됨 ✓' : '번호 복사'}
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-dim)', marginRight: '8px' }}>보낼 내용:</span>
                  <b style={{ color: '#ff85a1', fontSize: '14px' }}>{verificationData.text}</b>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(verificationData.text, 'text')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    color: '#ff85a1',
                    cursor: 'pointer',
                  }}
                >
                  {copiedField === 'text' ? '복사됨 ✓' : '문구 복사'}
                </button>
              </div>
            </div>

            {/* 원터치 모바일 문자 앱 열기 버튼 & 인증 확인 버튼 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a
                href={getSmsLink()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  textAlign: 'center',
                  boxShadow: '0 2px 10px rgba(139, 92, 246, 0.3)',
                }}
              >
                <span>💬</span>
                <span>모바일: 문자 앱 열고 바로 발송하기</span>
              </a>

              <button
                type="button"
                onClick={handleCheckVerification}
                disabled={isChecking}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '11px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>{isChecking ? '확인 중...' : '발송 완료 후 인증 확인'}</span>
              </button>
            </div>
          </div>
        )}

        {/* 상태 안내 메시지 */}
        {statusMessage && (
          <div
            style={{
              marginTop: '10px',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '12.5px',
              background: statusMessage.type === 'success' ? 'rgba(52, 211, 153, 0.15)' : statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(139, 92, 246, 0.15)',
              color: statusMessage.type === 'success' ? '#34d399' : statusMessage.type === 'error' ? '#fca5a5' : '#c4b5fd',
              border: `1px solid ${statusMessage.type === 'success' ? 'rgba(52, 211, 153, 0.3)' : statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(139, 92, 246, 0.3)'}`,
            }}
          >
            {statusMessage.text}
          </div>
        )}
      </div>
    </div>
  );
}
