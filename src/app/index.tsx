import { Redirect } from 'expo-router';

import { Boot } from '@/components/ui';
import { useGame } from '@/state/game';

export default function Index() {
  const game = useGame();
  if (!game.ready) return <Boot />;
  if (game.snap.mode === 'signed_out') return <Redirect href="/sign-in" />;
  if (!game.snap.profile?.onboardedAt) return <Redirect href="/onboarding/name" />;
  return <Redirect href="/forge" />;
}
