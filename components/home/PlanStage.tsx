"use client";

import { useState } from "react";
import Logo from "@/components/brand/Logo";
import Tabs from "@/components/ui/Tabs";
import TodayList from "@/components/home/TodayList";
import RecommendationsBlock from "@/components/home/RecommendationsBlock";
import CaptureDock from "@/components/home/CaptureDock";
import TaskCard from "@/components/ui/TaskCard";
import { selectToday, selectRecommendations } from "@/lib/plan/selectToday";
import type { Task } from "@/lib/types";

interface PlanStageProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onMicTap: () => void;
  dockValue: string;
  onDockChange: (value: string) => void;
  onDockSubmit: () => void;
  dockDisabled?: boolean;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLabel(): string {
  return new Date().toLocaleDateString("uk-UA", { day: "numeric", month: "long" });
}

/**
 * Головний стан `plan` (ТЗ 4.2): лого-знак у куті, заголовок «Сьогодні»,
 * вкладки, список/порожній стан з рекомендаціями, док знизу.
 */
export default function PlanStage({
  tasks,
  onToggle,
  onUpdate,
  onDelete,
  onMicTap,
  dockValue,
  onDockChange,
  onDockSubmit,
  dockDisabled,
}: PlanStageProps) {
  const [tab, setTab] = useState<"today" | "all">("today");
  const today = todayISO();
  const { overdue, today: todayTasks } = selectToday(tasks, today);
  const allDone = tasks.length > 0 && tasks.every((t) => t.done);
  const isEmpty = overdue.length === 0 && todayTasks.length === 0;

  const recommendations = isEmpty ? selectRecommendations(tasks) : [];

  return (
    <div className="plan-stage">
      <div className="plan-header">
        <Logo size={32} />
        <span className="plan-date mono">{formatDateLabel()}</span>
      </div>

      <Tabs
        tabs={[
          { key: "today", label: "Сьогодні" },
          { key: "all", label: "Всі задачі" },
        ]}
        active={tab}
        onChange={(k) => setTab(k as "today" | "all")}
      />

      {tab === "today" ? (
        isEmpty ? (
          <>
            <p className="plan-empty-line">
              {allDone ? "На сьогодні все зроблено" : "На сьогодні нічого термінового."}
            </p>
            <RecommendationsBlock
              tasks={recommendations}
              heading={allDone ? "Якщо є настрій:" : "Можна взятися за це:"}
              onToggle={onToggle}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          </>
        ) : (
          <TodayList
            overdue={overdue}
            today={todayTasks}
            onToggle={onToggle}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        )
      ) : (
        <div className="cards">
          {tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onToggle={() => onToggle(t.id)}
              onUpdate={(patch) => onUpdate(t.id, patch)}
              onDelete={() => onDelete(t.id)}
            />
          ))}
        </div>
      )}

      <div className="plan-dock-spacer" />
      <div className="plan-dock-sticky">
        <CaptureDock
          value={dockValue}
          onChange={onDockChange}
          onSubmitText={onDockSubmit}
          onMicTap={onMicTap}
          placeholder="Що ще в голові?"
          disabled={dockDisabled}
        />
      </div>
    </div>
  );
}
