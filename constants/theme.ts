// constants/theme.ts

export const Colors = {
  // Core brand
  primary: '#DDA131',        // Amber — buttons, active toggle, accents
  secondary: '#02153A',      // Navy — the dominant background brand color

  // Backgrounds
  background: '#02153A',     // Deep navy (entire screen bg)
  surface: '#0A2150',        // Slightly lighter navy for cards / elevated surfaces
  inputBackground: '#E8E8E8',// Light grey pill inputs on dark screens

  // Text
  text: '#FFFFFF',           // Primary text on dark backgrounds
  textMuted: '#A0B4CC',      // Muted / secondary text on dark bg
  textOnPrimary: '#02153A',  // Text sitting ON the amber primary colour
  textInput: '#02153A',      // Dark text inside light inputs
  textPlaceholder: '#8A9BB0',// Placeholder text inside inputs

  // Tagline / accent teal
  tagline: '#4FC3D8',        // Cyan/teal used for the tagline text

  // Toggle
  toggleBackground: '#0A2150',   // Pill bg (inactive side)
  toggleActive: '#DDA131',       // Active tab fill
  toggleActiveText: '#02153A',   // Text on active amber tab
  toggleInactiveText: '#DDA131', // Text on inactive dark tab

  // Utility
  error: '#D32F2F',
  success: '#388E3C',
  border: 'rgba(255, 255, 255, 0.12)', // Subtle border on dark surfaces
  muted: '#4A6080',
  overlay: 'rgba(2, 21, 58, 0.85)',    // Semi-transparent navy overlay
};

export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 50,   // For pill-shaped inputs and toggle
  full: 9999,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  button: {
    shadowColor: '#DDA131',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
};