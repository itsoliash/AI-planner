import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-press",
  ghost: "bg-transparent border border-border text-ink hover:bg-surface-sunken",
  danger: "bg-transparent text-danger hover:bg-surface-sunken",
};

/**
 * Єдина кнопка продукту (крім кнопки захоплення — вона окремий компонент
 * `MicButton`, бо має власну анімовану механіку станів).
 */
export default function Button({
  variant = "primary",
  full,
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <button
      type="button"
      className={`rounded-pill px-6 py-3 text-body font-semibold transition-colors duration-state disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_CLASS[variant]} ${full ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
