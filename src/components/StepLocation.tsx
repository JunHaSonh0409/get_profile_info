'use client';

import { useState } from 'react';
import { KOREA_REGIONS, POPULAR_REGIONS } from '@/lib/regions';

interface Props {
  location: string;
  onChange: (fields: { location: string }) => void;
  onEnter?: () => void;
}

export default function StepLocation({ location, onChange, onEnter }: Props) {
  const [selectedProvince, setSelectedProvince] = useState<string>('서울특별시');

  const currentDistricts =
    KOREA_REGIONS.find((r) => r.province === selectedProvince)?.districts || [];

  const handleSelectDistrict = (district: string) => {
    // Format: "서울 강남구" or "경기 성남시 분당구"
    const shortProvince = selectedProvince
      .replace('특별자치시', '')
      .replace('특별자치도', '')
      .replace('광역시', '')
      .replace('특별시', '')
      .replace('도', '');

    const formattedLocation = `${shortProvince} ${district}`;
    onChange({ location: formattedLocation });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && location.trim() && onEnter) {
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <div className="animate-slide">
      <div className="card-badge">STEP 4 · 활동 및 거주 지역</div>
      <h2 className="step-title">어디에 살고 계신가요?<br />(구 단위까지만)</h2>
      <p className="step-subtitle">가까운 거리나 활동 권역이 맞는 분과 자연스러운 만남을 돕습니다.</p>

      {/* 현재 선택된 거주 지역 */}
      <div className="form-group">
        <label className="form-label">
          선택된 지역 <span className="required-dot">*</span>
        </label>
        <input
          type="text"
          className="form-input"
          placeholder="아래에서 시/도 및 구를 선택하거나 직접 입력하세요"
          value={location}
          onChange={(e) => onChange({ location: e.target.value })}
          onKeyDown={handleKeyDown}
        />
        <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '6px' }}>
          📌 동이나 아파트명 등 상세 주소 없이 <b>'구'</b> 또는 <b>'시'</b>까지만 적어주세요.
        </p>
      </div>

      {/* 자주 선택하는 인기 지역 숏컷 */}
      <div style={{ marginBottom: '18px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
          🔥 빠른 인기 지역 선택:
        </span>
        <div className="quick-tags-container">
          {POPULAR_REGIONS.map((region) => (
            <button
              key={region}
              type="button"
              className={`quick-tag ${location === region ? 'active' : ''}`}
              onClick={() => onChange({ location: region })}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* 시/도 및 구/군 선택기 */}
      <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
              1. 시 / 도 선택
            </label>
            <select
              className="form-select"
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              style={{ fontSize: '14px', padding: '10px' }}
            >
              {KOREA_REGIONS.map((r) => (
                <option key={r.province} value={r.province} style={{ background: '#131627', color: '#fff' }}>
                  {r.province}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
              2. 구 / 군 선택
            </label>
            <select
              className="form-select"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) handleSelectDistrict(e.target.value);
              }}
              style={{ fontSize: '14px', padding: '10px' }}
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

        {/* 구 목록 칩 형태로도 빠르게 클릭 가능 */}
        <div style={{ maxHeight: '110px', overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '6px', paddingRight: '4px' }}>
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
                style={{ fontSize: '11.5px', padding: '4px 10px' }}
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
