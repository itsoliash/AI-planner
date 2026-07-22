import type { ButtonHTMLAttributes } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

/**
 * Пілюля-тег/фільтр (ТЗ 2.3 --r-pill, розділ 4.3 «Tasks»).
 * Неактивний — surface-sunken з рамкою, активний — accent із білим текстом.
 */
export default function Chip({ active, className = "", children, ...rest }: ChipProps) {
  const base =
    "inline-flex items-center rounded-pill px-3 py-1 text-meta font-medium whitespace-nowrap transition-colors duration-tap";
  const tone = active
    ? "bg-accent text-on-accent"
    : "bg-surface-sunken text-ink-2 border border-border";

  return (
    <button type="button" className={`${base} ${tone} ${className}`} {...rest}>
      {children}
    </button>
  );
}
