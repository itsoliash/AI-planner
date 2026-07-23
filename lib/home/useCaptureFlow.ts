"use client";

import { useEffect, useRef, useState } from "react";
import { VoiceRecorder, isRecordingSupported } from "@/lib/audio/recorder";
import { useTasksStore } from "@/lib/store/tasks";

export type FlowState = "capture" | "recording" | "processing" | "plan" | "error";

type LastAttempt =
  | { kind: "text"; text: string }
  | { kind: "audio-transcript"; transcript: string };

/**
 * Кінцевий автомат головного екрана (ТЗ «редизайн №2», розділ 2.2):
 * capture ⇄ recording ⇄ processing ⇄ plan, з error як бічною гілкою.
 *
 * `hasBacklog` визначає стан за замовчуванням при першому монтуванні
 * (ТЗ 3.1) — порожній беклог відкриває `capture`, непорожній — `plan`.
 */
export function useCaptureFlow(hasBacklog: boolean) {
  const [state, setState] = useState<FlowState>(hasBacklog ? "plan" : "capture");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [dockValue, setDockValue] = useState("");
  const [newTaskIds, setNewTaskIds] = useState<Set<string>>(new Set());
  const [voiceSupported, setVoiceSupported] = useState(true);

  const recorderRef = useRef<VoiceRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAttemptRef = useRef<LastAttempt | null>(null);

  const addTasks = useTasksStore((s) => s.addTasks);

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
    setErrorMessage("");
    setPermissionDenied(false);
    try {
      const rec = new VoiceRecorder();
      rec.onError((err) => {
        setErrorMessage(err.message);
        setState("error");
        stopTimer();
      });
      recorderRef.current = rec;
      // getUserMedia викликається за тапом — вимога iOS.
      await rec.start();
      setState("recording");
      const startedAt = Date.now();
      setElapsedMs(0);
      timerRef.current = setInterval(() => setElapsedMs(Date.now() - startedAt), 250);
    } catch (e) {
      const isDenied = e instanceof DOMException && e.name === "NotAllowedError";
      const msg = isDenied
        ? "Доступ до мікрофона відхилено. Дозволь мікрофон у налаштуваннях браузера."
        : "Не вдалося почати запис: " + (e instanceof Error ? e.message : String(e));
      setPermissionDenied(isDenied);
      setErrorMessage(msg);
      setState("error");
      stopTimer();
    }
  }

  async function parseText(text: string) {
    const trimmed = text.trim();
    if (!trimmed) {
      // ТЗ 8.5 — нуль задач це не помилка, екран все одно складається в plan.
      setState("plan");
      return;
    }
    setState("processing");
    setPermissionDenied(false);
    lastAttemptRef.current = { kind: "text", text: trimmed };
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data?.error || "Сталася помилка.");
        setState("error");
        return;
      }
      const parsed = data.tasks || [];
      const beforeIds = new Set(useTasksStore.getState().tasks.map((t) => t.id));
      addTasks(parsed);
      const afterIds = useTasksStore.getState().tasks.map((t) => t.id);
      const freshIds = new Set(afterIds.filter((id) => !beforeIds.has(id)));
      setNewTaskIds(freshIds);
      setTimeout(() => setNewTaskIds(new Set()), 2800);
      setDockValue("");
      setState("plan");
    } catch (e) {
      setErrorMessage("Не вдалося з'єднатися з сервером: " + String(e));
      setState("error");
    }
  }

  async function stopRecording() {
    const rec = recorderRef.current;
    if (!rec) return;
    stopTimer();
    setState("processing");
    try {
      const result = await rec.stop();
      const form = new FormData();
      form.append("audio", result.blob, `capture.${result.ext}`);
      form.append("duration_ms", String(result.durationMs));

      const sttRes = await fetch("/api/stt", { method: "POST", body: form });
      const sttData = await sttRes.json();
      if (!sttRes.ok) {
        setErrorMessage(sttData?.error || "Помилка розпізнавання.");
        setState("error");
        return;
      }
      const transcript = (sttData?.transcript || "").trim();
      lastAttemptRef.current = { kind: "audio-transcript", transcript };
      await parseText(transcript);
    } catch (e) {
      setErrorMessage("Не вдалося обробити запис: " + (e instanceof Error ? e.message : String(e)));
      setState("error");
    }
  }

  function cancelRecording() {
    recorderRef.current?.cancel();
    stopTimer();
    setState("capture");
  }

  async function submitText() {
    await parseText(dockValue);
  }

  function retry() {
    const attempt = lastAttemptRef.current;
    if (!attempt) {
      setState("capture");
      return;
    }
    if (attempt.kind === "text") {
      parseText(attempt.text);
    } else {
      // Транскрипт із попереднього запису вже маємо — повторюємо розбір
      // без нового запису (ТЗ 8.4: «нічого не втрачати»).
      parseText(attempt.transcript);
    }
  }

  function collapseToPlan(hasBacklogNow: boolean) {
    if (hasBacklogNow) setState("plan");
  }

  function expandToCapture() {
    setPermissionDenied(false);
    setState("capture");
  }

  return {
    state,
    elapsedMs,
    errorMessage,
    permissionDenied,
    dockValue,
    setDockValue,
    voiceSupported,
    startRecording,
    stopRecording,
    cancelRecording,
    submitText,
    retry,
    collapseToPlan,
    expandToCapture,
    newTaskIds,
  };
}
