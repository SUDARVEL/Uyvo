import Svg, { ClipPath, Defs, G, Rect } from 'react-native-svg';

import { palette } from '@/theme';

export function Vessel({ ratio }: { ratio: number }) {
  const fill = Math.max(0, Math.min(1, ratio));
  const height = 168 * fill;
  const y = 16 + 168 * (1 - fill);
  const rim = fill >= 0.85 ? palette.leaf : palette.crimson;
  return (
    <Svg width={76} height={200} viewBox="0 0 76 200" accessibilityLabel={`Blood vessel ${Math.round(fill * 100)} percent full`}>
      <Defs>
        <ClipPath id="uyvo-vessel">
          <Rect x="10" y="10" width="56" height="180" rx="28" />
        </ClipPath>
      </Defs>
      <Rect x="10" y="10" width="56" height="180" rx="28" fill="#F3E6E4" stroke={rim} strokeWidth="3" />
      <G clipPath="url(#uyvo-vessel)">
        <Rect x="10" y={y} width="56" height={height} fill={palette.crimson} />
      </G>
    </Svg>
  );
}
