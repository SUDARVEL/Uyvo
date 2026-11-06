import type { ImageSourcePropType } from 'react-native';

import type { HeroState } from '@/domain/engine';

export const heroArt: Record<HeroState, ImageSourcePropType> = {
  pale: require('../assets/art/uyvo-hero-pale.jpg'),
  tired: require('../assets/art/uyvo-hero-tired.jpg'),
  armored: require('../assets/art/uyvo-hero-strong.jpg'),
  glowing: require('../assets/art/uyvo-hero-glowing.jpg'),
};

export const foodArt = {
  morning_shot: require('../assets/art/uyvo-icon-morning.jpg'),
  midmorning_juice: require('../assets/art/uyvo-icon-juice.jpg'),
  lunch_greens: require('../assets/art/uyvo-icon-greens.jpg'),
  water: require('../assets/art/uyvo-icon-water.jpg'),
  banana: require('../assets/art/uyvo-icon-banana.jpg'),
  walk: require('../assets/art/uyvo-icon-walk.jpg'),
  tea: require('../assets/art/uyvo-icon-tea.jpg'),
} as const;

export const treeArt = {
  sapling: require('../assets/art/uyvo-tree-sapling.jpg'),
  fruit: require('../assets/art/uyvo-tree-fruit.jpg'),
} as const;
