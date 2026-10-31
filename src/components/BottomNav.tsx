'use client';

import { Icon } from './ui';

export type MainTab = 'EVENTS' | 'PROFILE';

interface Props {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  onOpenRoom: () => void;
}

/** Floating bottom bar: the two tabs on either side, the event room (a modal, not a tab) raised in the middle. */
export default function BottomNav({ activeTab, onSelectTab, onOpenRoom }: Props) {
  const tab = (id: MainTab, icon: 'ticket' | 'user', label: string) => (
    <button
      type="button"
      className="tabbar__item"
      aria-current={activeTab === id ? 'page' : undefined}
      onClick={() => {
        onSelectTab(id);
        window.scrollTo({ top: 0 });
      }}
    >
      <Icon name={icon} />
      <span>{label}</span>
    </button>
  );

  return (
    <nav className="tabbar" aria-label="주요 메뉴">
      {tab('EVENTS', 'ticket', '이벤트')}
      <button type="button" className="tabbar__item tabbar__item--room" onClick={onOpenRoom} aria-haspopup="dialog">
        <span className="tabbar__orb">
          <Icon name="message" />
        </span>
        <span>이벤트방</span>
      </button>
      {tab('PROFILE', 'user', '내 프로필')}
    </nav>
  );
}
