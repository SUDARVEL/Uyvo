import { type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette } from '@/theme';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.frame}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

export function Boot() {
  return (
    <View style={styles.boot}>
      <Text style={styles.brand}>Uyvo</Text>
      <Text style={styles.muted}>Lighting the forge…</Text>
    </View>
  );
}

export function Eyebrow({ children }: { children: string }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function Title({ children }: { children: string }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Body({ children, style }: { children: ReactNode; style?: TextStyle }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function Banner({ children, tone = 'orange' }: { children: ReactNode; tone?: 'orange' | 'leaf' | 'crimson' }) {
  const background = tone === 'leaf' ? '#143328' : tone === 'crimson' ? '#3A1018' : '#3A2014';
  return (
    <View style={[styles.banner, { backgroundColor: background }]}>
      <Text style={styles.bannerText}>{children}</Text>
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  secureTextEntry,
  autoCapitalize = 'none',
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'words';
  keyboardType?: 'default' | 'email-address';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        autoCorrect={false}
        placeholderTextColor={palette.muted}
        style={styles.input}
      />
    </View>
  );
}

export function Button({
  label,
  onPress,
  disabled,
  tone = 'orange',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'orange' | 'crimson' | 'leaf' | 'quiet';
}) {
  const background =
    tone === 'crimson' ? palette.crimson : tone === 'leaf' ? palette.leaf : tone === 'quiet' ? palette.raised : palette.orange;
  const color = tone === 'quiet' || tone === 'crimson' ? palette.cream : palette.ink;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
      ]}>
      <Text style={[styles.buttonText, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function Sheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          <Text style={styles.sheetTitle}>{title}</Text>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function cardStyle(extra?: ViewStyle): ViewStyle[] {
  return [styles.card, extra ?? {}];
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  frame: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
  content: { padding: 20, paddingBottom: 48, gap: 14 },
  boot: { flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', gap: 8 },
  brand: { color: palette.orange, fontSize: 42, fontWeight: '800' },
  eyebrow: { color: palette.orange, fontSize: 12, letterSpacing: 2, fontWeight: '700' },
  title: { color: palette.cream, fontSize: 32, fontWeight: '800' },
  body: { color: palette.cream, fontSize: 16, lineHeight: 22 },
  muted: { color: palette.muted, fontSize: 15 },
  banner: { borderRadius: 14, padding: 12 },
  bannerText: { color: palette.cream, fontSize: 14, lineHeight: 20 },
  field: { gap: 6 },
  label: { color: palette.muted, fontSize: 13 },
  input: {
    backgroundColor: palette.raised,
    color: palette.cream,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: { borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '800' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: palette.raised,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderColor: palette.line,
  },
  sheetTitle: { color: palette.cream, fontSize: 22, fontWeight: '800' },
  card: {
    backgroundColor: palette.raised,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 14,
    gap: 8,
  },
});
