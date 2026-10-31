'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

const ICONS = {
  close: 'M6 6l12 12M18 6L6 18',
  back: 'M15 18l-6-6 6-6',
  next: 'M9 6l6 6-6 6',
  link: 'M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1 1M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1-1',
  check: 'M5 12l5 5L20 7',
  calendar: 'M3 9h18M8 3v4M16 3v4M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  users: 'M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6',
  bell: 'M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15L6 16zM10 20.5a2 2 0 0 0 4 0',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4V8zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  edit: 'M4 20h4L19 9l-4-4L4 16v4z',
  logout: 'M15 4h4v16h-4M10 16l-4-4 4-4M6 12h10',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  copy: 'M11 9h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zM5 15V5a1 1 0 0 1 1-1h9',
  refresh: 'M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  plus: 'M12 5v14M5 12h14',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z',
  star: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6l-5.4 2.9 1.2-6-4.5-4.2 6.1-.7L12 3z',
  lock: 'M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM8 11V8a4 4 0 0 1 8 0v3',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  message: 'M4 5h16v11H8l-4 4V5z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  ticket: 'M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4V7z',
  undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  crop: 'M6 2v16h16M2 6h16v16',
  blur: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 7.5v.5',
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, className = 'icon', label }: { name: IconName; className?: string; label?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

/** Orbit brand mark: a planet with its tilted orbit and one travelling star. */
export function OrbitMark({ className = 'brand__mark' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <ellipse cx="16" cy="16" rx="14" ry="6" fill="none" stroke="#f4c97a" strokeOpacity="0.7" transform="rotate(-20 16 16)" />
      <circle cx="16" cy="16" r="6.5" fill="#e8e6f0" />
      <circle cx="28.2" cy="11.4" r="2" fill="#f4c97a" />
    </svg>
  );
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  /** Prevent closing (e.g. while a request is in flight). */
  locked?: boolean;
}

export function Modal({ open, onClose, title, children, footer, wide, locked }: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  // Latest close handler/lock without re-running the open effect: callers pass inline arrows,
  // and re-running it on every render pulled focus out of inputs on each keystroke.
  const closeRef = useRef({ onClose, locked });
  useEffect(() => {
    closeRef.current = { onClose, locked };
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !closeRef.current.locked) closeRef.current.onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      previous?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && !locked && onClose()}>
      <div
        ref={dialogRef}
        className={`modal${wide ? ' modal--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="modal__head">
          <h2 id={titleId} className="title">
            {title}
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} disabled={locked} aria-label="닫기">
            <Icon name="close" />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>
  );
}

interface FieldProps {
  label: ReactNode;
  htmlFor?: string;
  required?: boolean;
  optional?: boolean;
  hint?: ReactNode;
  children: ReactNode;
}

export function Field({ label, htmlFor, required, optional, hint, children }: FieldProps) {
  return (
    <div className="field">
      <label className="label" htmlFor={htmlFor}>
        {label}
        {required && (
          <span className="req" aria-hidden="true">
            *
          </span>
        )}
        {optional && <span className="opt">선택</span>}
      </label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function useAutoClear(value: unknown, clear: () => void, ms = 3000) {
  useEffect(() => {
    if (!value) return;
    const t = setTimeout(clear, ms);
    return () => clearTimeout(t);
  }, [value, clear, ms]);
}
