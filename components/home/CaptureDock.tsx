"use client";

import { useState } from "react";

interface CaptureDockProps {
  value: string;
  onChange: (value: string) => void;
  onSubmitText: () => void;
  onMicTap: () => void;
  placeholder: string;
  disabled?: boolean;
}

export default function CaptureDock({
  value,
  onChange,
  onSubmitText,
  onMicTap,
  placeholder,
  disabled,
}: CaptureDockProps) {
  const hasText = value.trim().length > 0;

  return (
    <div className="dock">
      <textarea
        className="dock-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
        {hasText ? <SendIcon /> : <DockMicIcon />}
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

function DockMicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
