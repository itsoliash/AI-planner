import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Task, ParsedTask, toTask } from "@/lib/types";

interface TasksState {
  /** Задачі — зберігаються в localStorage. */
  tasks: Task[];

  /** Розібрані задачі одразу потрапляють у список (без екрана перевірки). */
  addTasks: (parsed: ParsedTask[]) => void;
  toggleDone: (id: string) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set) => ({
      tasks: [],

      addTasks: (parsed) =>
        set((s) => ({
          // Нові зверху.
          tasks: [...parsed.map(toTask), ...s.tasks],
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
