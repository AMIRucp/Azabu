export const DESIGN = {
  colors: {
    bg0: '#000000',
    bg1: '#0A0E13',
    bg2: '#111418',
    bg3: '#171B22',

    border1: '#1C2028',
    border2: '#252B36',

    text1: '#F0F2F5',
    text2: '#B8BEC8',
    text3: '#6F7785',
    text4: '#404654',
    text5: '#2A2F3A',

    long: '#0ECB81',
    longDim: 'rgba(14,203,129,0.10)',
    longFade: 'rgba(14,203,129,0.04)',
    short: '#F6465D',
    shortDim: 'rgba(246,70,93,0.10)',
    shortFade: 'rgba(246,70,93,0.04)',
    accent: '#D4A574',
    accentDim: 'rgba(212,165,116,0.10)',
    link: '#5B7FFF',

    solana: '#9945FF',

    overlay: 'rgba(0, 0, 0, 0.7)',
  },

  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },

  type: {
    mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    sans: "'Inter', -apple-system, sans-serif",

    sizes: {
      xxs: 9,
      xs: 10,
      sm: 11,
      md: 12,
      lg: 14,
      xl: 16,
      xxl: 20,
      hero: 28,
    },

    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      heavy: 800,
      black: 900,
    },
  },

  radius: {
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
    round: 999,
  },

  layout: {
    headerHeight: 48,
    tabBarHeight: 36,
    panelGap: 1,
    maxWidth: 1440,
  },
} as const;
