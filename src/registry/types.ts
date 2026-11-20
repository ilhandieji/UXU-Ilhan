import type { ReactNode } from 'react';

export type Framework = 'react' | 'vanilla';
export type OptionValue = string | boolean;

/** What the user changed in the customize panel. Tokens hold only overrides. */
export interface StudioState {
  options: Record<string, OptionValue>;
  tokens: Record<string, string>;
}

type Base = { key: string; label: string };
export type Control =
  | (Base & { type: 'color'; target: 'token' })
  | (Base & { type: 'slider'; target: 'token'; min: number; max: number; step: number; unit: string })
  | (Base & { type: 'select'; target: 'token' | 'option'; choices: { label: string; value: string }[] })
  | (Base & { type: 'text'; target: 'option' })
  | (Base & { type: 'switch'; target: 'option' });

export interface ControlGroup {
  title: string;
  controls: Control[];
}

export interface VanillaHandle {
  update(state: StudioState): void;
  destroy(): void;
}

/** Server-safe metadata (no React / browser code) */
export interface ComponentMeta {
  slug: string;
  name: string;
  description: string;
  /** Files per framework, relative to components/<slug>/<framework>/ */
  files: Record<Framework, string[]>;
  /** The config file that gets the customized values */
  configFile: string;
  requirements: string[];
}

export interface RegistryEntry extends ComponentMeta {
  controls: ControlGroup[];
  /** Option key that selects the base theme; changing it resets token overrides */
  themeKey: string;
  initialState(): StudioState;
  /** Token values shown in the panel before any override (depends on base theme / size) */
  baseline(state: StudioState): Record<string, string>;
  Preview(props: { state: StudioState }): ReactNode;
  mountVanilla(el: HTMLElement, state: StudioState): VanillaHandle;
  /** Applies state to the config source text */
  customize(configSource: string, state: StudioState): string;
  usage(framework: Framework): string;
}
