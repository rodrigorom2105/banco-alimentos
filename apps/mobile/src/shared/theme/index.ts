export const colors = {
  primary: '#607B73',
  primaryLight: '#839E8A',
  primaryDark: '#3E5A52',
  text: '#11181C',
  textSecondary: '#717777',
  background: '#FFFFFF',
  backgroundTint: '#C4DCCF',
  surface: '#E4E4E4',
  border: '#DDDDDD',
  danger: '#E5484D',
  dangerTint: '#FDECEC',
  warning: '#9A6700',
  warningTint: '#FFF4D6',
} as const;

export const gradients = {
  auth: ['#F1F1F1', '#E1ECE2'],
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 20,
  pill: 40,
} as const;

// Sombra suave para elementos que flotan (iOS usa shadow*, Android elevation).
export const shadows = {
  floating: {
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
} as const;
