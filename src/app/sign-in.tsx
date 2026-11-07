import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Link, Redirect, useRouter } from 'expo-router';

import { heroArt, markArt } from '@/art';
import { Banner, Body, Button, Field, Screen, Title } from '@/components/ui';
import { useGame } from '@/state/game';
import { font, palette } from '@/theme';

let splashPlayed = false;

const portraits = [
  heroArt.woman.pale,
  heroArt.woman.tired,
  heroArt.woman.armored,
  heroArt.woman.glowing,
];

export default function SignIn() {
  const game = useGame();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [splash, setSplash] = useState(!splashPlayed);

  useEffect(() => {
    if (!splash) return;
    const id = setTimeout(() => {
      splashPlayed = true;
      setSplash(false);
    }, 1400);
    return () => clearTimeout(id);
  }, [splash]);

  if (!game.ready) return null;
  if (game.snap.mode !== 'signed_out') {
    return <Redirect href={game.snap.profile?.onboardedAt ? '/forge' : '/onboarding/name'} />;
  }

  if (!game.configured && splash) {
    return (
      <View style={styles.splash}>
        <Image source={markArt} style={styles.splashMark} accessibilityLabel="Uyvo" />
        <Text style={styles.splashLine}>Eat. Drink. Wait.</Text>
        <Text style={styles.splashSub}>Iron, one day at a time</Text>
      </View>
    );
  }

  if (!game.configured) {
    return (
      <Screen>
        <View style={styles.welcome}>
          <View style={styles.halo}>
            <Image source={markArt} style={styles.mark} accessibilityLabel="Uyvo" />
          </View>
          <View style={styles.faces}>
            {portraits.map((source, index) => (
              <Image key={index} source={source} style={[styles.face, index > 0 ? styles.faceOverlap : null]} />
            ))}
          </View>
          <Text style={styles.headline}>Eat, drink,{'\n'}and wait.</Text>
          <Text style={styles.italic}>Your picture gets stronger.</Text>
        </View>
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
      <Title>Uyvo</Title>
      <Body>Sign in to the same days on another phone.</Body>
      {offline ? <Banner>No network.</Banner> : null}
      {error ? <Banner tone="crimson">{error}</Banner> : null}
      <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <Button
        label="Sign in"
        disabled={busy || offline}
        onPress={() => {
          setBusy(true);
          void game.signIn(email, password).then((result) => {
            setBusy(false);
            if (result.error) setError(result.error);
            else if (result.destination) router.replace(result.destination);
          });
        }}
      />
      <Link href="/sign-up" style={styles.link}>
        Make an account
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', gap: 12 },
  splashMark: { width: 200, height: 200 },
  splashLine: { color: palette.crimson, fontFamily: font.displayItalic, fontSize: 28 },
  splashSub: { color: palette.muted, fontFamily: font.text, fontSize: 15 },
  welcome: { alignItems: 'center', gap: 18, paddingTop: 12 },
  halo: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: palette.blush,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: { width: 200, height: 200 },
  faces: { flexDirection: 'row', alignItems: 'center' },
  face: { width: 68, height: 68, borderRadius: 34, borderWidth: 3, borderColor: palette.bg },
  faceOverlap: { marginLeft: -14 },
  headline: { color: palette.ink, fontFamily: font.display, fontSize: 40, lineHeight: 46, textAlign: 'center' },
  italic: { color: palette.crimson, fontFamily: font.displayItalic, fontSize: 22, textAlign: 'center' },
  link: { color: palette.crimson, fontFamily: font.semibold, textAlign: 'center' },
});
