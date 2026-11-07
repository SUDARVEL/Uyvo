import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { clockLabel, minuteChoices, toTime, type ReminderTime } from '@/domain/reminder-plan';
import { font, palette } from '@/theme';

const ROW = 48;
const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);

function Column({
  label,
  items,
  selected,
  format,
  onPick,
  name,
}: {
  label: string;
  items: number[];
  selected: number;
  format: (value: number) => string;
  onPick: (value: number) => void;
  name: string;
}) {
  const scroll = useRef<ScrollView>(null);
  const first = useRef(selected);

  useEffect(() => {
    const index = Math.max(0, items.indexOf(first.current));
    const id = setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, index * ROW - ROW * 1.5), animated: false }), 60);
    return () => clearTimeout(id);
  }, [items]);

  return (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{label}</Text>
      <View style={styles.well}>
        <ScrollView ref={scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.list} nestedScrollEnabled>
          {items.map((value) => {
            const on = value === selected;
            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={`${name} ${format(value)}`}
                accessibilityState={{ selected: on }}
                onPress={() => onPick(value)}
                style={[styles.item, on ? styles.itemOn : null]}>
                <Text style={[styles.itemText, on ? styles.itemTextOn : null]}>{format(value)}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

export function TimeSheet({
  title,
  time,
  normal,
  onSave,
  onCancel,
  onNormal,
  onPreview,
}: {
  title: string;
  time: ReminderTime;
  normal: ReminderTime;
  onSave: (time: ReminderTime) => void;
  onCancel: () => void;
  onNormal: () => void;
  onPreview: (time: ReminderTime) => void;
}) {
  const insets = useSafeAreaInsets();
  const [hour12, setHour12] = useState(time.hour % 12 || 12);
  const [minute, setMinute] = useState(time.minute);
  const [pm, setPm] = useState(time.hour >= 12);
  const start = useRef(time.minute);
  const minutes = useMemo(() => minuteChoices(start.current), []);
  const picked = toTime(hour12, minute, pm);

  return (
    <Modal visible transparent statusBarTranslucent animationType="slide" onRequestClose={onCancel}>
      <Pressable accessibilityLabel="Close" style={styles.backdrop} onPress={onCancel}>
        <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]} onPress={() => undefined}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>Pick the time for this reminder.</Text>
          <View style={styles.preview}>
            <Text accessibilityLiveRegion="polite" style={styles.previewText}>
              {clockLabel(picked)}
            </Text>
          </View>
          <View style={styles.columns}>
            <Column label="Hour" name="Hour" items={HOURS} selected={hour12} format={(value) => String(value)} onPick={setHour12} />
            <Column
              label="Minute"
              name="Minute"
              items={minutes}
              selected={minute}
              format={(value) => String(value).padStart(2, '0')}
              onPick={setMinute}
            />
            <View style={styles.column}>
              <Text style={styles.columnLabel}> </Text>
              <View style={styles.ampm}>
                {(['AM', 'PM'] as const).map((label) => {
                  const on = (label === 'PM') === pm;
                  return (
                    <Pressable
                      key={label}
                      accessibilityRole="button"
                      accessibilityLabel={label}
                      accessibilityState={{ selected: on }}
                      onPress={() => setPm(label === 'PM')}
                      style={[styles.ampmItem, on ? styles.itemOn : null]}>
                      <Text style={[styles.itemText, on ? styles.itemTextOn : null]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
          <View style={styles.buttons}>
            <View style={styles.grow}>
              <Button label="Cancel" tone="quiet" onPress={onCancel} />
            </View>
            <View style={styles.grow}>
              <Button label="Save" tone="crimson" onPress={() => onSave(picked)} />
            </View>
          </View>
          <View style={styles.links}>
            <Pressable accessibilityRole="link" onPress={() => onPreview(picked)} style={styles.link}>
              <Text style={styles.linkText}>See how it looks</Text>
            </Pressable>
            <Pressable accessibilityRole="link" onPress={onNormal} style={styles.link}>
              <Text style={styles.linkText}>{`Use the normal time (${clockLabel(normal)})`}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(42,26,23,0.5)', justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: palette.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
    borderTopWidth: 1,
    borderColor: palette.line,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: palette.line, marginBottom: 6 },
  title: { color: palette.ink, fontFamily: font.display, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  sub: { color: palette.muted, fontFamily: font.text, fontSize: 15, lineHeight: 22, marginTop: -8 },
  preview: { backgroundColor: palette.blush, borderRadius: 20, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  previewText: { color: palette.crimson, fontFamily: font.display, fontSize: 56, lineHeight: 66, letterSpacing: -1 },
  columns: { flexDirection: 'row', gap: 10 },
  column: { flex: 1, gap: 6 },
  columnLabel: { color: palette.tertiary, fontFamily: font.bold, fontSize: 12, letterSpacing: 1.2, textAlign: 'center' },
  well: { height: ROW * 4 + 8, backgroundColor: palette.raised, borderRadius: 20, borderWidth: 1, borderColor: palette.line },
  list: { padding: 4, gap: 0 },
  item: { height: ROW, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  itemOn: { backgroundColor: palette.crimson },
  itemText: { color: palette.ink, fontFamily: font.semibold, fontSize: 20 },
  itemTextOn: { color: '#FFFFFF', fontFamily: font.bold },
  ampm: {
    height: ROW * 4 + 8,
    gap: 4,
    backgroundColor: palette.raised,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 4,
  },
  ampmItem: { flex: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 4 },
  grow: { flex: 1 },
  links: { alignItems: 'center' },
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  linkText: { color: palette.crimson, fontFamily: font.semibold, fontSize: 15, textDecorationLine: 'underline' },
});
