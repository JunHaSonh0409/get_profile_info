'use client';

import { Modal } from './ui';

interface Props {
  open: boolean;
  onClose: () => void;
  onAgree: () => void;
}

export default function PrivacyModal({ open, onClose, onAgree }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="개인정보 수집·이용 동의서"
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            닫기
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              onAgree();
              onClose();
            }}
          >
            동의하기
          </button>
        </>
      }
    >
      <p className="muted small">
        Orbit Profile(이하 &apos;서비스&apos;)은 신뢰할 수 있고 안전한 1:1 인연 매칭 서비스를 제공하기 위해 「개인정보 보호법」 등
        관련 법령에 따라 아래와 같이 이용자의 개인정보를 수집·이용합니다.
      </p>

      <section className="stack small">
        <h3 className="label">1. 수집하는 개인정보 항목</h3>
        <ul className="muted" style={{ paddingLeft: 18 }}>
          <li>기본 인적사항: 이름(실명), 닉네임, 연락처(휴대폰 번호 - 휴대폰 점유 문자 인증), 성별, 출생연도, 키(신장), 거주 지역(시/도 및 구 단위)</li>
          <li>매칭 및 취향 정보: 선호하는 이성의 동물상, 원하는 외적인 구체적 상, 선호하는 이성 조건(상세), 본인 소개글</li>
          <li>서비스 이용 과정 자동 생성: 프로필 등록 일시, 고유 접수 번호</li>
        </ul>
      </section>

      <section className="stack small">
        <h3 className="label">2. 개인정보 수집 및 이용 목적</h3>
        <ul className="muted" style={{ paddingLeft: 18 }}>
          <li>맞춤형 이성 프로필 심사, 적합도 분석 및 1:1 매칭 추천</li>
          <li>휴대폰 점유 인증을 통한 본인 확인 및 중복 프로필 등록 방지 (1인 1프로필 원칙 준수)</li>
          <li>매칭 진행 상황 안내, 매칭 성사 시 상호 프로필 정보 전달 및 소통 지원</li>
          <li>부적절한 회원 또는 불량 프로필 필터링을 통한 안전한 매칭 생태계 유지</li>
        </ul>
      </section>

      <section className="stack small">
        <h3 className="label">3. 개인정보의 보유 및 이용 기간</h3>
        <ul className="muted" style={{ paddingLeft: 18 }}>
          <li>원칙: 프로필 등록 시점부터 매칭 서비스 진행 및 종료 시까지 보유·이용됩니다.</li>
          <li>이용자가 프로필 삭제 또는 탈퇴를 요청하는 경우, 수집된 모든 정보는 지체 없이 영구 파기됩니다.</li>
          <li>단, 관계 법령(전자상거래법 등)에 따라 보존 의무가 규정된 경우 해당 법정 기간 동안 안전하게 분리 보관됩니다.</li>
        </ul>
      </section>

      <section className="stack small">
        <h3 className="label">4. 동의 거부 권리 및 불이익 안내</h3>
        <p className="muted">
          귀하는 상기 개인정보 수집 및 이용에 대한 동의를 거부할 권리가 있습니다. 다만 수집 항목은 맞춤 이성 매칭 서비스 제공을 위한
          필수 정보이므로, 동의하지 않으실 경우 프로필 등록 및 매칭 진행이 제한됩니다.
        </p>
      </section>
    </Modal>
  );
}
