'use client';

import { useEffect } from 'react';
import { Icon, OrbitMark, type IconName } from './ui';

export type MainTab = 'EVENTS' | 'PROFILE';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
}

const ITEMS: { tab: MainTab; icon: IconName; title: string; note: string }[] = [
  { tab: 'EVENTS', icon: 'ticket', title: '진행중 이벤트', note: '매칭 이벤트 일정과 신청' },
  { tab: 'PROFILE', icon: 'user', title: '내 프로필', note: '프로필 카드 확인과 수정' },
];

export default function NavigationDrawer({ isOpen, onClose, activeTab, onSelectTab }: Props) {
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="메뉴">
        <div className="stack stack--lg">
          <div className="row row--between">
            <span className="brand">
              <OrbitMark /> Orbit
            </span>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="메뉴 닫기">
              <Icon name="close" />
            </button>
          </div>
          <nav className="stack" aria-label="주요 메뉴">
            {ITEMS.map((item) => (
              <button
                key={item.tab}
                type="button"
                className="nav-item"
                aria-current={activeTab === item.tab ? 'page' : undefined}
                onClick={() => {
                  onSelectTab(item.tab);
                  onClose();
                }}
              >
                <span className="nav-item__icon">
                  <Icon name={item.icon} />
                </span>
                <span>
                  <span className="nav-item__title">{item.title}</span>
                  <span className="hint" style={{ display: 'block' }}>
                    {item.note}
                  </span>
                </span>
              </button>
            ))}
          </nav>
        </div>
        <p className="small dim">우주 모든 인연이 만날 때까지</p>
      </aside>
    </>
  );
}
