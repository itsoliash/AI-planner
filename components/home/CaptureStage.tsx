"use client";

import Brand from "@/components/Brand";
import MicButton from "@/components/capture/MicButton";
import CaptureDock from "@/components/home/CaptureDock";
import type { FlowState } from "@/lib/home/useCaptureFlow";

interface CaptureStageProps {
  state: FlowState;
  elapsedMs: number;
  errorMessage: string;
  permissionDenied: boolean;
  showTagline: boolean;
  voiceSupported: boolean;
  dockValue: string;
  onDockChange: (v: string) => void;
  onDockSubmit: () => void;
  onMicClick: () => void;
  onRetry: () => void;
  onCancelRecording: () => void;
}

function formatTimer(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Стан `capture` (ТЗ «редизайн №2», розділ 4.1): лого + тагляйн (лише коли
 * беклог порожній) + велика кнопка, той самий CaptureDock знизу, що й у
 * стані `plan`.
 */
export default function CaptureStage({
  state,
  elapsedMs,
  errorMessage,
  permissionDenied,
  showTagline,
  voiceSupported,
  dockValue,
  onDockChange,
  onDockSubmit,
  onMicClick,
  onRetry,
  onCancelRecording,
}: CaptureStageProps) {
  const isProcessing = state === "processing";
  return (
    <div className="capture-screen">
      <div className="hero">
        <Brand
          tagline={showTagline ? "Плутанина думок в голові? Розкажи — змотаю в план" : undefined}
        />

        <div className={`mic-block ${permissionDenied ? "mic-block-denied" : ""}`}>
          <MicButton
            size="full"
            state={isProcessing ? "processing" : state === "recording" ? "recording" : "idle"}
            onClick={onMicClick}
            onCancel={onCancelRecording}
            disabled={!voiceSupported || isProcessing || permissionDenied}
            processingLabel={"Розбираю\nпочуте…."}
          />
          <div className="mic-status" aria-live="polite">
            {state === "capture" &&
              (voiceSupported
                ? "Тисни й розказуй"
                : "Запис голосу недоступний у цьому браузері — введи текст нижче")}
            {state === "recording" && (
              <span className="rec-live">● Запис… {formatTimer(elapsedMs)}</span>
            )}
          </div>
          {state === "error" && permissionDenied && (
            <div className="error-banner">
              <p>{errorMessage}</p>
              <p className="error-banner-hint">
                Можеш продовжити текстом у полі нижче.
              </p>
            </div>
          )}
          {state === "error" && !permissionDenied && (
            <div className="error-banner">
              <p>{errorMessage || "Не вдалось розібрати. Спробуй ще раз"}</p>
              <button type="button" className="btn-ghost" onClick={onRetry}>
                Повторити
              </button>
            </div>
          )}
        </div>
      </div>

      <CaptureDock
        value={dockValue}
        onChange={onDockChange}
        onSubmitText={onDockSubmit}
        onMicTap={() => {
          /* Уже в capture — тап по мікрофону в доці нічого не робить,
             запис починається тільки великою кнопкою (ТЗ 4.3). */
        }}
        placeholder="Або напиши, що в голові"
        disabled={isProcessing}
        emphasized={permissionDenied}
      />
    </div>
  );
}
