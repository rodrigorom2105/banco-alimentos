// Paleta "Solidaridad cercana", tomada de los píxeles del logo de BAMX. Los mismos valores
// viven en global.css (@theme): si cambias uno, cámbialo en ambos.
export const colors = {
  primary: '#CE0E2D',
  primaryLight: '#F9CBD3',
  primaryDark: '#B00C26',
  accent: '#F19800',
  success: '#00953B',
  successTint: '#E5F4EB',
  text: '#59595D',
  textSecondary: '#78787C',
  background: '#FFFBF5',
  backgroundTint: '#FDECEF',
  surface: '#F4F4F5',
  border: '#E6E1DA',
  danger: '#B3261E',
  dangerTint: '#FDECEC',
  warning: '#C87D00',
  warningTint: '#FFF5E0',
} as const;

// Nombres de las fuentes cargadas en _layout.tsx. Con una fuente personalizada no se usa
// fontWeight: cada peso es su propia fuente.
export const fonts = {
  title: 'Nunito_800ExtraBold',
  heading: 'Nunito_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodyBold: 'Inter_600SemiBold',
} as const;

export const gradients = {
  auth: ['#FFFBF5', '#FDECEF'],
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
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
