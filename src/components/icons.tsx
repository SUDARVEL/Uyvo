import { Image, type ImageSource } from 'expo-image';
import { Pressable } from 'react-native';

const files = {
  back: require('../../assets/figma/icon-back.svg'),
  check: require('../../assets/figma/icon-check.svg'),
  chevron: require('../../assets/figma/icon-chevron.svg'),
  droplet: require('../../assets/figma/icon-droplet.svg'),
  heart: require('../../assets/figma/icon-heart.svg'),
  lock: require('../../assets/figma/icon-lock.svg'),
  minus: require('../../assets/figma/icon-minus.svg'),
  plus: require('../../assets/figma/icon-plus.svg'),
  radio: require('../../assets/figma/icon-radio.svg'),
  sliders: require('../../assets/figma/icon-sliders.svg'),
  slidersOn: require('../../assets/figma/icon-sliders-active.svg'),
  sprout: require('../../assets/figma/icon-sprout.svg'),
  sproutMuted: require('../../assets/figma/icon-sprout-muted.svg'),
  sun: require('../../assets/figma/icon-sun.svg'),
  sunOn: require('../../assets/figma/icon-sun-active.svg'),
  sunMuted: require('../../assets/figma/icon-sun-muted.svg'),
  toggleOff: require('../../assets/figma/icon-toggle-off.svg'),
  toggleOn: require('../../assets/figma/icon-toggle-on.svg'),
  zap: require('../../assets/figma/icon-zap.svg'),
} as const;

export type IconName = keyof typeof files;

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return <Image source={files[name] as ImageSource} style={{ width: size, height: size }} contentFit="contain" />;
}

export function Toggle({
  value,
  onValueChange,
  disabled,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}>
      <Image
        source={(value ? files.toggleOn : files.toggleOff) as ImageSource}
        style={{ width: 52, height: 32, opacity: disabled ? 0.45 : 1 }}
        contentFit="contain"
      />
    </Pressable>
  );
}
