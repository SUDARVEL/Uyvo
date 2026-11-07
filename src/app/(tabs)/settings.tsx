import { useState } from 'react';
import { Alert, Image, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { heroArt } from '@/art';
import { Banner, Screen } from '@/components/ui';
import { Icon, Toggle } from '@/components/icons';
import { PERSON_LABEL, REMINDERS } from '@/domain/copy';
import { AVATARS, heroState, localDate, logsOn, vesselRatio, type AvatarId } from '@/domain/engine';
import { useGame } from '@/state/game';
import { font, palette } from '@/theme';

export default function SettingsScreen() {
  const game = useGame();
  const router = useRouter();
  const profile = game.snap.profile;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.displayName ?? '');
  const [error, setError] = useState<string | null>(null);
  const today = localDate(new Date());
  const state = heroState(vesselRatio(logsOn(game.snap.logs, today)));
  const avatar = profile?.avatarId ?? 'woman';

  return (
    <Screen>
      <Text style={styles.title}>Settings</Text>
      {!game.online && game.snap.mode === 'cloud' ? <Banner>No network.</Banner> : null}
      {error ? <Banner tone="crimson">{error}</Banner> : null}
      <View style={styles.profile}>
        <Image source={heroArt[avatar][state]} resizeMode="contain" style={styles.avatar} />
        <View style={styles.grow}>
          <Text style={styles.name}>{profile?.displayName}</Text>
          <Text style={styles.meta}>
            {game.snap.streak.currentStreak} days in a row · {game.snap.tree.fruitCount} red fruit
          </Text>
        </View>
      </View>

      <Text style={styles.group}>YOU</Text>
      <View style={styles.card}>
        <Pressable accessibilityRole="button" onPress={() => setEditing((open) => !open)} style={styles.row}>
          <Text style={styles.rowLabel}>Name</Text>
          <Text style={styles.rowValue}>{profile?.displayName}</Text>
          <Icon name="chevron" size={18} />
        </Pressable>
        {editing ? (
          <View style={styles.edit}>
            <TextInput value={name} onChangeText={setName} autoCapitalize="words" style={styles.input} />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void game.saveName(name).then((saveError) => {
                  setError(saveError);
                  if (!saveError) setEditing(false);
                });
              }}
              style={styles.save}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.line} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Picture</Text>
          <View style={styles.segment}>
            {AVATARS.map((choice) => {
              const on = avatar === choice;
              return (
                <Pressable
                  key={choice}
                  accessibilityRole="button"
                  onPress={() => {
                    void game.saveAvatar(choice as AvatarId).then(setError);
                  }}
                  style={[styles.segmentItem, on ? styles.segmentOn : null]}>
                  <Text style={[styles.segmentText, on ? styles.segmentTextOn : null]}>{PERSON_LABEL[choice]}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <Text style={styles.group}>REMINDERS</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Reminders</Text>
          <Toggle
            value={Boolean(profile?.remindersEnabled) && Platform.OS !== 'web'}
            disabled={Platform.OS === 'web'}
            onValueChange={(enabled) => {
              void game.setReminders(enabled).then(setError);
            }}
          />
        </View>
        {REMINDERS.map((reminder) => {
          const clock = `${reminder.hour % 12 || 12}:${String(reminder.minute).padStart(2, '0')} ${reminder.hour < 12 ? 'AM' : 'PM'}`;
          const label = reminder.id === 'uyvo-0730' ? 'Soaked dry fruit' : reminder.id === 'uyvo-1100' ? 'Red juice' : 'Green lunch';
          return (
            <Pressable
              key={reminder.id}
              accessibilityRole="button"
              onPress={() => {
                if (reminder.id === 'uyvo-0730') router.push('/reminder');
              }}
              style={styles.row}>
              <Text style={styles.rowLabel}>{label}</Text>
              <Text style={styles.rowValue}>{clock}</Text>
              <Icon name="chevron" size={18} />
            </Pressable>
          );
        })}
        <Text style={styles.hint}>Each reminder opens Today.</Text>
        {Platform.OS === 'web' ? <Text style={styles.hint}>Reminders work in the app, not in this browser.</Text> : null}
      </View>

      {game.snap.mode === 'cloud' ? (
        <>
          <Text style={styles.group}>CLOUD</Text>
          <View style={styles.card}>
            <Pressable accessibilityRole="button" onPress={() => void game.syncNow()} style={styles.row}>
              <Text style={styles.rowLabel}>{game.syncing ? 'Sending…' : 'Send now'}</Text>
              <Icon name="chevron" size={18} />
            </Pressable>
          </View>
        </>
      ) : null}

      <Text style={styles.group}>ACCOUNT</Text>
      <View style={styles.card}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            Alert.alert('Leave Uyvo?', 'You can start again later.', [
              { text: 'Stay', style: 'cancel' },
              {
                text: 'Sign out',
                style: 'destructive',
                onPress: () => {
                  void game.signOut().then(() => router.replace('/sign-in'));
                },
              },
            ]);
          }}
          style={styles.row}>
          <Text style={styles.signOut}>Sign out</Text>
        </Pressable>
      </View>
      <Text style={styles.footer}>No leaderboard. No camera. No shop.{'\n'}Just you and your picture.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: palette.ink, fontFamily: font.display, fontSize: 36 },
  profile: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: palette.raised, borderRadius: 24, padding: 14 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: palette.blush },
  grow: { flex: 1, gap: 2 },
  name: { color: palette.ink, fontFamily: font.display, fontSize: 24 },
  meta: { color: palette.muted, fontFamily: font.text, fontSize: 13 },
  group: { color: palette.tertiary, fontFamily: font.bold, fontSize: 12, letterSpacing: 1.3, marginTop: 4 },
  card: { backgroundColor: palette.raised, borderRadius: 24, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 56 },
  rowLabel: { flex: 1, color: palette.ink, fontFamily: font.semibold, fontSize: 16 },
  rowValue: { color: palette.muted, fontFamily: font.text, fontSize: 15 },
  line: { height: 1, backgroundColor: palette.line },
  edit: { flexDirection: 'row', gap: 8, paddingBottom: 12 },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.crimson,
    paddingHorizontal: 12,
    color: palette.ink,
    fontFamily: font.semibold,
    backgroundColor: palette.bg,
  },
  save: { backgroundColor: palette.crimson, borderRadius: 14, paddingHorizontal: 14, justifyContent: 'center' },
  saveText: { color: '#FFFFFF', fontFamily: font.bold },
  segment: { flexDirection: 'row', backgroundColor: palette.sunken, borderRadius: 999, padding: 3 },
  segmentItem: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  segmentOn: { backgroundColor: palette.raised },
  segmentText: { color: palette.muted, fontFamily: font.semibold, fontSize: 14 },
  segmentTextOn: { color: palette.ink },
  hint: { color: palette.tertiary, fontFamily: font.text, fontSize: 13, paddingBottom: 12 },
  signOut: { color: palette.crimson, fontFamily: font.semibold, fontSize: 16 },
  footer: { color: palette.muted, fontFamily: font.italic, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 8 },
});
