export const COLORS = {
  primary: '#1E40AF',
  primaryLight: '#3B82F6',
  primaryPale: '#EFF6FF',
  accent: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  surface: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  categoryColors: {
    academic: '#1E40AF',
    admin: '#7C3AED',
    food: '#D97706',
    sports: '#16A34A',
    medical: '#DC2626',
    library: '#7C3AED',
    lab: '#0891B2',
    hostel: '#0369A1',
    parking: '#374151',
    services: '#64748B',
  } as const,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;
