import type { ReactNode, CSSProperties, KeyboardEvent } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  strong?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
  "aria-label"?: string;
}

export default function GlassCard({
  children,
  className = "",
  strong = false,
  style,
  onClick,
  "aria-label": ariaLabel,
}: GlassCardProps) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={`glass ${strong ? "glass-strong" : ""} ${className}`}
      style={style}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}
