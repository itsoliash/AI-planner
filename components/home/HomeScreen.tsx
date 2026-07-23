"use client";

import { useMemo } from "react";
import { useTasksStore, useHydrated } from "@/lib/store/tasks";
import { useCaptureFlow } from "@/lib/home/useCaptureFlow";
import CaptureStage from "@/components/home/CaptureStage";
import PlanStage from "@/components/home/PlanStage";

/**
 * Оркестратор головного екрана (ТЗ «редизайн №2», розділ 2). Один роут `/`,
 * два стани композиції (`capture` / `plan`), спільний `useCaptureFlow` для
 * запису/розбору. Перший захід визначається наявністю задач (розділ 3.1,
 * рішення D6) — окремого прапорця "онбординг пройдено" немає.
 */
export default function HomeScreen() {
  const hydrated = useHydrated();
  const tasks = useTasksStore((s) => s.tasks);
  const toggleDone = useTasksStore((s) => s.toggleDone);
  const updateTask = useTasksStore((s) => s.updateTask);
  const deleteTask = useTasksStore((s) => s.deleteTask);

  const hasBacklog = tasks.length > 0;
  const flow = useCaptureFlow(hasBacklog);
  const showTagline = useMemo(() => !hasBacklog, [hasBacklog]);

  if (!hydrated) return null;

  if (flow.state === "plan") {
    return (
      <PlanStage
        tasks={tasks}
        onToggle={toggleDone}
        onUpdate={updateTask}
        onDelete={deleteTask}
        onMicTap={flow.expandToCapture}
        onStartVoice={flow.startRecording}
        dockValue={flow.dockValue}
        onDockChange={flow.setDockValue}
        onDockSubmit={flow.submitText}
      />
    );
  }

  return (
    <CaptureStage
      state={flow.state}
      elapsedMs={flow.elapsedMs}
      errorMessage={flow.errorMessage}
      showTagline={showTagline}
      voiceSupported={flow.voiceSupported}
      dockValue={flow.dockValue}
      onDockChange={flow.setDockValue}
      onDockSubmit={flow.submitText}
      onMicClick={flow.state === "recording" ? flow.stopRecording : flow.startRecording}
      onRetry={flow.retry}
    />
  );
}
