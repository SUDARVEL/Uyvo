import type { ImageSourcePropType } from 'react-native';

import type { AvatarId, HeroState } from '@/domain/engine';

const woman: Record<HeroState, ImageSourcePropType> = {
  pale: require('../assets/art/plate-woman-low.jpg'),
  tired: require('../assets/art/plate-woman-tired.jpg'),
  armored: require('../assets/art/plate-woman-strong.jpg'),
  glowing: require('../assets/art/plate-woman-full.jpg'),
};

const man: Record<HeroState, ImageSourcePropType> = {
  pale: require('../assets/art/plate-man-low.jpg'),
  tired: require('../assets/art/plate-man-tired.jpg'),
  armored: require('../assets/art/plate-man-strong.jpg'),
  glowing: require('../assets/art/plate-man-full.jpg'),
};

export const heroArt: Record<AvatarId, Record<HeroState, ImageSourcePropType>> = { woman, man };

export const foodArt = {
  morning_shot: require('../assets/art/plate-morning.jpg'),
  midmorning_juice: require('../assets/art/plate-juice.jpg'),
  lunch_greens: require('../assets/art/plate-greens.jpg'),
  water: require('../assets/art/plate-water.jpg'),
  banana: require('../assets/art/plate-banana.jpg'),
  walk: require('../assets/art/plate-walk.jpg'),
  tea: require('../assets/art/plate-tea.jpg'),
} as const;

export const treeArt = {
  sapling: require('../assets/art/plate-sapling.jpg'),
  fruit: require('../assets/art/plate-fruit.jpg'),
} as const;
