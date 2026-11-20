'use client';

import { __Name__ } from '@lib/__name__/react/__Name__';
import { defaults, sizes, themes, variants, type __Name__Options } from '@lib/__name__/react/__name__.config';
import { create__Name__ } from '@lib/__name__/vanilla/__name__';
import { hasKey, setValue } from '@/lib/customize-config';
import { __name__Meta } from './__name__.meta';
import type { RegistryEntry, StudioState } from './types';

type ThemeName = keyof typeof themes;

const initialOptions = { theme: defaults.theme as string, variant: defaults.variant as string, size: defaults.size as string, label: defaults.label };

function toOptions(state: StudioState): __Name__Options {
  const o = state.options;
  const base = (String(o.theme) in themes ? o.theme : 'dark') as ThemeName;
  const size = o.size as keyof typeof sizes;
  const variant = o.variant as keyof typeof variants;
  return { theme: { ...themes[base], ...sizes[size], ...state.tokens, ...variants[variant] }, size, variant, label: String(o.label) };
}

export const __name__: RegistryEntry = {
  ...__name__Meta,
  themeKey: 'theme',
  controls: [
    {
      title: 'Theme',
      controls: [
        { type: 'select', target: 'option', key: 'theme', label: 'Preset', choices: Object.keys(themes).map((v) => ({ label: v, value: v })) },
        { type: 'color', target: 'token', key: 'bg', label: 'Background' },
        { type: 'color', target: 'token', key: 'fg', label: 'Text' },
        { type: 'color', target: 'token', key: 'border', label: 'Border' },
      ],
    },
    {
      title: 'Frame',
      controls: [
        { type: 'select', target: 'option', key: 'variant', label: 'Variant', choices: Object.keys(variants).map((v) => ({ label: v, value: v })) },
        { type: 'select', target: 'option', key: 'size', label: 'Size', choices: Object.keys(sizes).map((v) => ({ label: v, value: v })) },
        { type: 'slider', target: 'token', key: 'radius', label: 'Radius', min: 0, max: 24, step: 1, unit: 'px' },
      ],
    },
    { title: 'Content', controls: [{ type: 'text', target: 'option', key: 'label', label: 'Label' }] },
  ],
  initialState: () => ({ options: { ...initialOptions }, tokens: {} }),
  baseline: (state) => ({ ...themes[(String(state.options.theme) in themes ? state.options.theme : 'dark') as ThemeName], ...sizes[state.options.size as keyof typeof sizes] }),
  Preview: ({ state }) => <__Name__ {...toOptions(state)} />,
  mountVanilla(el, state) {
    const inst = create__Name__(el, toOptions(state));
    return { update: (next) => inst.update(toOptions(next)), destroy: () => inst.destroy() };
  },
  customize(source, state) {
    const base = String(state.options.theme);
    const size = String(state.options.size);
    let out = source;
    for (const [key, value] of Object.entries(state.options)) {
      if (initialOptions[key as keyof typeof initialOptions] !== value) out = setValue(out, ['defaults'], key, value);
    }
    for (const [key, value] of Object.entries(state.tokens)) {
      out = setValue(out, hasKey(out, ['sizes', size], key) ? ['sizes', size] : ['themes', base], key, value);
    }
    return out;
  },
  usage: (framework) =>
    framework === 'react'
      ? `import { __Name__ } from "./__Name__";\n\nexport default function Page() {\n  return <__Name__ />;\n}`
      : `import { create__Name__ } from "./__name__";\n\ncreate__Name__(document.querySelector("#__name__")!);`,
};
