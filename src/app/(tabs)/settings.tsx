import { useState } from 'react';
import { Alert, Platform, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Banner, Body, Button, Eyebrow, Field, Screen, Title } from '@/components/ui';
import { PERSON_LABEL } from '@/domain/copy';
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
      {profile?.email ? <Body>{profile.email}</Body> : null}
      {!game.online && game.snap.mode === 'cloud' ? <Banner>No network.</Banner> : null}
      {error ? <Banner tone="crimson">{error}</Banner> : null}
      {game.snap.lastSyncError ? <Banner tone="crimson">{game.snap.lastSyncError}</Banner> : null}
      <Field label="Your name" value={name} onChangeText={setName} autoCapitalize="words" />
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
      <Text style={styles.label}>Picture</Text>
      <View style={styles.row}>
        {AVATARS.map((avatar) => (
          <Button
            key={avatar}
            label={PERSON_LABEL[avatar]}
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
              ? 'Reminders work in the app, not in this browser.'
              : 'Morning 7:30, juice 11:00, lunch 1:30.'}
          </Text>
        </View>
        <Switch
          value={Boolean(profile?.remindersEnabled) && Platform.OS !== 'web'}
          disabled={Platform.OS === 'web' || busy}
          onValueChange={(enabled) => {
            void game.setReminders(enabled).then(setError);
          }}
          trackColor={{ false: palette.line, true: palette.leaf }}
          thumbColor="#FFFFFF"
        />
      </View>
      {game.snap.mode === 'cloud' ? (
        <Text style={styles.hint}>
          {game.syncing
            ? 'Sending…'
            : game.snap.lastSyncAt
              ? `Last sent ${new Date(game.snap.lastSyncAt).toLocaleString()}`
              : 'Not sent yet'}
        </Text>
      ) : null}
      {game.snap.mode === 'cloud' ? (
        <Button label="Send now" tone="leaf" disabled={game.syncing} onPress={() => void game.syncNow()} />
      ) : null}
      <Button
        label="Sign out"
        tone="crimson"
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
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: palette.ink, fontWeight: '600' },
  hint: { color: palette.muted },
  row: { gap: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  switchCopy: { flex: 1, gap: 4 },
});
