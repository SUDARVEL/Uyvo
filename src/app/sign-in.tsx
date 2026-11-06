import { useState } from 'react';
import { Link, Redirect, useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Banner, Body, Button, Eyebrow, Field, Screen, Title } from '@/components/ui';
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
        <Eyebrow>UYVO</Eyebrow>
        <Title>The forge waits</Title>
        <Body>
          No Supabase project is connected yet. Practice keeps the Hemo-Hero, Iron Shards, and Flow Points on this device
          and does not sync.
        </Body>
        <Button
          label="Practice on this device"
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
      <Eyebrow>UYVO</Eyebrow>
      <Title>Sign in</Title>
      <Body>Your Hemo-Hero keeps today's forge on this phone, then syncs when you are online.</Body>
      {offline ? <Banner>Sign in needs a connection. The forge unlocks after the first session.</Banner> : null}
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
