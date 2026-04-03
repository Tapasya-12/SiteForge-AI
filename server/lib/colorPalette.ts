import palettes from 'nice-color-palettes'

const PALETTES = palettes as string[][]

export const PRESET_PALETTE_MAP: Record<string, number> = {
  'dark-luxe': 12,
  'bold-agency': 35,
  'clean-saas': 98,
  'minimalist': 204,
  'neon-future': 445,
  'warm-earthy': 67,
}

const normalizePreset = (preset: string): string => {
  const normalized = (preset || '').trim().toLowerCase()
  const labelToKey: Record<string, string> = {
    'dark & luxe': 'dark-luxe',
    'bold agency': 'bold-agency',
    'clean saas': 'clean-saas',
    'minimalist': 'minimalist',
    'neon future': 'neon-future',
    'warm & earthy': 'warm-earthy',
  }

  return labelToKey[normalized] || normalized
}

export const getPaletteForPreset = (preset: string): string[] => {
  const presetKey = normalizePreset(preset)
  const paletteIndex = PRESET_PALETTE_MAP[presetKey]

  if (paletteIndex === undefined || !PALETTES[paletteIndex]) {
    return PALETTES[0]
  }

  return PALETTES[paletteIndex]
}

export const getPalettePromptBlock = (preset: string): string => {
  const presetKey = normalizePreset(preset)
  const colors = getPaletteForPreset(presetKey)

  const isDarkStyle = presetKey === 'dark-luxe' || presetKey === 'neon-future'

  const colorBg = isDarkStyle ? colors[0] : colors[4]
  const colorSecondary = isDarkStyle ? colors[1] : colors[3]
  const colorAccent = isDarkStyle ? colors[2] : colors[2]
  const colorPrimary = isDarkStyle ? colors[3] : colors[1]
  const colorText = isDarkStyle ? colors[4] : colors[0]

  return `STRICT COLOR REQUIREMENT: You must define and use ONLY these CSS custom properties
for all colors in the generated HTML. Define them in :root { } at the top of your
<style> block. Do not use any hardcoded hex values, rgb(), or named colors anywhere
in the CSS except through these variables:
  --color-bg: ${colorBg};
  --color-primary: ${colorPrimary};
  --color-secondary: ${colorSecondary};
  --color-accent: ${colorAccent};
  --color-text: ${colorText};
Apply --color-bg as the page background, --color-text as the main text color,
--color-primary for buttons and headings, --color-secondary for cards and
section backgrounds, --color-accent for highlights, borders, and hover states.`
}
