import { useState } from 'react';
import { Link, Redirect, useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Banner, Body, Button, Eyebrow, Field, Screen, Title } from '@/components/ui';
import { useGame } from '@/state/game';
import { palette } from '@/theme';

export default function SignUp() {
  const game = useGame();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!game.ready) return null;
  if (!game.configured) return <Redirect href="/sign-in" />;
  if (game.snap.mode !== 'signed_out') {
    return <Redirect href={game.snap.profile?.onboardedAt ? '/forge' : '/onboarding/name'} />;
  }

  const mismatch = confirm.length > 0 && confirm !== password;
  const offline = !game.online;
  const ready = email.includes('@') && password.length >= 8 && password === confirm && !offline;

  return (
    <Screen>
      <Eyebrow>UYVO</Eyebrow>
      <Title>Make an account</Title>
      <Body>Email and a password of at least 8 letters. Your name comes next.</Body>
      {offline ? <Banner>You need a network to make an account.</Banner> : null}
      {error ? <Banner tone="crimson">{error}</Banner> : null}
      {mismatch ? <Banner tone="crimson">The two passwords are not the same.</Banner> : null}
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Field label="Type the password again" value={confirm} onChangeText={setConfirm} secureTextEntry />
      <Button
        label="Create account"
        disabled={busy || !ready}
        onPress={() => {
          setBusy(true);
          setError(null);
          void game.signUp(email, password).then((result) => {
            setBusy(false);
            if (result.confirmEmail) {
              setError('Look in your email, then sign in.');
              return;
            }
            if (result.error) setError(result.error);
            else if (result.destination) router.replace(result.destination);
          });
        }}
      />
      <Link href="/sign-in" style={styles.link}>
        <Text style={styles.linkText}>Already have an account</Text>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  link: { alignSelf: 'center' },
  linkText: { color: palette.leaf, fontWeight: '700' },
});
