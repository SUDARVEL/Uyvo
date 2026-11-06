import { useState } from 'react';
import { Alert, Platform, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Banner, Body, Button, Eyebrow, Field, Screen, Title } from '@/components/ui';
import { AVATARS, type AvatarId } from '@/domain/engine';
import { useGame } from '@/state/game';
import { palette } from '@/theme';

export default function SettingsScreen() {
  const game = useGame();
  const router = useRouter();
  const profile = game.snap.profile;
  const [name, setName] = useState(profile?.displayName ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Screen>
      <Eyebrow>UYVO</Eyebrow>
      <Title>Settings</Title>
      <Body>{profile?.email ? profile.email : 'On this device'}</Body>
      {game.snap.mode === 'device' ? (
        <Banner>This install has no Supabase project yet. Progress stays on this device.</Banner>
      ) : null}
      {!game.online && game.snap.mode === 'cloud' ? <Banner>Offline — Sync now runs when you are back online.</Banner> : null}
      {error ? <Banner tone="crimson">{error}</Banner> : null}
      {game.snap.lastSyncError ? <Banner tone="crimson">{game.snap.lastSyncError}</Banner> : null}
      <Field label="Display name" value={name} onChangeText={setName} autoCapitalize="words" />
      <Button
        label="Save name"
        disabled={busy}
        onPress={() => {
          setBusy(true);
          void game.saveName(name).then((saveError) => {
            setBusy(false);
            setError(saveError);
          });
        }}
      />
      <Text style={styles.label}>Avatar look</Text>
      <View style={styles.row}>
        {AVATARS.map((avatar) => (
          <Button
            key={avatar}
            label={avatar}
            tone={profile?.avatarId === avatar ? 'leaf' : 'quiet'}
            onPress={() => {
              void game.saveAvatar(avatar as AvatarId).then(setError);
            }}
          />
        ))}
      </View>
      <View style={styles.switchRow}>
        <View style={styles.switchCopy}>
          <Text style={styles.label}>Reminders</Text>
          <Text style={styles.hint}>
            {Platform.OS === 'web'
              ? 'Local reminders are an Android and iOS feature.'
              : '7:30, 11:00, and 13:30.'}
          </Text>
        </View>
        <Switch
          value={Boolean(profile?.remindersEnabled) && Platform.OS !== 'web'}
          disabled={Platform.OS === 'web' || busy}
          onValueChange={(enabled) => {
            void game.setReminders(enabled).then(setError);
          }}
          trackColor={{ false: palette.line, true: palette.leaf }}
          thumbColor={palette.cream}
        />
      </View>
      <Text style={styles.hint}>
        {game.syncing
          ? 'Syncing…'
          : game.snap.lastSyncAt
            ? `Last sync ${new Date(game.snap.lastSyncAt).toLocaleString()}`
            : 'Not synced yet'}
      </Text>
      {game.snap.mode === 'cloud' ? (
        <Button label="Sync now" tone="leaf" disabled={game.syncing} onPress={() => void game.syncNow()} />
      ) : null}
      <Button
        label="Sign out"
        tone="crimson"
        onPress={() => {
          Alert.alert('Sign out of Uyvo?', 'This device forgets the forge until you sign in again.', [
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
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: palette.cream, fontWeight: '700' },
  hint: { color: palette.muted },
  row: { gap: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  switchCopy: { flex: 1, gap: 4 },
});
