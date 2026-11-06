import { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';

import { Banner, Body, Button, Field, Mark, Screen, Title } from '@/components/ui';
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
      <Mark size={220} />
      <Title>What is your name?</Title>
      <Body>Use 2 to 24 letters.</Body>
      {error || nameError ? <Banner tone="crimson">{error ?? nameError}</Banner> : null}
      <Field label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
      <Button
        label="Next"
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
        label={game.snap.mode === 'device' ? 'Start over' : 'Use a different email'}
        tone="quiet"
        onPress={() => {
          void game.signOut().then(() => router.replace('/sign-in'));
        }}
      />
    </Screen>
  );
}
