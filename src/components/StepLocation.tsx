'use client';

import { useState } from 'react';
import { KOREA_REGIONS } from '@/lib/regions';

interface Props {
  location: string;
  onChange: (fields: { location: string }) => void;
  onEnter?: () => void;
}

export default function StepLocation({ location, onChange }: Props) {
  const [selectedProvince, setSelectedProvince] = useState<string>('서울특별시');

  const currentDistricts =
    KOREA_REGIONS.find((r) => r.province === selectedProvince)?.districts || [];

  const handleSelectDistrict = (district: string) => {
    const shortProvince = selectedProvince
      .replace('특별자치시', '')
      .replace('특별자치도', '')
      .replace('광역시', '')
      .replace('특별시', '')
      .replace('도', '');

    const formattedLocation = `${shortProvince} ${district}`;
    onChange({ location: formattedLocation });
  };

  return (
    <div className="animate-slide">
      <div className="card-badge">STEP 4 · 활동 및 거주 지역</div>
      <h2 className="step-title">어디에 살고 계신가요?<br />(구 단위까지만)</h2>
      <p className="step-subtitle">가까운 거리나 활동 권역이 맞는 분과 자연스러운 만남을 돕습니다.</p>

      {/* 선택된 지역 뱃지 표시 */}
      {location && (
        <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>선택된 지역:</span>
          <span
            style={{
              fontSize: '13.5px',
              fontWeight: 700,
              color: '#ff85a1',
              background: 'var(--primary-light)',
              padding: '4px 12px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 67, 112, 0.3)',
            }}
          >
            📍 {location}
          </span>
        </div>
      )}

      {/* 시/도 및 구/군 선택 에셋 */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '16px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
          <div>
            <label style={{ fontSize: '12.5px', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
              1. 시 / 도 선택
            </label>
            <select
              className="form-select"
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              style={{ fontSize: '14px', padding: '12px' }}
            >
              {KOREA_REGIONS.map((r) => (
                <option key={r.province} value={r.province} style={{ background: '#131627', color: '#fff' }}>
                  {r.province}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12.5px', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
              2. 구 / 군 선택
            </label>
            <select
              className="form-select"
              value={location.includes(selectedProvince.slice(0, 2)) ? location.split(' ').slice(1).join(' ') : ''}
              onChange={(e) => {
                if (e.target.value) handleSelectDistrict(e.target.value);
              }}
              style={{ fontSize: '14px', padding: '12px' }}
            >
              <option value="" disabled style={{ background: '#131627', color: '#888' }}>
                구를 선택하세요
              </option>
              {currentDistricts.map((d) => (
                <option key={d} value={d} style={{ background: '#131627', color: '#fff' }}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 구 목록 칩 버튼 */}
        <div
          style={{
            maxHeight: '190px',
            overflowY: 'auto',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            paddingRight: '4px',
          }}
        >
          {currentDistricts.map((district) => {
            const shortProvince = selectedProvince
              .replace('특별자치시', '')
              .replace('특별자치도', '')
              .replace('광역시', '')
              .replace('특별시', '')
              .replace('도', '');
            const targetString = `${shortProvince} ${district}`;
            const isSelected = location === targetString;

            return (
              <button
                key={district}
                type="button"
                className={`quick-tag ${isSelected ? 'active' : ''}`}
                onClick={() => handleSelectDistrict(district)}
                style={{ fontSize: '12.5px', padding: '7px 14px' }}
              >
                {district}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
