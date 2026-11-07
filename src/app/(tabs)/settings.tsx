import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Platform, Pressable, StyleSheet, Text, TextInput, View, type ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';

import { foodArt, heroArt, openingArt } from '@/art';
import { PictureCard, Radio } from '@/components/picture-card';
import { Banner, Screen } from '@/components/ui';
import { Icon, Toggle } from '@/components/icons';
import { REMINDERS } from '@/domain/copy';
import { heroState, localDate, logsOn, vesselRatio, type AvatarId } from '@/domain/engine';
import { planStep, type FoodStepKey, type PlanKey } from '@/domain/plan';
import { appNow } from '@/lib/clock';
import { useGame } from '@/state/game';
import { font, palette } from '@/theme';

const FOOD_ART: Record<FoodStepKey, ImageSourcePropType> = {
  morning_shot: foodArt.morning_shot,
  midmorning_juice: foodArt.midmorning_juice,
  lunch_greens: foodArt.lunch_greens,
};

type FoodState = 'next' | 'later' | 'done' | 'other';

function FoodRow({
  index,
  art,
  placeholder,
  initial,
  state,
  move,
  onSave,
}: {
  index?: number;
  art: ImageSourcePropType;
  placeholder: string;
  initial: string;
  state: FoodState;
  move?: { onUp?: () => void; onDown?: () => void };
  onSave: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const first = useRef(true);
  const latest = useRef(onSave);
  latest.current = onSave;

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const id = setTimeout(() => latest.current(value), 600);
    return () => clearTimeout(id);
  }, [value]);

  const caption = state === 'done' ? 'Done today' : state === 'next' ? 'Next up' : state === 'later' ? 'Later' : 'Any time today';
  return (
    <View style={[styles.food, state === 'next' ? styles.foodOn : null]}>
      <View style={styles.thumb}>
        <Image source={art} resizeMode="contain" style={styles.thumbArt} />
      </View>
      <View style={styles.foodBody}>
        <View style={styles.captionRow}>
          <Radio on={state === 'next'} />
          <Text style={[styles.caption, state === 'next' ? styles.captionOn : null]}>
            {index ? `${index} · ` : ''}
            {caption}
          </Text>
        </View>
        <TextInput
          accessibilityLabel={`Name for ${placeholder}`}
          value={value}
          onChangeText={setValue}
          onBlur={() => onSave(value)}
          maxLength={40}
          placeholder={placeholder}
          placeholderTextColor={palette.tertiary}
          style={styles.nameBox}
        />
      </View>
      {move ? (
        <View style={styles.moveColumn}>
          <MoveButton direction="up" onPress={move.onUp} />
          <MoveButton direction="down" onPress={move.onDown} />
        </View>
      ) : null}
    </View>
  );
}

function MoveButton({ direction, onPress }: { direction: 'up' | 'down'; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={direction === 'up' ? 'Move earlier' : 'Move later'}
      disabled={!onPress}
      onPress={onPress}
      hitSlop={6}
      style={[styles.moveButton, !onPress ? styles.moveOff : null]}>
      <View style={{ transform: [{ rotate: direction === 'up' ? '-90deg' : '90deg' }] }}>
        <Icon name="chevron" size={18} />
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const game = useGame();
  const router = useRouter();
  const profile = game.snap.profile;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.displayName ?? '');
  const [error, setError] = useState<string | null>(null);
  const today = localDate(appNow());
  const done = new Set(logsOn(game.snap.logs, today).map((log) => log.questKey));
  const [saved, setSaved] = useState(false);
  const order = game.order;
  const firstOpen = order.find((key) => !done.has(key)) ?? null;
  const step = (key: PlanKey) => planStep(game.plan, key);

  const saveName = (key: PlanKey, value: string) => {
    if (value.trim() === (game.foods[key] ?? '')) return;
    void game.saveFood(key, value).then(() => setSaved(true));
  };

  const move = (index: number, to: number) => {
    const next = [...order];
    const [item] = next.splice(index, 1);
    next.splice(to, 0, item);
    void game.saveOrder(next).then(() => setSaved(true));
  };

  const moveFor = (index: number) => {
    const key = order[index];
    const before = order[index - 1];
    const after = order[index + 1];
    const free = !done.has(key);
    return {
      onUp: free && before && !done.has(before) ? () => move(index, index - 1) : undefined,
      onDown: free && after && !done.has(after) ? () => move(index, index + 1) : undefined,
    };
  };
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
      </View>

      <Text style={styles.group}>YOUR PICTURE</Text>
      <View style={styles.pictures}>
        <PictureCard
          compact
          label="Woman"
          sub="Starts at Low"
          art={openingArt.womanLow}
          selected={avatar === 'woman'}
          onPress={() => {
            void game.saveAvatar('woman' as AvatarId).then(setError);
          }}
        />
        <PictureCard
          compact
          label="Man"
          sub="Starts at Low"
          art={openingArt.manLow}
          selected={avatar === 'man'}
          onPress={() => {
            void game.saveAvatar('man' as AvatarId).then(setError);
          }}
        />
      </View>

      <Text style={styles.group}>FOODS AND ORDER</Text>
      <Text style={styles.help}>
        Type your own name for a food. Clear the box to get the normal name back. Use the arrows to change the order.
        The picture stays the same.
      </Text>
      {order.map((key, index) => (
        <FoodRow
          key={key}
          index={index + 1}
          art={FOOD_ART[key]}
          placeholder={step(key).title}
          initial={game.foods[key] ?? ''}
          state={done.has(key) ? 'done' : key === firstOpen ? 'next' : 'later'}
          move={moveFor(index)}
          onSave={(value) => saveName(key, value)}
        />
      ))}
      <FoodRow
        art={foodArt.banana}
        placeholder={step('banana').title}
        initial={game.foods.banana ?? ''}
        state="other"
        onSave={(value) => saveName('banana', value)}
      />
      {saved ? <Text style={styles.saved}>Saved on this phone.</Text> : null}

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
                router.push(`/reminder?id=${reminder.id}`);
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

      <Text style={styles.group}>ADMIN</Text>
      <View style={styles.card}>
        <Pressable accessibilityRole="button" onPress={() => router.push('/admin')} style={styles.row}>
          <Text style={styles.rowLabel}>Edit the day</Text>
          <Icon name="chevron" size={18} />
        </Pressable>
      </View>

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
  pictures: { flexDirection: 'row', gap: 16 },
  help: { color: palette.muted, fontFamily: font.text, fontSize: 13, lineHeight: 18 },
  saved: { color: palette.leaf, fontFamily: font.semibold, fontSize: 14 },
  food: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.raised,
    borderRadius: 22,
    padding: 12,
    borderWidth: 1.5,
    borderColor: palette.line,
  },
  foodOn: {
    borderWidth: 2.5,
    borderColor: palette.crimson,
    backgroundColor: '#FFF2ED',
    shadowColor: '#B2243D',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  thumb: { width: 56, height: 56, borderRadius: 16, overflow: 'hidden', backgroundColor: palette.bg },
  thumbArt: { width: '100%', height: '100%' },
  foodBody: { flex: 1, gap: 6 },
  captionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  caption: { color: palette.tertiary, fontFamily: font.semibold, fontSize: 12 },
  captionOn: { color: palette.crimson },
  nameBox: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.line,
    backgroundColor: palette.bg,
    paddingHorizontal: 12,
    color: palette.ink,
    fontFamily: font.semibold,
    fontSize: 15,
  },
  moveColumn: { gap: 6 },
  moveButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.sunken, alignItems: 'center', justifyContent: 'center' },
  moveOff: { opacity: 0.35 },
  hint: { color: palette.tertiary, fontFamily: font.text, fontSize: 13, paddingBottom: 12 },
  signOut: { color: palette.crimson, fontFamily: font.semibold, fontSize: 16 },
  footer: { color: palette.muted, fontFamily: font.italic, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 8 },
});
