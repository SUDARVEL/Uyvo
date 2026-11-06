import { useState } from 'react';
import { Link, Redirect, useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Banner, Body, Button, Field, Mark, Screen, Title } from '@/components/ui';
import { useGame } from '@/state/game';
import { palette } from '@/theme';

export default function SignIn() {
  const game = useGame();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!game.ready) return null;
  if (game.snap.mode !== 'signed_out') {
    return <Redirect href={game.snap.profile?.onboardedAt ? '/forge' : '/onboarding/name'} />;
  }

  if (!game.configured) {
    return (
      <Screen>
        <Mark size={280} />
        <Title>Build your blood</Title>
        <Body>Eat, drink, and wait. Your picture gets stronger.</Body>
        <Button
          label="Start"
          onPress={() => {
            setBusy(true);
            void game.practice().then((destination) => router.replace(destination));
          }}
          disabled={busy}
        />
      </Screen>
    );
  }

  const offline = !game.online;
  return (
    <Screen>
      <Mark size={200} />
      <Title>Sign in</Title>
      <Body>Sign in to keep your days.</Body>
      {offline ? <Banner>You need a network to sign in the first time.</Banner> : null}
      {error ? <Banner tone="crimson">{error}</Banner> : null}
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button
        label="Sign in"
        disabled={busy || offline || email.trim().length === 0 || password.length === 0}
        onPress={() => {
          setBusy(true);
          setError(null);
          void game.signIn(email, password).then((result) => {
            setBusy(false);
            if (result.error) setError(result.error);
            else if (result.destination) router.replace(result.destination);
          });
        }}
      />
      <Link href="/sign-up" style={styles.link}>
        <Text style={styles.linkText}>Create an account</Text>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  link: { alignSelf: 'center' },
  linkText: { color: palette.leaf, fontWeight: '700' },
});
