'use client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
}

export default function PrivacyModal({ isOpen, onClose, onAgree }: Props) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#121424',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          animation: 'fadeIn 0.2s ease-out',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>📋</span>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#fff', margin: 0 }}>
              개인정보 수집 및 이용 동의서
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* 모달 본문 (스크롤 영역) */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            fontSize: '13px',
            lineHeight: '1.65',
            color: 'var(--text-main)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Orbit Profile(이하 &apos;서비스&apos;)은 신뢰할 수 있고 안전한 1:1 인연 매칭 서비스를 제공하기 위해
            「개인정보 보호법」 등 관련 법령에 따라 아래와 같이 이용자의 개인정보를 수집·이용합니다.
          </p>

          {/* 1. 수집 항목 */}
          <section
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              padding: '14px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#ff85a1', marginBottom: '8px' }}>
              1. 수집하는 개인정보 항목
            </h4>
            <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-muted)' }}>
              <li>
                <b style={{ color: '#fff' }}>기본 인적사항:</b> 이름(실명), 닉네임, 연락처(휴대폰 번호 - 휴대폰 점유 문자 인증), 성별, 출생연도, 키(신장), 거주 지역(시/도 및 구 단위)
              </li>
              <li>
                <b style={{ color: '#fff' }}>매칭 및 취향 정보:</b> 선호하는 이성의 동물상, 원하는 외적인 구체적 상, 선호하는 이성 조건(상세), 본인 소개글
              </li>
              <li>
                <b style={{ color: '#fff' }}>서비스 이용 과정 자동 생성:</b> 프로필 등록 일시, 고유 접수 번호
              </li>
            </ul>
          </section>

          {/* 2. 수집 및 이용 목적 */}
          <section
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              padding: '14px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#c4b5fd', marginBottom: '8px' }}>
              2. 개인정보 수집 및 이용 목적
            </h4>
            <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-muted)' }}>
              <li>맞춤형 이성 프로필 심사, 적합도 분석 및 1:1 매칭 추천</li>
              <li>휴대폰 점유 인증을 통한 본인 확인 및 중복 프로필 등록 방지 (1인 1프로필 원칙 준수)</li>
              <li>매칭 진행 상황 안내, 매칭 성사 시 상호 프로필 정보 전달 및 소통 지원</li>
              <li>부적절한 회원 또는 불량 프로필 필터링을 통한 안전한 매칭 생태계 유지</li>
            </ul>
          </section>

          {/* 3. 보유 및 이용 기간 */}
          <section
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              padding: '14px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
              3. 개인정보의 보유 및 이용 기간
            </h4>
            <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-muted)' }}>
              <li>
                <b style={{ color: '#fff' }}>원칙:</b> 프로필 등록 시점부터 매칭 서비스 진행 및 종료 시까지 보유·이용됩니다.
              </li>
              <li>
                이용자가 프로필 삭제 또는 탈퇴를 요청하는 경우, 수집된 모든 정보는 <b style={{ color: '#34d399' }}>지체 없이 영구 파기</b>됩니다.
              </li>
              <li>
                단, 관계 법령(전자상거래법 등)에 따라 보존 의무가 규정된 경우 해당 법정 기간 동안 안전하게 분리 보관됩니다.
              </li>
            </ul>
          </section>

          {/* 4. 동의 거부 권리 */}
          <section
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              padding: '14px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: '#f59e0b', marginBottom: '8px' }}>
              4. 동의 거부 권리 및 불이익 안내
            </h4>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              귀하는 상기 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다. 다만 수집 항목은 맞춤 이성 매칭 서비스 제공을 위한 필수 정보이므로, 
              <b style={{ color: '#f59e0b' }}> 동의하지 않으실 경우 프로필 등록 및 매칭 진행이 제한</b>됩니다.
            </p>
          </section>
        </div>

        {/* 모달 푸터 버튼 */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            gap: '10px',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            닫기
          </button>
          <button
            type="button"
            onClick={() => {
              onAgree();
              onClose();
            }}
            style={{
              flex: 2,
              padding: '11px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #ff4370 0%, #8b5cf6 100%)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(255, 67, 112, 0.35)',
            }}
          >
            ✓ 내용 확인 및 동의하기
          </button>
        </div>
      </div>
    </div>
  );
}
