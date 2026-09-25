import { useState } from 'react';
import { KeyboardAvoidingView, Modal, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '@/shared/lib/errors';
import { colors, radius, spacing } from '@/shared/theme';

import { Button } from './Button';
import { Input } from './Input';

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (text: string) => Promise<void>;
  onClose: () => void;
};

// Pide un texto obligatorio (motivo de rechazo, descripción de un apoyo, etc.).
export function PromptModal({
  visible,
  title,
  message,
  placeholder,
  submitLabel = 'Enviar',
  onSubmit,
  onClose,
}: Props) {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const close = () => {
    setText('');
    setError(null);
    onClose();
  };

  const submit = async () => {
    if (!text.trim()) {
      setError('Este campo es obligatorio.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(text.trim());
      close();
    } catch (e) {
      setError(getErrorMessage(e, 'No se pudo enviar.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.backdrop} behavior="padding">
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
          <Input
            variant="filled"
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            multiline
            style={styles.input}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <View style={styles.actions}>
            <View style={styles.action}>
              <Button title="Cancelar" variant="outline" onPress={close} />
            </View>
            <View style={styles.action}>
              <Button title={submitLabel} onPress={submit} loading={isSubmitting} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  message: { fontSize: 14, color: colors.textSecondary },
  input: { minHeight: 90, textAlignVertical: 'top' },
  error: { fontSize: 12, color: colors.danger },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
