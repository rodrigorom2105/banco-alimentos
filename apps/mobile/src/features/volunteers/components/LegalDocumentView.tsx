import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/shared/theme';

import { IS_DRAFT, type LegalDocument } from '../legal';

// Dibuja un aviso legal. Si el texto sigue en borrador lo dice en pantalla, no solo en el
// código: quien lo lea tiene derecho a saber que todavía no lo revisó el área legal de BAMX.
export function LegalDocumentView({ document }: { document: LegalDocument }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {IS_DRAFT && (
        <View style={styles.draft}>
          <Text style={styles.draftTitle}>Borrador</Text>
          <Text style={styles.draftText}>
            Este texto es una versión preliminar y está pendiente de revisión por BAMX Guadalajara.
          </Text>
        </View>
      )}

      <Text style={styles.intro}>{document.intro}</Text>

      {document.sections.map((section) => (
        <View key={section.heading} style={styles.section}>
          <Text style={styles.heading}>{section.heading}</Text>
          <Text style={styles.body}>{section.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.lg, paddingBottom: spacing.xl * 2 },
  draft: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
  },
  draftTitle: { fontSize: 14, fontWeight: '700', color: colors.danger },
  draftText: { fontSize: 13, color: colors.text },
  intro: { fontSize: 14, lineHeight: 21, color: colors.text },
  section: { gap: spacing.xs },
  heading: { fontSize: 15, fontWeight: '700', color: colors.primary },
  body: { fontSize: 14, lineHeight: 21, color: colors.textSecondary },
});
