import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Field, Screen } from '@/components/ui';
import { adminMatches } from '@/lib/admin-gate';
import { appNow } from '@/lib/clock';
import type { PlanKey, PlanStep } from '@/domain/plan';
import { useGame } from '@/state/game';
import { PullRefresh } from '@/state/refresh';
import { font, palette } from '@/theme';

function testDateLabel(offset: number): string {
  const text = appNow().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '');
  if (offset === 0) return `${text} · real date`;
  const days = Math.abs(offset);
  return `${text} · ${days} ${days === 1 ? 'day' : 'days'} ${offset > 0 ? 'ahead' : 'back'}`;
}

function ToolButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.tool, disabled ? styles.toolOff : null]}>
      <Text style={styles.toolText}>{label}</Text>
    </Pressable>
  );
}

export default function AdminScreen() {
  const game = useGame();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<PlanStep[]>(game.plan);
  const [notice, setNotice] = useState<string | null>(null);
  const [toolNote, setToolNote] = useState<string | null>(null);

  useEffect(() => {
    setDraft(game.plan);
  }, [game.plan]);

  if (!game.ready) return null;

  if (!game.adminOpen) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          alwaysBounceVertical
          refreshControl={<PullRefresh />}>
        <View style={styles.grow}>
        <View style={styles.pad}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.title}>Admin</Text>
          <Text style={styles.lead}>This login is separate from Start. Change the names and what to do.</Text>
          <Field label="Id" value={id} onChangeText={setId} autoCapitalize="none" />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
        </View>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <Button
            label="Open"
            onPress={() => {
              if (!adminMatches(id, password)) {
                setError('That id or password is wrong.');
                return;
              }
              setError(null);
              void game.setAdminOpen(true);
            }}
          />
        </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const update = (key: PlanKey, field: 'title' | 'detail' | 'body' | 'action', value: string) => {
    setNotice(null);
    setDraft((current) => current.map((step) => (step.key === key ? { ...step, [field]: value } : step)));
  };

  return (
    <Screen>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <Text style={styles.title}>Admin</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Test tools</Text>
        <Text style={styles.lead}>Skip days to test everything. Normal users never see this.</Text>
        <View style={styles.dateBox}>
          <Text style={styles.dateLabel}>Test date in use</Text>
          <Text style={styles.dateValue}>{testDateLabel(game.dayOffset)}</Text>
        </View>
        <View style={styles.tools}>
          <ToolButton
            label="Next day"
            onPress={() => {
              void game.moveDay(1).then(() => setToolNote('Moved one day on.'));
            }}
          />
          <ToolButton
            label="Back a day"
            onPress={() => {
              void game.moveDay(-1).then(() => setToolNote('Moved one day back.'));
            }}
          />
          <ToolButton
            label="Back to today"
            disabled={game.dayOffset === 0}
            onPress={() => {
              void game.moveDay('today').then(() => setToolNote('Back to the real date.'));
            }}
          />
          <ToolButton
            label="End the wait now"
            onPress={() => {
              void game.endWait().then((error) => setToolNote(error ?? 'The wait is finished.'));
            }}
          />
        </View>
        {toolNote ? <Text style={styles.saved}>{toolNote}</Text> : null}
      </View>
      <Text style={styles.title}>Edit the day</Text>
      <Text style={styles.lead}>Change a name or the words. The iron and flow numbers stay the same. People rename their own foods in Settings.</Text>
      {draft.map((step) => (
        <View key={step.key} style={styles.card}>
          <Field label="Name" value={step.title} onChangeText={(value) => update(step.key, 'title', value)} autoCapitalize="words" />
          <Field label="Short line" value={step.detail} onChangeText={(value) => update(step.key, 'detail', value)} autoCapitalize="words" />
          {step.body || step.key === 'morning_shot' || step.key === 'midmorning_juice' || step.key === 'lunch_greens' || step.key === 'wait' || step.key === 'bonus' ? (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>What to do</Text>
              <TextInput
                value={step.body}
                onChangeText={(value) => update(step.key, 'body', value)}
                multiline
                style={styles.area}
              />
            </View>
          ) : null}
          {step.action || step.key === 'morning_shot' || step.key === 'midmorning_juice' || step.key === 'lunch_greens' || step.key === 'wait' ? (
            <Field label="Button" value={step.action} onChangeText={(value) => update(step.key, 'action', value)} autoCapitalize="words" />
          ) : null}
        </View>
      ))}
      {notice ? <Text style={styles.saved}>{notice}</Text> : null}
      <Button
        label="Save"
        onPress={() => {
          void game.savePlan(draft).then(() => setNotice('Saved on this phone.'));
        }}
      />
      <Button
        label="Sign out of admin"
        tone="quiet"
        onPress={() => {
          void game.setAdminOpen(false);
        }}
      />
      <View style={{ height: Math.max(insets.bottom, 16) }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  grow: { flexGrow: 1 },
  pad: { paddingHorizontal: 24, paddingTop: 8, gap: 12 },
  footer: { paddingHorizontal: 24 },
  back: {
    alignSelf: 'flex-start',
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: palette.raised,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: palette.ink, fontFamily: font.bold, fontSize: 14 },
  title: { color: palette.ink, fontFamily: font.display, fontSize: 36, letterSpacing: -0.6 },
  lead: { color: palette.muted, fontFamily: font.text, fontSize: 15, lineHeight: 22 },
  error: { color: palette.crimson, fontFamily: font.semibold, fontSize: 13 },
  cardTitle: { color: palette.ink, fontFamily: font.bold, fontSize: 18 },
  dateBox: { backgroundColor: palette.amberSoft, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, gap: 2 },
  dateLabel: { color: palette.orange, fontFamily: font.semibold, fontSize: 12 },
  dateValue: { color: palette.ink, fontFamily: font.bold, fontSize: 15 },
  tools: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tool: {
    flexGrow: 1,
    flexBasis: '45%',
    height: 48,
    borderRadius: 999,
    backgroundColor: palette.crimson,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolOff: { opacity: 0.4 },
  toolText: { color: '#FFFFFF', fontFamily: font.bold, fontSize: 15 },
  saved: { color: palette.leaf, fontFamily: font.semibold, fontSize: 14 },
  card: { backgroundColor: palette.raised, borderRadius: 24, padding: 16, gap: 12 },
  field: { gap: 6 },
  fieldLabel: { color: palette.muted, fontSize: 13, fontFamily: font.semibold },
  area: {
    minHeight: 88,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: palette.line,
    backgroundColor: palette.bg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: palette.ink,
    fontFamily: font.semibold,
    fontSize: 16,
    textAlignVertical: 'top',
  },
});
