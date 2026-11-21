"use client";

import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

// Small labelled controls for the ASCII editor side panel.

export function Row({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={htmlFor} className="text-xs font-normal text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function SliderRow({
  id,
  label,
  value,
  min,
  max,
  step,
  unit = "",
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">
          {label}
        </Label>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {value}
          {unit}
        </span>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}

export function SelectRow<T extends string>({
  id,
  label,
  value,
  choices,
  onChange,
  wide = false,
}: {
  id: string;
  label: string;
  value: T;
  choices: readonly { label: string; value: T }[];
  onChange: (value: T) => void;
  wide?: boolean;
}) {
  return (
    <Row label={label} htmlFor={id}>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger id={id} size="sm" className={wide ? "w-48" : "w-36"}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {choices.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Row>
  );
}

export function SwitchRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Row label={label} htmlFor={id}>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </Row>
  );
}

export const options = <T extends string>(
  values: readonly T[],
  labels?: Partial<Record<T, string>>,
) => values.map((value) => ({ value, label: labels?.[value] ?? value }));
