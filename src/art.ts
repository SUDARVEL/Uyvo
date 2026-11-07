import type { ImageSourcePropType } from 'react-native';

import type { AvatarId, HeroState } from '@/domain/engine';

const woman: Record<HeroState, ImageSourcePropType> = {
  pale: require('../assets/figma/woman-low.jpg'),
  tired: require('../assets/figma/woman-tired.jpg'),
  armored: require('../assets/figma/woman-strong.jpg'),
  glowing: require('../assets/figma/woman-full.jpg'),
};

const man: Record<HeroState, ImageSourcePropType> = {
  pale: require('../assets/figma/man-low.jpg'),
  tired: require('../assets/art/plate-man-tired.jpg'),
  armored: require('../assets/art/plate-man-strong.jpg'),
  glowing: require('../assets/art/plate-man-full.jpg'),
};

export const heroArt: Record<AvatarId, Record<HeroState, ImageSourcePropType>> = { woman, man };

export const foodArt = {
  morning_shot: require('../assets/figma/soaked-fruit.jpg'),
  midmorning_juice: require('../assets/figma/red-juice.jpg'),
  lunch_greens: require('../assets/figma/greens.jpg'),
  water: require('../assets/figma/water.jpg'),
  banana: require('../assets/figma/banana.jpg'),
  walk: require('../assets/figma/walk.jpg'),
  tea: require('../assets/figma/tea.jpg'),
} as const;

export const treeArt = {
  sapling: require('../assets/figma/small-plant.jpg'),
  fruit: require('../assets/figma/red-fruit.jpg'),
} as const;

export const markArt = require('../assets/figma/logo.png') as ImageSourcePropType;
