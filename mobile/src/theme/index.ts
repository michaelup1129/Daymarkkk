import { StyleSheet } from 'react-native';

export const colors = {
  background: '#FFF9F0',
  surface: '#FFFFFF',
  ink: '#292238',
  muted: '#706779',
  primary: '#6941C6',
  lavender: '#EDE4FF',
  peach: '#FFE1CD',
  yellow: '#FFF0B3',
  border: '#E6DDED',
};

export const ui = StyleSheet.create({
  title: { fontSize: 32, fontWeight: '800', color: colors.ink },
  heading: { fontSize: 20, fontWeight: '700', color: colors.ink },
  body: { fontSize: 16, lineHeight: 25, color: colors.muted },
  caption: { fontSize: 13, lineHeight: 20, color: colors.muted },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 24,
    gap: 16,
  },
});
