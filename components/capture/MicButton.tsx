import UnwindIndicator from "@/components/capture/UnwindIndicator";

export type MicButtonSize = "dock" | "full";
export type MicButtonVisualState = "idle" | "recording" | "processing";

interface MicButtonProps {
  size: MicButtonSize;
  state: MicButtonVisualState;
  onClick: () => void;
  disabled?: boolean;
  processingLabel?: string;
  compact?: boolean;
}

export default function MicButton({
  size,
  state,
  onClick,
  disabled,
  processingLabel,
  compact,
}: MicButtonProps) {
  const sizeClass = size === "dock" ? "mic-btn-dock" : "";
  return (
    <button
      type="button"
      className={`mic-btn ${state} ${sizeClass} ${compact ? "compact" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={state === "recording" ? "Зупинити запис" : "Почати запис"}
    >
      {state === "processing" ? (
        <div className="mic-unwind">
          <UnwindIndicator />
          {processingLabel && (
            <div className="mic-unwind-text">
              <span className="mic-unwind-badge" style={{ whiteSpace: "pre-line" }}>
                {processingLabel}
              </span>
            </div>
          )}
        </div>
      ) : (
        <MicIcon active={state === "recording"} />
      )}
    </button>
  );
}

function MicIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {active ? (
        <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none" />
      ) : (
        <>
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </>
      )}
    </svg>
  );
}
