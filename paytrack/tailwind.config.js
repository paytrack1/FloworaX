/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // ── Brand palette ─────────────────────────────
      colors: {
        // Primary brand — deep navy blue (kept from original identity)
        brand: {
          50: '#EFF6FC',
          100: '#D9E9F8',
          200: '#B3D3F0',
          300: '#7FB2E4',
          400: '#4B8FD1',
          500: '#185FA5', // ← legacy brand blue, kept as the anchor
          600: '#124E89',
          700: '#0F3D6D',
          800: '#0C2E52',
          900: '#0A2440',
          950: '#071A2E',
        },
        // Accent — electric blue used sparingly for interactive highlights
        accent: {
          DEFAULT: '#0EA5E9',
          soft: '#E0F2FE',
        },
        // Surfaces
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F6F8FB',
          sunken: '#EEF2F7',
          raised: '#FFFFFF',
        },
        ink: {
          DEFAULT: '#0F172A', // headings
          secondary: '#475569', // body
          muted: '#94A3B8', // captions
          faint: '#CBD5E1', // disabled
        },
        // Semantic financial indicators
        positive: { DEFAULT: '#059669', soft: '#ECFDF5' },
        negative: { DEFAULT: '#DC2626', soft: '#FEF2F2' },
        warning:  { DEFAULT: '#D97706', soft: '#FFFBEB' },
        info:     { DEFAULT: '#0284C7', soft: '#F0F9FF' },
      },
      // ── Typography scale ─────────────────────────
      fontSize: {
        'display': ['1.875rem', { lineHeight: '2.25rem', fontWeight: '800', letterSpacing: '-0.02em' }],
        'title':   ['1.25rem',  { lineHeight: '1.75rem', fontWeight: '700', letterSpacing: '-0.01em' }],
        'heading': ['1rem',     { lineHeight: '1.5rem',  fontWeight: '600' }],
        'body':    ['0.875rem', { lineHeight: '1.5rem',  fontWeight: '400' }],
        'caption': ['0.75rem',  { lineHeight: '1rem',    fontWeight: '500' }],
        'micro':   ['0.625rem', { lineHeight: '0.875rem', fontWeight: '600' }],
      },
      // ── Elevation (subtle, layered) ──────────────
      boxShadow: {
        xs: '0 1px 2px 0 rgb(15 23 42 / 0.05)',
        sm: '0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.06)',
        md: '0 4px 12px -2px rgb(15 23 42 / 0.08), 0 2px 4px -2px rgb(15 23 42 / 0.05)',
        lg: '0 12px 24px -6px rgb(15 23 42 / 0.10), 0 4px 8px -4px rgb(15 23 42 / 0.05)',
        ring: '0 0 0 3px rgb(24 95 165 / 0.18)',
      },
      borderRadius: {
        card: '1rem',
        field: '0.75rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(4px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out both',
      },
    },
  },
  plugins: [],
};
