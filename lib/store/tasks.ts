import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Task, ParsedTask, toTask } from "@/lib/types";

interface TasksState {
  /** Підтверджені задачі — зберігаються в localStorage. */
  tasks: Task[];
  /** Чернетки після розбору — тимчасові, НЕ персистяться. */
  drafts: Task[];

  // --- Чернетки (Review) ---
  setDrafts: (parsed: ParsedTask[]) => void;
  updateDraft: (id: string, patch: Partial<Task>) => void;
  removeDraft: (id: string) => void;
  clearDrafts: () => void;
  /** Переносить усі чернетки у збережений список. */
  confirmDrafts: () => void;

  // --- Збережені задачі ---
  toggleDone: (id: string) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set) => ({
      tasks: [],
      drafts: [],

      setDrafts: (parsed) => set({ drafts: parsed.map(toTask) }),

      updateDraft: (id, patch) =>
        set((s) => ({
          drafts: s.drafts.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        })),

      removeDraft: (id) =>
        set((s) => ({ drafts: s.drafts.filter((d) => d.id !== id) })),

      clearDrafts: () => set({ drafts: [] }),

      confirmDrafts: () =>
        set((s) => ({
          // Нові зверху, чернетки очищаємо.
          tasks: [...s.drafts, ...s.tasks],
          drafts: [],
        })),

      toggleDone: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, done: !t.done } : t
          ),
        })),

      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
    }),
    {
      name: "ai-planner-tasks",
      // Персистимо лише збережені задачі; чернетки — тимчасові.
      partialize: (s) => ({ tasks: s.tasks }),
    }
  )
);

/**
 * Реактивний прапорець гідрації persist-стору. У Next із SSR стор на першому
 * рендері порожній, а після маунту підтягується з localStorage. Компоненти
 * читають цей прапорець, щоб не показувати «порожньо» до гідрації і не ловити
 * hydration mismatch. Хук ре-рендериться, коли гідрація завершується.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() =>
    useTasksStore.persist.hasHydrated()
  );

  useEffect(() => {
    const unsub = useTasksStore.persist.onFinishHydration(() =>
      setHydrated(true)
    );
    // Про всяк випадок, якщо гідрація вже сталася до підписки.
    setHydrated(useTasksStore.persist.hasHydrated());
    return unsub;
  }, []);

  return hydrated;
}
