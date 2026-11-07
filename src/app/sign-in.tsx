import { useEffect, useState } from 'react';
import { Image as ExpoImage } from 'expo-image';
import { Link, Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { openingArt } from '@/art';
import { Banner, Body, Button, Field, Screen, Title } from '@/components/ui';
import { useGame } from '@/state/game';
import { font, palette } from '@/theme';

let splashPlayed = false;

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
    }, 1600);
    return () => clearTimeout(id);
  }, [splash]);

  if (!game.ready) return null;
  if (game.snap.mode !== 'signed_out') {
    return <Redirect href={game.snap.profile?.onboardedAt ? '/forge' : '/onboarding/name'} />;
  }

  if (!game.configured && splash) return <Splash />;

  if (!game.configured) {
    return (
      <Welcome
        busy={busy}
        onStart={() => {
          setBusy(true);
          void game.practice().then((destination) => router.replace(destination));
        }}
      />
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

function Splash() {
  const { width, height } = useWindowDimensions();
  const s = width / 390;
  return (
    <View style={styles.splash}>
      <StatusBar style="light" />
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="splash" cx="50%" cy="55%" r="78%">
            <Stop offset="0" stopColor="#BD2640" />
            <Stop offset="0.5" stopColor="#881A2E" />
            <Stop offset="1" stopColor="#540D1C" />
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#splash)" />
      </Svg>
      <ExpoImage source={openingArt.arils} style={StyleSheet.absoluteFill} contentFit="cover" />
      <ExpoImage source={openingArt.glow} style={{ position: 'absolute', left: (45 - 80) * s, top: (210 - 80) * s, width: 460 * s, height: 460 * s }} contentFit="fill" />
      <ExpoImage source={openingArt.ringOuter} style={{ position: 'absolute', left: 61 * s, top: 226 * s, width: 268 * s, height: 268 * s }} contentFit="fill" />
      <ExpoImage source={openingArt.ring} style={{ position: 'absolute', left: 89 * s, top: 254 * s, width: 212 * s, height: 212 * s }} contentFit="fill" />
      <View style={[styles.iconPlate, { left: 129 * s, top: 294 * s, width: 132 * s, height: 132 * s, borderRadius: 28 * s }]}>
        <ExpoImage source={openingArt.icon} style={{ width: '98%', height: '104%', marginTop: '2%' }} contentFit="contain" />
      </View>
      <Text style={[styles.word, { left: 0, right: 0, top: 456 * s, fontSize: 52 * s, lineHeight: 56 * s }]}>uyvo</Text>
      <Text style={[styles.tagline, { left: 0, right: 0, top: 520 * s, fontSize: 18 * s, lineHeight: 26 * s }]}>Eat. Drink. Wait.</Text>
      <ExpoImage source={openingArt.loader} style={{ position: 'absolute', left: (width - 30 * s) / 2, top: 600 * s, width: 30 * s, height: 6 * s }} contentFit="fill" />
      <Text style={[styles.footer, { bottom: Math.max(36, height - 790 * s) }]}>IRON, ONE DAY AT A TIME</Text>
    </View>
  );
}

function Welcome({ busy, onStart }: { busy: boolean; onStart: () => void }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const s = width / 390;
  return (
    <SafeAreaView style={styles.welcome} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <View style={{ width, height: 452 * s }}>
        <View style={[styles.arch, { left: 64 * s, top: 14 * s, width: 262 * s, height: 392 * s, borderTopLeftRadius: 131 * s, borderTopRightRadius: 131 * s, borderBottomLeftRadius: 36 * s, borderBottomRightRadius: 36 * s }]}>
          <Svg style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="arch" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#FCEDD6" />
                <Stop offset="1" stopColor="#F2C7C4" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#arch)" />
          </Svg>
          <ExpoImage source={openingArt.halo} style={{ position: 'absolute', left: (21 - 30) * s, top: (40 - 30) * s, width: 280 * s, height: 280 * s }} contentFit="fill" />
          <ExpoImage source={openingArt.womanFull} style={{ position: 'absolute', left: -19 * s, top: 112 * s, width: 300 * s, height: 300 * s }} contentFit="contain" />
        </View>
        <Float left={-2 * s} top={70 * s} turn="7deg" art={openingArt.soaked} scale={s} />
        <Float left={304 * s} top={32 * s} turn="-6deg" art={openingArt.juice} scale={s} />
        <Float left={2 * s} top={261 * s} turn="-5deg" art={openingArt.greens} scale={s} />
        <Float left={303 * s} top={250 * s} turn="5deg" art={openingArt.water} scale={s} />
        <View style={[styles.pill, { left: 76 * s, top: 384 * s }]}>
          <View style={styles.pillFace}>
            <ExpoImage source={openingArt.womanLow} style={styles.pillArt} contentFit="contain" />
          </View>
          <Text style={styles.pillLow}>Low</Text>
          <ExpoImage source={openingArt.chevron} style={{ width: 14, height: 14 }} contentFit="contain" />
          <View style={[styles.pillFace, styles.pillFull]}>
            <ExpoImage source={openingArt.womanFull} style={styles.pillArt} contentFit="contain" />
          </View>
          <Text style={styles.pillEnergy}>Full of energy</Text>
        </View>
      </View>
      <View style={styles.copy}>
        <Text style={styles.kicker}>WELCOME TO UYVO</Text>
        <Text style={styles.headline}>
          Eat, drink,{'\n'}and <Text style={styles.wait}>wait.</Text>
        </Text>
        <Text style={styles.lead}>Your picture gets stronger with every iron-rich day.</Text>
      </View>
      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
        <Button label="Start" disabled={busy} onPress={onStart} />
        <Text style={styles.minute}>Takes under a minute · No sign-up</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/admin')}>
          <Text style={styles.link}>Admin</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Float({ left, top, turn, art, scale }: { left: number; top: number; turn: string; art: number; scale: number }) {
  return (
    <View style={[styles.float, { left, top, transform: [{ rotate: turn }] }]}>
      <ExpoImage source={art} style={{ width: 62 * scale, height: 62 * scale }} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: '#881A2E' },
  iconPlate: {
    position: 'absolute',
    backgroundColor: '#FCF5EB',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#33000D',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 24 },
    elevation: 16,
  },
  word: { position: 'absolute', textAlign: 'center', color: '#FCF2E5', fontFamily: font.display, letterSpacing: -1.5 },
  tagline: { position: 'absolute', textAlign: 'center', color: '#FCDBD6', fontFamily: font.italic },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#FFFFFF',
    opacity: 0.55,
    fontFamily: font.extra,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  welcome: { flex: 1, backgroundColor: palette.bg },
  arch: { position: 'absolute', overflow: 'hidden', backgroundColor: '#F2C7C4' },
  float: {
    position: 'absolute',
    width: 78,
    height: 78,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5C331F',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8,
  },
  pill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingLeft: 6,
    paddingRight: 14,
    paddingVertical: 6,
    shadowColor: '#5C331F',
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8,
  },
  pillFace: { width: 34, height: 34, borderRadius: 17, backgroundColor: palette.sunken, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' },
  pillFull: { backgroundColor: palette.amberSoft },
  pillArt: { width: 36, height: 36 },
  pillLow: { color: palette.tertiary, fontFamily: font.semibold, fontSize: 12 },
  pillEnergy: { color: palette.crimson, fontFamily: font.semibold, fontSize: 12 },
  copy: { flex: 1, paddingHorizontal: 28, paddingTop: 12, gap: 10 },
  kicker: { color: palette.crimson, fontFamily: font.extra, fontSize: 11, letterSpacing: 1.2 },
  headline: { color: palette.ink, fontFamily: font.display, fontSize: 40, lineHeight: 44, letterSpacing: -1 },
  wait: { fontFamily: font.displayItalic, color: palette.crimson },
  lead: { color: palette.muted, fontFamily: font.text, fontSize: 15, lineHeight: 22 },
  actions: { paddingHorizontal: 24, gap: 10, paddingBottom: 18 },
  minute: { color: palette.tertiary, fontFamily: font.text, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  link: { color: palette.crimson, fontFamily: font.semibold, textAlign: 'center' },
});
