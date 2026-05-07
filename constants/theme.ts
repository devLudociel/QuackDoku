export const Colors = {
  // Primary palette
  yellow: '#FFC700',
  yellowSoft: '#FFF4BF',
  yellowPremium: '#FFB800',
  yellowDark: '#D99A00',

  // Backgrounds
  background: '#F7F7F3',
  white: '#FFFFFF',
  ink: '#080913',
  navy: '#11112A',
  navyCard: '#1B1B3D',
  navyMuted: '#2A2A52',
  surface: '#F1F1EE',

  // Text
  black: '#10101F',
  blackPremium: '#10101C',
  gray: '#777783',
  grayLight: '#E7E7E2',
  grayMuted: '#A2A2AD',
  whiteMuted: '#D8D8E8',

  // Semantic
  success: '#20B85A',
  successSoft: '#DDF8E8',
  error: '#E84855',
  errorSoft: '#FFE3E7',
  warning: '#FF8C00',

  // Rarity
  common: '#9E9E9E',
  rare: '#2196F3',
  epic: '#9C27B0',
  legendary: '#FFD700',

  // Board
  boardBorderRoom: '#3A3A3A',
  boardBorderInner: '#CCCCCC',
  cellSelected: '#FFCC00',
  cellCorrect: '#E8F5E9',
  cellError: '#FFEBEE',
  cellConflict: '#FFE0E0',
  cellFixed: '#F5F0E0',
  cellHint: '#FFF4CC',

  // Room colors (6 rooms)
  room0: 'rgba(244, 164, 96, 0.25)',   // Kitchen - sand
  room1: 'rgba(144, 238, 144, 0.25)',  // Living room - green
  room2: 'rgba(173, 216, 230, 0.25)',  // Library - blue
  room3: 'rgba(255, 182, 193, 0.25)',  // Garden - pink
  room4: 'rgba(221, 160, 221, 0.25)',  // Dining room - plum
  room5: 'rgba(255, 228, 181, 0.25)',  // Lobby - peach
  room6: 'rgba(176, 196, 222, 0.25)',  // Garage - steel
  room7: 'rgba(152, 251, 152, 0.25)',  // Lounge - pale green
  room8: 'rgba(255, 218, 185, 0.25)',  // Attic - peach puff
};

export const Fonts = {
  family: 'System',
  h1: 32,
  h2: 24,
  h3: 20,
  body: 16,
  small: 14,
  xs: 12,
};

export const Radius = {
  card: 18,
  button: 24,
  cell: 6,
  badge: 14,
  pill: 999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  button: {
    shadowColor: '#FFC700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
  darkCard: {
    shadowColor: '#050508',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 6,
  },
};
