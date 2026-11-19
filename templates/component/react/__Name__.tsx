"use client";

import type { CSSProperties } from "react";
import { defaults, resolveTokens, rootClass, type __Name__Options } from "./__name__.config";

export type __Name__Props = __Name__Options & { className?: string };

export function __Name__({
  theme = defaults.theme,
  variant = defaults.variant,
  size = defaults.size,
  label = defaults.label,
  className,
}: __Name__Props) {
  const style = resolveTokens({ theme, variant, size }) as CSSProperties;

  return (
    <div className={className ? `${rootClass} ${className}` : rootClass} style={style}>
      {label}
    </div>
  );
}
