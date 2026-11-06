import { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';

import { Banner, Body, Button, Eyebrow, Field, Screen, Title } from '@/components/ui';
import { validateName } from '@/domain/engine';
import { useGame } from '@/state/game';

export default function NameScreen() {
  const game = useGame();
  const router = useRouter();
  const [name, setName] = useState(game.snap.profile?.displayName === 'Hero' ? '' : (game.snap.profile?.displayName ?? ''));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const nameError = name.trim().length === 0 ? null : validateName(name);

  if (!game.ready) return null;
  if (game.snap.mode === 'signed_out') return <Redirect href="/sign-in" />;
  if (game.snap.profile?.onboardedAt) return <Redirect href="/forge" />;

  return (
    <Screen>
      <Eyebrow>UYVO</Eyebrow>
      <Title>Name the Hemo-Hero</Title>
      <Body>2 to 24 characters. The pale, tired, armored, and glowing body follows today's iron and flow.</Body>
      {game.snap.mode === 'device' ? <Banner>Saved on this device. It will sync with your profile once Uyvo is connected.</Banner> : null}
      {error || nameError ? <Banner tone="crimson">{error ?? nameError}</Banner> : null}
      <Field label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
      <Button
        label="Continue"
        disabled={busy || validateName(name) !== null}
        onPress={() => {
          setBusy(true);
          void game.saveName(name).then((saveError) => {
            setBusy(false);
            if (saveError) setError(saveError);
            else router.push('/onboarding/avatar');
          });
        }}
      />
      <Button
        label="Use a different email"
        tone="quiet"
        onPress={() => {
          void game.signOut().then(() => router.replace('/sign-in'));
        }}
      />
    </Screen>
  );
}
