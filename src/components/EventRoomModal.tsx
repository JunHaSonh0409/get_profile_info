'use client';

import { useState } from 'react';
import { EVENT_ROOM_PASSWORD, EVENT_ROOM_URL } from '@/lib/eventLabels';
import { Icon, Modal } from './ui';

/**
 * "이벤트방 입장" as an eclipse and a boarding pass: Kakao-yellow light breaks out from behind a dark
 * moon onto a planet's horizon, where the entry button sits; the password is the boarding pass below.
 */
export default function EventRoomModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  // Some in-app browsers block the clipboard; then say so instead of failing silently.
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EVENT_ROOM_PASSWORD);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    setTimeout(() => setCopyState('idle'), 2500);
  };

  return (
    <Modal open={open} onClose={onClose} title="이벤트방 입장">
      <div className="room-eclipse">
        <span className="room-eclipse__corona" aria-hidden="true" />
        <span className="room-eclipse__moon" aria-hidden="true" />
        <span className="room-eclipse__horizon" aria-hidden="true" />
        <p className="room-eclipse__note">이벤트 소식과 참가자 안내가 올라오는 오픈채팅방이에요.</p>
        <a className="room-eclipse__cta" href={EVENT_ROOM_URL} target="_blank" rel="noopener noreferrer">
          <Icon name="message" />
          오픈채팅방 입장하기
        </a>
      </div>

      <button type="button" className={`room-pass room-pass--${copyState}`} onClick={copy} aria-describedby="room-pass-state">
        <span className="room-pass__main">
          <span className="room-pass__label">입장 비밀번호</span>
          <span className="room-pass__word">{EVENT_ROOM_PASSWORD}</span>
        </span>
        <span className="room-pass__stub" aria-hidden="true">
          <Icon name={copyState === 'copied' ? 'check' : 'copy'} />
          {copyState === 'copied' ? '완료' : '복사'}
        </span>
      </button>
      <p id="room-pass-state" className={`room-pass-state room-pass-state--${copyState}`} role="status">
        {copyState === 'copied'
          ? '복사했어요. 채팅방에 들어갈 때 붙여넣으세요.'
          : copyState === 'failed'
            ? '복사가 막혀 있어요. 위 비밀번호를 직접 입력하세요.'
            : '채팅방에 들어갈 때 이 비밀번호를 물어봐요.'}
      </p>
    </Modal>
  );
}
