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
  morning_shot: require('../assets/figma/cards/soaked-fruit.png'),
  midmorning_juice: require('../assets/figma/cards/red-juice.png'),
  lunch_greens: require('../assets/figma/cards/green-leaves.png'),
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
export const noticeMark = require('../assets/figma/notice-mark.png') as ImageSourcePropType;

export const openingArt = {
  icon: require('../assets/figma/onboarding/app-icon.png'),
  arils: require('../assets/figma/onboarding/arils.svg'),
  glow: require('../assets/figma/onboarding/glow.svg'),
  ring: require('../assets/figma/onboarding/ring.svg'),
  ringOuter: require('../assets/figma/onboarding/ring-outer.svg'),
  loader: require('../assets/figma/onboarding/loader.svg'),
  halo: require('../assets/figma/onboarding/halo.svg'),
  greens: require('../assets/figma/onboarding/greens.png'),
  juice: require('../assets/figma/onboarding/red-juice.png'),
  soaked: require('../assets/figma/onboarding/soaked.png'),
  water: require('../assets/figma/onboarding/water.png'),
  womanFull: require('../assets/figma/onboarding/woman-full.png'),
  womanLow: require('../assets/figma/onboarding/woman-low.png'),
  womanTired: require('../assets/figma/onboarding/woman-tired.png'),
  womanStrong: require('../assets/figma/onboarding/woman-strong.png'),
  manLow: require('../assets/figma/onboarding/man-low.png'),
  chevron: require('../assets/figma/onboarding/chevron.svg'),
  back: require('../assets/figma/onboarding/back.svg'),
  check: require('../assets/figma/onboarding/check.svg'),
  checkWhite: require('../assets/figma/onboarding/check-white.svg'),
} as const;
