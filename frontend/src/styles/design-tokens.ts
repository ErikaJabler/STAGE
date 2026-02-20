/**
 * Consid Design Tokens
 * Based on Consid Brand Guidelines 2025
 *
 * Use CSS variables (globals.css) for styling.
 * Use these tokens when you need color values in TypeScript (e.g., charts, dynamic styles).
 */

export const colors = {
  // Main colors
  burgundy: '#701131',
  raspberryRed: '#B5223F',
  lightOrange: '#F49E88',

  // Complementary colors
  black: '#1C1C1C',
  darkPurple: '#492A34',
  greige: '#A99B94',
  orange: '#EC6B6A',
  beige: '#EFE6DD',
  white: '#FFFFFF',
} as const;

export const semanticColors = {
  bgPrimary: colors.beige,
  bgSidebar: colors.burgundy,
  bgCard: colors.white,

  textPrimary: colors.black,
  textSecondary: colors.darkPurple,
  textMuted: colors.greige,
  textOnDark: colors.beige,
  textOnBurgundy: colors.white,

  accent: colors.raspberryRed,
  highlight: colors.lightOrange,
  danger: colors.raspberryRed,
  success: '#2D7A4F',
  warning: colors.orange,
} as const;

export const typography = {
  fontFamily: "'Consid Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
  },
  sizes: {
    xs: '0.75rem',
    sm: '0.8125rem',
    base: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
} as const;

export const spacing = {
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
} as const;

export const layout = {
  sidebarWidth: 240,
  sidebarCollapsedWidth: 64,
  topbarHeight: 56,
} as const;

/**
 * WCAG-approved color combinations from Consid Brand Guidelines.
 * Use these when choosing text/background pairs.
 *
 * Approved (AA compliant):
 * - White/Beige text on Burgundy ✅
 * - White/Beige text on Raspberry Red ✅
 * - White/Beige text on Dark Purple ✅
 * - Black/Dark Purple text on Beige ✅
 * - Black/Burgundy text on White ✅
 * - Burgundy text on Beige ✅
 * - Burgundy text on Light Orange ✅
 *
 * NOT approved:
 * - Light Orange text on Beige ✗
 * - Greige text on Beige ✗
 * - Orange text on Light Orange ✗
 * - Raspberry Red on Burgundy ✗
 */
