'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import type { Control, OptionValue, RegistryEntry, StudioState } from '@/registry/types';

type Props = {
  entry: RegistryEntry;
  state: StudioState;
  onOption: (key: string, value: OptionValue) => void;
  onToken: (key: string, value: string) => void;
};

const HEX = /^#[0-9a-f]{6}$/i;

function ControlRow({ control, value, onChange }: { control: Control; value: OptionValue; onChange: (value: OptionValue) => void }) {
  const id = `ctl-${control.key}`;
  const label = (
    <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">
      {control.label}
    </Label>
  );

  switch (control.type) {
    case 'switch':
      return (
        <div className="flex items-center justify-between gap-3">
          {label}
          <Switch id={id} checked={Boolean(value)} onCheckedChange={onChange} />
        </div>
      );
    case 'color':
      return (
        <div className="flex items-center justify-between gap-3">
          {label}
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label={`${control.label} color`}
              value={HEX.test(String(value)) ? String(value) : '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="size-8 cursor-pointer rounded-md border bg-transparent p-0.5"
            />
            <Input id={id} value={String(value)} onChange={(e) => onChange(e.target.value)} className="h-8 w-24 font-mono text-xs" spellCheck={false} />
          </div>
        </div>
      );
    case 'slider': {
      const num = Number.parseFloat(String(value)) || control.min;
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            {label}
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {num}
              {control.unit}
            </span>
          </div>
          <Slider id={id} min={control.min} max={control.max} step={control.step} value={[num]} onValueChange={([v]) => onChange(`${v}${control.unit}`)} />
        </div>
      );
    }
    case 'select':
      return (
        <div className="flex items-center justify-between gap-3">
          {label}
          <Select value={String(value)} onValueChange={onChange}>
            <SelectTrigger id={id} size="sm" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {control.choices.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    case 'text':
      return (
        <div className="space-y-1.5">
          {label}
          <Input id={id} value={String(value)} onChange={(e) => onChange(e.target.value)} className="h-8 text-sm" spellCheck={false} />
        </div>
      );
  }
}

export function CustomizePanel({ entry, state, onOption, onToken }: Props) {
  const baseline = entry.baseline(state);

  return (
    <aside aria-label="Customize" className="rounded-lg border bg-card xl:sticky xl:top-20 xl:max-h-[calc(100svh-6rem)]">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-medium">Customize</h2>
        <p className="text-xs text-muted-foreground">Changes are baked into the copied config file.</p>
      </div>
      <ScrollArea className="xl:h-[calc(100svh-11rem)]">
        <div className="space-y-6 p-4">
          {entry.controls.map((group) => (
            <section key={group.title} className="space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-foreground/80">{group.title}</h3>
              {group.controls.map((control) =>
                control.target === 'token' ? (
                  <ControlRow
                    key={control.key}
                    control={control}
                    value={state.tokens[control.key] ?? baseline[control.key] ?? ''}
                    onChange={(v) => onToken(control.key, String(v))}
                  />
                ) : (
                  <ControlRow key={control.key} control={control} value={state.options[control.key] ?? ''} onChange={(v) => onOption(control.key, v)} />
                ),
              )}
            </section>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
