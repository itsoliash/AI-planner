"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { VoiceRecorder, isRecordingSupported } from "@/lib/audio/recorder";
import { Task } from "@/lib/types";
import { useTasksStore, useHydrated } from "@/lib/store/tasks";
import Brand from "@/components/Brand";
import UnwindIndicator from "@/components/capture/UnwindIndicator";
import TaskCard from "@/components/ui/TaskCard";

type VoiceState = "idle" | "recording" | "transcribing";
type TabKey = "today" | "all";

const EXAMPLE =
  "Завтра о 10 ранку зідзвон з дизайн-командою. Треба до п'ятниці здати макети лендінга, це терміново. Купити молоко і хліб. Записатись до стоматолога наступного тижня.";

function formatTimer(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
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

  const [tab, setTab] = useState<TabKey>("today");

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

  const today = todayISO();
  const visibleTasks = useMemo(() => {
    if (tab === "all") return tasks;
    // «Сьогодні»: сьогоднішні + прострочені, ще не виконані.
    return tasks.filter(
      (t) => !t.done && t.due_date !== null && t.due_date <= today
    );
  }, [tasks, tab, today]);

  // Групування табу «Всі задачі»: Прострочені → Сьогодні → Незабаром →
  // Без дати → Виконано (ТЗ 4.2, адаптовано під повний список задач).
  const taskGroups = useMemo(() => {
    const overdue: Task[] = [];
    const dueToday: Task[] = [];
    const upcoming: Task[] = [];
    const noDate: Task[] = [];
    const done: Task[] = [];

    for (const t of tasks) {
      if (t.done) {
        done.push(t);
      } else if (t.due_date === null) {
        noDate.push(t);
      } else if (t.due_date < today) {
        overdue.push(t);
      } else if (t.due_date === today) {
        dueToday.push(t);
      } else {
        upcoming.push(t);
      }
    }

    return [
      { key: "overdue", title: "Прострочені", items: overdue, danger: true },
      { key: "today", title: "Сьогодні", items: dueToday },
      { key: "upcoming", title: "Незабаром", items: upcoming },
      { key: "nodate", title: "Без дати", items: noDate },
      { key: "done", title: "Виконано", items: done },
    ].filter((g) => g.items.length > 0);
  }, [tasks, today]);

  return (
    <main className="wrap">
      {/* Екран Capture: лого/мікрофон зверху, текстовий ввід унизу, між ними
          авто-відступ, що заповнює висоту екрана (ТЗ 3.1). */}
      <div className="capture-screen">
      {/* Композиція Capture: лого + тагляйн + мікрофон одним центрованим блоком (ТЗ 3.1) */}
      <div className={`hero ${textFocused && voiceState === "idle" ? "compact" : ""}`}>
        <Brand tagline="Плутанина думок в голові? Розкажи — змотаю в план" />

        <div className="mic-block">
          <button
            type="button"
            className={`mic-btn ${voiceState} ${isProcessing ? "processing" : ""} ${
              textFocused && voiceState === "idle" ? "compact" : ""
            }`}
            onClick={voiceState === "recording" ? stopRecording : startRecording}
            disabled={!voiceSupported || isProcessing}
            aria-label={voiceState === "recording" ? "Зупинити запис" : "Почати запис"}
          >
            {isProcessing ? (
              <div className="mic-unwind">
                <UnwindIndicator />
                <div className="mic-unwind-text">
                  <span className="mic-unwind-badge">
                    {voiceState === "transcribing" ? (
                      <>
                        Розплутую
                        <br />
                        хаос....
                      </>
                    ) : (
                      <>
                        Мотаю
                        <br />
                        в план....
                      </>
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <MicIcon active={voiceState === "recording"} />
            )}
          </button>
          <div className="mic-status">
            {!isProcessing && voiceState === "idle" && (voiceSupported
              ? "Натисни, щоб наговорити задачі"
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

      {/* Списки — показуємо тільки коли є хоч одна збережена задача */}
      {hydrated && tasks.length > 0 && (
        <section className="lists">
          <div className="tabs">
            <button
              type="button"
              className={`tab ${tab === "today" ? "active" : ""}`}
              onClick={() => setTab("today")}
            >
              Сьогодні
            </button>
            <button
              type="button"
              className={`tab ${tab === "all" ? "active" : ""}`}
              onClick={() => setTab("all")}
            >
              Всі задачі ({tasks.length})
            </button>
          </div>

          {tab === "today" ? (
            visibleTasks.length === 0 ? (
              <div className="hint">На сьогодні порожньо. Наговори або встав задачі вгорі.</div>
            ) : (
              <div className="cards">
                {visibleTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onToggle={() => toggleDone(t.id)}
                    onUpdate={(patch) => updateTask(t.id, patch)}
                    onDelete={() => deleteTask(t.id)}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="task-groups">
              {taskGroups.map((g) => (
                <div key={g.key} className="task-group">
                  <h2 className={`group-title ${g.danger ? "danger" : ""}`}>
                    {g.title} ({g.items.length})
                  </h2>
                  <div className="cards">
                    {g.items.map((t) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        onToggle={() => toggleDone(t.id)}
                        onDelete={() => deleteTask(t.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
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
