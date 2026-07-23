"use client";

import { useEffect, useRef, useState } from "react";
import { VoiceRecorder, isRecordingSupported } from "@/lib/audio/recorder";
import { useTasksStore, useHydrated } from "@/lib/store/tasks";
import Brand from "@/components/Brand";
import MicButton from "@/components/capture/MicButton";
import PlanStage from "@/components/home/PlanStage";

type VoiceState = "idle" | "recording" | "transcribing";

const EXAMPLE =
  "Завтра о 10 ранку зідзвон з дизайн-командою. Треба до п'ятниці здати макети лендінга, це терміново. Купити молоко і хліб. Записатись до стоматолога наступного тижня.";

function formatTimer(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [textFocused, setTextFocused] = useState(false);

  // Стор
  const hydrated = useHydrated();
  const tasks = useTasksStore((s) => s.tasks);
  const addTasks = useTasksStore((s) => s.addTasks);
  const toggleDone = useTasksStore((s) => s.toggleDone);
  const updateTask = useTasksStore((s) => s.updateTask);
  const deleteTask = useTasksStore((s) => s.deleteTask);

  // Голос
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setVoiceSupported(isRecordingSupported());
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.cancel();
    };
  }, []);

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function startRecording() {
    setError("");
    try {
      const rec = new VoiceRecorder();
      rec.onError((err) => {
        setError(err.message);
        setVoiceState("idle");
        stopTimer();
      });
      recorderRef.current = rec;
      // getUserMedia викликається за тапом — вимога iOS
      await rec.start();
      setVoiceState("recording");
      const startedAt = Date.now();
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(Date.now() - startedAt), 250);
    } catch (e) {
      const msg =
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Доступ до мікрофона відхилено. Дозволь мікрофон у налаштуваннях браузера."
          : "Не вдалося почати запис: " + (e instanceof Error ? e.message : String(e));
      setError(msg);
      setVoiceState("idle");
      stopTimer();
    }
  }

  async function stopRecording() {
    const rec = recorderRef.current;
    if (!rec) return;
    stopTimer();
    setVoiceState("transcribing");
    try {
      const result = await rec.stop();
      const form = new FormData();
      form.append("audio", result.blob, `capture.${result.ext}`);
      form.append("duration_ms", String(result.durationMs));

      const res = await fetch("/api/stt", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Помилка розпізнавання.");
        setVoiceState("idle");
        return;
      }
      const transcript = (data?.transcript || "").trim();
      // Додаємо до наявного тексту, не затираємо введене вручну
      setText((prev) => (prev.trim() ? prev.trim() + "\n" + transcript : transcript));
      setVoiceState("idle");
    } catch (e) {
      setError("Не вдалося обробити запис: " + (e instanceof Error ? e.message : String(e)));
      setVoiceState("idle");
    }
  }

  async function handleParse() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Сталася помилка.");
        return;
      }
      const parsed = data.tasks || [];
      if (parsed.length === 0) {
        setError("Задач не знайдено. Спробуй сформулювати конкретніше.");
        return;
      }
      addTasks(parsed);
      setText("");
      setTextFocused(false);
    } catch (e) {
      setError("Не вдалося з'єднатися з сервером: " + String(e));
    } finally {
      setLoading(false);
    }
  }

  const isBusy = voiceState !== "idle";
  // Один і той самий "клубок, що розмотується" — і для STT (transcribing),
  // і для розбору тексту в задачі (loading) після натискання «Розібрати».
  const isProcessing = voiceState === "transcribing" || loading;
  // Згорнутий текстовий ввід розгортається на фокус АБО коли в ньому вже є
  // текст (наприклад, з голосу) — щоб не ховати те, що вже надиктовано.
  const isTextExpanded = textFocused || text.trim().length > 0;

  return (
    <main className="wrap">
      {/* Екран Capture: лого/мікрофон зверху, текстовий ввід унизу, між ними
          авто-відступ, що заповнює висоту екрана (ТЗ 3.1). */}
      <div className="capture-screen">
      {/* Композиція Capture: лого + тагляйн + мікрофон одним центрованим блоком (ТЗ 3.1) */}
      <div className={`hero ${textFocused && voiceState === "idle" ? "compact" : ""}`}>
        <Brand tagline="Плутанина думок в голові? Розкажи — змотаю в план" />

        <div className="mic-block">
          <MicButton
            size="full"
            state={isProcessing ? "processing" : voiceState}
            onClick={voiceState === "recording" ? stopRecording : startRecording}
            disabled={!voiceSupported || isProcessing}
            processingLabel={
              voiceState === "transcribing" ? "Розплутую\nхаос…." : "Мотаю\nв план…."
            }
            compact={textFocused && voiceState === "idle"}
          />
          <div className="mic-status">
            {!isProcessing && voiceState === "idle" && (voiceSupported
              ? "Тисни й розказуй"
              : "Запис голосу недоступний у цьому браузері — введи текст нижче")}
            {!isProcessing && voiceState === "recording" && (
              <span className="rec-live">● Запис… {formatTimer(elapsed)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Захоплення тексту — вторинний спосіб вводу, згорнутий, доки не в фокусі */}
      <div className="capture">
        <label>Текст (голос або вручну)</label>
        <div className="capture-row">
          <textarea
            className={`text-input ${isTextExpanded ? "expanded" : ""}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setTextFocused(true)}
            onBlur={() => setTextFocused(false)}
            placeholder="Або напиши, що в голові"
            disabled={isBusy}
          />
          <button
            type="button"
            className="send-btn"
            onClick={handleParse}
            disabled={loading || isBusy || !text.trim()}
            aria-label="Розібрати"
            title="Розібрати"
          >
            {loading ? <span className="mic-spinner" /> : <SendIcon />}
          </button>
        </div>
        <div className="capture-actions">
          {text.trim() ? (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setText("");
                setError("");
              }}
              disabled={isBusy}
            >
              Очистити
            </button>
          ) : (
            <a
              href="#"
              className="hint-link"
              onClick={(e) => {
                e.preventDefault();
                setText(EXAMPLE);
              }}
            >
              Вставити приклад
            </a>
          )}
        </div>
        {error && <div className="error">{error}</div>}
      </div>
      </div>

      {/* Стан `plan` — показуємо тільки коли є хоч одна збережена задача.
          Тимчасове проводове з'єднання: повноцінна машина станів (стан
          `capture` ⇄ `plan`, HomeScreen) — окрема задача плану, ще не
          виконана в цій сесії. Поки що док під PlanStage дублює виклик
          handleParse/startRecording напряму. */}
      {hydrated && tasks.length > 0 && (
        <PlanStage
          tasks={tasks}
          onToggle={toggleDone}
          onUpdate={updateTask}
          onDelete={deleteTask}
          onMicTap={startRecording}
          dockValue={text}
          onDockChange={setText}
          onDockSubmit={handleParse}
          dockDisabled={isBusy || loading}
        />
      )}
    </main>
  );
}

function SendIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="13 6 19 12 13 18" />
    </svg>
  );
}
