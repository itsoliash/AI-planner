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

const SESSION_FLAG = "ai-planner-session-active";

/**
 * Прапорець «клієнт змонтувався». Повертає false на сервері (prerender) і на
 * першому клієнтському рендері — тому не чіпає store.persist під час рендера
 * (інакше на сервері persist === undefined і падає білд) і не дає hydration
 * mismatch. Після маунту стає true. Persist із дефолтним localStorage
 * регідратується синхронно ще до першого рендера на клієнті, тож на момент
 * true задачі вже підтягнуті зі сховища.
 *
 * Тут же — очищення задач при «новому заході» (продуктова поведінка,
 * узгоджена 22.07.2026): нова вкладка/сесія браузера витирає збережені
 * задачі, а оновлення сторінки (F5) — ні. Різниця в тому, що sessionStorage
 * переживає F5 у тій самій вкладці, але зникає з новою сесією браузера.
 * Прапорець ставиться один раз на сесію незалежно від того, яка сторінка
 * (`/` чи `/review`) змонтувалась першою.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && !window.sessionStorage.getItem(SESSION_FLAG)) {
      window.sessionStorage.setItem(SESSION_FLAG, "1");
      useTasksStore.setState({ tasks: [] });
    }
    setHydrated(true);
  }, []);
  return hydrated;
}
