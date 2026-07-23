interface TabsProps {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}

/**
 * Вкладки «Сьогодні / Всі задачі» (ТЗ 4.2) — пілюлі, без сегментованої
 * рамки: активна на --accent з білим текстом, неактивна прозора.
 */
export default function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="pill-tabs" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={active === t.key}
          className={`pill-tab ${active === t.key ? "active" : ""}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
