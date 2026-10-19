'use client';

import { useState, useEffect, useRef } from 'react';
import { ProfileData } from '@/lib/types';

interface Props {
  onLoginSuccess: (data: { phone: string; profile: ProfileData | null; isNewUser: boolean }) => void;
  onOpenAdminList?: () => void;
}

export default function LoginScreen({ onLoginSuccess, onOpenAdminList }: Props) {
  const [phone, setPhone] = useState('');
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
    if (!verificationData || timeLeft <= 0) return;

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
  }, [verificationData, timeLeft]);

  // Clean up auto-polling
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
    setPhone(digitsOnly);
    if (verificationData) {
      setVerificationData(null);
      setStatusMessage(null);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }
  };

  // Request verification code via Octomo
  const handleRequestVerification = async () => {
    const clean = phone.replace(/[^0-9]/g, '');
    if (clean.length < 10) {
      setStatusMessage({ type: 'error', text: '전화번호는 10~11자리 숫자로 입력해주세요.' });
      return;
    }

    setIsRequesting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/verify/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || '인증 요청에 실패했습니다.');
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
        text: '문자 앱으로 인증 문자를 발송하시면 자동으로 감지되어 로그인됩니다.',
      });

      // Start auto-checking every 3 seconds
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(() => {
        checkVerificationSilently(clean, data.text);
      }, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '오류가 발생했습니다.';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsRequesting(false);
    }
  };

  // Handle successful verification & check existing profile
  const handleSuccessVerification = async (verifiedPhone: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setStatusMessage({ type: 'success', text: '✅ 전화번호 인증이 완료되었습니다! 계정을 확인 중입니다...' });

    try {
      // Check if profile exists for this phone
      const res = await fetch(`/api/profile?phone=${verifiedPhone}`);
      const data = await res.json();

      if (data.exists && data.data) {
        // Existing member
        onLoginSuccess({
          phone: verifiedPhone,
          profile: data.data,
          isNewUser: false,
        });
      } else {
        // First-time member
        onLoginSuccess({
          phone: verifiedPhone,
          profile: null,
          isNewUser: true,
        });
      }
    } catch (e) {
      console.error('Profile fetch error after login:', e);
      // Fallback as new user
      onLoginSuccess({
        phone: verifiedPhone,
        profile: null,
        isNewUser: true,
      });
    }
  };

  // Check verification manually
  const handleCheckVerification = async () => {
    if (!verificationData || isChecking) return;
    setIsChecking(true);
    setStatusMessage(null);

    const clean = phone.replace(/[^0-9]/g, '');

    try {
      const res = await fetch('/api/verify/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: clean,
          text: verificationData.text,
        }),
      });
      const data = await res.json();

      if (data.verified) {
        await handleSuccessVerification(clean);
      } else {
        setStatusMessage({
          type: 'error',
          text: data.message || '아직 인증 문자가 확인되지 않았습니다. 문자를 발송하신 후 다시 확인해주세요.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '인증 확인 중 오류가 발생했습니다.';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsChecking(false);
    }
  };

  // Background silent polling
  const checkVerificationSilently = async (cleanPhone: string, textToCheck: string) => {
    try {
      const res = await fetch('/api/verify/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, text: textToCheck }),
      });
      const data = await res.json();
      if (data.verified) {
        await handleSuccessVerification(cleanPhone);
      }
    } catch (e) {
      console.log('Silent poll check:', e);
    }
  };

  const copyToClipboard = (val: string, field: 'number' | 'text') => {
    navigator.clipboard.writeText(val);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

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
    <div className="animate-fade" style={{ width: '100%', maxWidth: '480px', margin: '0 auto' }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #ff4370 0%, #8b5cf6 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            boxShadow: '0 8px 24px rgba(255, 67, 112, 0.35)',
            marginBottom: '14px',
          }}
        >
          💫
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', margin: 0 }}>
          Orbit <span style={{ color: '#ff4370' }}>Profile</span>
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
          인연 매칭을 위한 간편 휴대폰 인증 로그인<br />
          <span style={{ fontSize: '12.5px', color: 'var(--text-dim)' }}>
            기존 회원은 프로필 확인/수정, 신규 회원은 새 프로필을 등록합니다.
          </span>
        </p>
      </div>

      {/* Main Login Card */}
      <div
        className="profile-card"
        style={{
          background: 'rgba(19, 22, 39, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '28px 24px',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div className="card-badge" style={{ marginBottom: '14px' }}>
          LOGIN · 전화번호(옥토모) 인증
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
          휴대폰 번호로 시작하기
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
          본인 휴대폰 번호를 입력하고 문자를 전송하면 즉시 인증됩니다. (별도 비밀번호 없이 번호가 ID가 됩니다)
        </p>

        {/* Phone Input Box */}
        <div className="form-group">
          <label className="form-label">
            전화번호 <span className="required-dot">*</span>
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              className="form-input"
              placeholder="'-' 없이 숫자만 입력 (예: 01012345678)"
              value={phone}
              onChange={handlePhoneChange}
              maxLength={11}
              disabled={isRequesting}
              style={{ flex: 1 }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && phone.length >= 10 && !verificationData) {
                  e.preventDefault();
                  handleRequestVerification();
                }
              }}
            />
            <button
              type="button"
              onClick={handleRequestVerification}
              disabled={phone.length < 10 || isRequesting}
              style={{
                background: phone.length >= 10 ? 'linear-gradient(135deg, #ff4370 0%, #8b5cf6 100%)' : 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '0 18px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: phone.length >= 10 ? 'pointer' : 'not-allowed',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {isRequesting ? '요청 중...' : verificationData ? '재요청' : '인증 요청'}
            </button>
          </div>
        </div>

        {/* OCTOMO Verification Panel */}
        {verificationData && (
          <div
            style={{
              marginTop: '20px',
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '16px',
              padding: '18px',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#c4b5fd', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📲</span> 옥토모(OCTOMO) 문자 발송
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: timeLeft <= 60 ? '#ef4444' : '#f59e0b', fontFamily: 'monospace' }}>
                ⏱️ {formatTimer(timeLeft)}
              </span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '14px' }}>
              본인 휴대폰에서 아래 번호로 인증 문자를 전송해주세요.<br />
              (스마트폰에서는 아래 <b>원터치 버튼</b>을 누르면 문자 앱이 자동으로 열립니다.)
            </p>

            {/* Target and Text Boxes */}
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

            {/* Mobile 1-touch send button and check button */}
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
                  borderRadius: '12px',
                  padding: '13px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  textAlign: 'center',
                  boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
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
                  borderRadius: '12px',
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
                <span>{isChecking ? '인증 확인 중...' : '문자 발송 완료 후 로그인 확인'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Status Message */}
        {statusMessage && (
          <div
            style={{
              marginTop: '14px',
              padding: '11px 14px',
              borderRadius: '10px',
              fontSize: '12.5px',
              background:
                statusMessage.type === 'success'
                  ? 'rgba(52, 211, 153, 0.15)'
                  : statusMessage.type === 'error'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(139, 92, 246, 0.15)',
              color:
                statusMessage.type === 'success'
                  ? '#34d399'
                  : statusMessage.type === 'error'
                  ? '#fca5a5'
                  : '#c4b5fd',
              border: `1px solid ${
                statusMessage.type === 'success'
                  ? 'rgba(52, 211, 153, 0.3)'
                  : statusMessage.type === 'error'
                  ? 'rgba(239, 68, 68, 0.3)'
                  : 'rgba(139, 92, 246, 0.3)'
              }`,
            }}
          >
            {statusMessage.text}
          </div>
        )}
      </div>

      {/* Admin List Quick Link if provided */}
      {onOpenAdminList && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            type="button"
            onClick={onOpenAdminList}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              fontSize: '12px',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            📋 전체 접수 목록 (관리자 확인용)
          </button>
        </div>
      )}
    </div>
  );
}
