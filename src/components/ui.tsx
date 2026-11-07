import { type ReactNode } from 'react';
import {
  Image,
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

import { markArt } from '@/art';
import { font, palette } from '@/theme';

export function Screen({ children, overlay }: { children: ReactNode; overlay?: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.frame}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        {overlay}
      </View>
    </SafeAreaView>
  );
}

export function Mark({ size = 220 }: { size?: number }) {
  return (
    <Image
      source={markArt}
      accessibilityLabel="Uyvo"
      style={{ width: size, height: size, alignSelf: 'center' }}
    />
  );
}

export function Boot() {
  return (
    <View style={styles.boot}>
      <Mark size={180} />
      <Text style={styles.muted}>One moment…</Text>
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
  const background = tone === 'leaf' ? '#E5F4EA' : tone === 'crimson' ? '#F8E6E8' : '#EEF1F6';
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
  const background = tone === 'quiet' ? palette.raised : palette.crimson;
  const color = tone === 'quiet' ? palette.ink : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === 'quiet' ? styles.quiet : null,
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
  content: { padding: 24, paddingBottom: 120, gap: 16 },
  boot: { flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', gap: 8 },
  brand: { color: palette.ink, fontSize: 40, fontFamily: font.display },
  eyebrow: { color: palette.tertiary, fontSize: 12, letterSpacing: 1.4, fontFamily: font.bold },
  title: { color: palette.ink, fontSize: 36, lineHeight: 42, fontFamily: font.display },
  body: { color: palette.muted, fontSize: 16, lineHeight: 22, fontFamily: font.text },
  muted: { color: palette.muted, fontSize: 15, fontFamily: font.text },
  banner: { borderRadius: 16, padding: 12 },
  bannerText: { color: palette.ink, fontSize: 14, lineHeight: 20, fontFamily: font.text },
  field: { gap: 6 },
  label: { color: palette.muted, fontSize: 13, fontFamily: font.semibold },
  input: {
    backgroundColor: palette.raised,
    color: palette.ink,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: palette.line,
    paddingHorizontal: 16,
    height: 60,
    fontSize: 18,
    fontFamily: font.semibold,
  },
  button: { borderRadius: 999, height: 56, alignItems: 'center', justifyContent: 'center' },
  quiet: { borderWidth: 1.5, borderColor: palette.line },
  buttonText: { fontSize: 16, fontFamily: font.bold },
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
  sheetTitle: { color: palette.ink, fontSize: 22, fontFamily: font.display },
  card: {
    backgroundColor: palette.raised,
    borderRadius: 24,
    padding: 16,
    gap: 8,
    shadowColor: '#5C331F',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
});
