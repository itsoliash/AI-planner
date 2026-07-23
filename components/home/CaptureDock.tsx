"use client";

import { useRef } from "react";

interface CaptureDockProps {
  value: string;
  onChange: (value: string) => void;
  onSubmitText: () => void;
  onMicTap: () => void;
  placeholder: string;
  disabled?: boolean;
  /** Акцент на поле — коли запис голосу недоступний (ТЗ 8.6). */
  emphasized?: boolean;
}

export default function CaptureDock({
  value,
  onChange,
  onSubmitText,
  onMicTap,
  placeholder,
  disabled,
  emphasized,
}: CaptureDockProps) {
  const hasText = value.trim().length > 0;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 72)}px`;
    }
  }

  return (
    <div className={`dock ${emphasized ? "dock-emphasized" : ""}`}>
      <textarea
        className="dock-field"
        value={value}
        onChange={handleChange}
        ref={textareaRef}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && hasText) {
            e.preventDefault();
            onSubmitText();
          }
        }}
      />
      <button
        type="button"
        className="dock-btn"
        onClick={hasText ? onSubmitText : onMicTap}
        disabled={disabled}
        aria-label={hasText ? "Розібрати текст" : "Почати запис"}
      >
        <SendIcon />
      </button>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </svg>
  );
}
