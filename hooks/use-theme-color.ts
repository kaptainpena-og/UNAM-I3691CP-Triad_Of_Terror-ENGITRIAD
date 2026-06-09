// hooks/use-theme-color.ts

/**
 * Simplified theme colour hook.
 * The EngiTriad design system uses a single flat colour palette (no separate
 * light / dark sub-objects), so this hook now just returns the caller-supplied
 * override value (light/dark prop) when provided, otherwise it falls back to a
 * static default colour passed directly.
 */

export function useThemeColor(
  props: { light?: string; dark?: string },
  _colorName: string
): string {
  return props.light ?? props.dark ?? '#FFFFFF';
}
