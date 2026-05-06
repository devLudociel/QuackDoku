export const Colors = {
  // Primary palette
  yellow: '#FFCC00',
  yellowSoft: '#FFF4CC',
  yellowPremium: '#F2B705',
  yellowDark: '#E6A800',

  // Backgrounds
  background: '#FFF8E6',
  white: '#FFFFFF',

  // Text
  black: '#1A1A2E',
  blackPremium: '#121212',
  gray: '#5A5A5A',
  grayLight: '#CCCCCC',
  grayMuted: '#9E9E9E',

  // Semantic
  success: '#4CAF50',
  error: '#FF4D4D',
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
  card: 20,
  button: 18,
  cell: 6,
  badge: 12,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    shadowColor: '#FFCC00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
};
