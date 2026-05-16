export type RewardedPlacement = 'basic_hint' | 'reveal_hint' | 'continue_after_game_over';
export type IapPlacement = 'league_pass';
export type LifeLossSource = 'placement' | 'accusation';
export type HintBlockReason = 'no_clues' | 'no_target';

export interface GameMonetizationContext {
  caseId: string;
  isDailyRun: boolean;
  playMode: 'latin' | 'murdoku';
  elapsedSeconds: number;
  errors: number;
  cluesLeft: number;
  heartsLeft: number;
}

export const MONETIZATION_PLACEMENTS = {
  rewarded: {
    basicHint: {
      placement: 'basic_hint' as RewardedPlacement,
      adUnitKey: 'rewarded_hint_basic',
      enabled: false,
      rewardClues: 1,
    },
    revealHint: {
      placement: 'reveal_hint' as RewardedPlacement,
      adUnitKey: 'rewarded_hint_reveal',
      enabled: false,
      rewardClues: 1,
    },
    continueAfterGameOver: {
      placement: 'continue_after_game_over' as RewardedPlacement,
      adUnitKey: 'rewarded_continue_game_over',
      enabled: false,
      rewardHearts: 3,
    },
  },
  iap: {
    leaguePass: {
      placement: 'league_pass' as IapPlacement,
      productId: 'quackdoku.league_pass.weekly',
      enabled: false,
      grantsGameplayPower: false,
    },
  },
} as const;

export type MonetizationEvent =
  | {
      type: 'need_hint';
      placement: Extract<RewardedPlacement, 'basic_hint' | 'reveal_hint'>;
      reason: HintBlockReason;
      context: GameMonetizationContext;
    }
  | {
      type: 'hint_used';
      placement: Extract<RewardedPlacement, 'basic_hint' | 'reveal_hint'>;
      rewardSource: 'inventory' | 'rewarded_ad';
      cluesLeftAfter: number;
      context: GameMonetizationContext;
    }
  | {
      type: 'life_lost';
      source: LifeLossSource;
      attemptedDuckId?: string | null;
      row?: number | null;
      col?: number | null;
      context: GameMonetizationContext;
    }
  | {
      type: 'continue_offer_shown';
      coinCost: number;
      coinBalance: number;
      rewardedPlacement: Extract<RewardedPlacement, 'continue_after_game_over'>;
      context: GameMonetizationContext;
    }
  | {
      type: 'continue_paid_coins';
      coinCost: number;
      coinBalanceAfter: number;
      context: GameMonetizationContext;
    }
  | {
      type: 'continue_denied';
      reason: 'not_enough_coins' | 'ad_unavailable';
      coinCost: number;
      coinBalance: number;
      context: GameMonetizationContext;
    }
  | {
      type: 'level_complete';
      stars: number;
      earnedCoins: number;
      earnedXp: number;
      earnedClues: number;
      isPerfect: boolean;
      context: GameMonetizationContext;
    }
  | {
      type: 'league_pass_opportunity';
      placement: Extract<IapPlacement, 'league_pass'>;
      source: 'home_card' | 'league_screen';
      leagueId: string;
      rank: number;
      participants: number;
      ownsLeaguePass: boolean;
    };

type MonetizationListener = (event: MonetizationEvent) => void;

const listeners = new Set<MonetizationListener>();

export function subscribeMonetizationEvents(listener: MonetizationListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitMonetizationEvent(event: MonetizationEvent) {
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch (error) {
      console.warn('Monetization listener failed:', error);
    }
  });
}

export function isRewardedPlacementEnabled(placement: RewardedPlacement): boolean {
  return Object.values(MONETIZATION_PLACEMENTS.rewarded).some(
    (config) => config.placement === placement && config.enabled
  );
}

export function onNeedHint(
  placement: Extract<RewardedPlacement, 'basic_hint' | 'reveal_hint'>,
  reason: HintBlockReason,
  context: GameMonetizationContext
) {
  emitMonetizationEvent({ type: 'need_hint', placement, reason, context });
}

export function onHintUsed(
  placement: Extract<RewardedPlacement, 'basic_hint' | 'reveal_hint'>,
  rewardSource: 'inventory' | 'rewarded_ad',
  cluesLeftAfter: number,
  context: GameMonetizationContext
) {
  emitMonetizationEvent({ type: 'hint_used', placement, rewardSource, cluesLeftAfter, context });
}

export function onLifeLost(
  source: LifeLossSource,
  context: GameMonetizationContext,
  attemptedDuckId?: string | null,
  row?: number | null,
  col?: number | null
) {
  emitMonetizationEvent({
    type: 'life_lost',
    source,
    context,
    attemptedDuckId,
    row,
    col,
  });
}

export function onContinueOfferShown(
  coinCost: number,
  coinBalance: number,
  context: GameMonetizationContext
) {
  emitMonetizationEvent({
    type: 'continue_offer_shown',
    coinCost,
    coinBalance,
    rewardedPlacement: 'continue_after_game_over',
    context,
  });
}

export function onContinuePaidCoins(
  coinCost: number,
  coinBalanceAfter: number,
  context: GameMonetizationContext
) {
  emitMonetizationEvent({
    type: 'continue_paid_coins',
    coinCost,
    coinBalanceAfter,
    context,
  });
}

export function onContinueDenied(
  reason: 'not_enough_coins' | 'ad_unavailable',
  coinCost: number,
  coinBalance: number,
  context: GameMonetizationContext
) {
  emitMonetizationEvent({
    type: 'continue_denied',
    reason,
    coinCost,
    coinBalance,
    context,
  });
}

export function onLevelComplete(
  stars: number,
  earnedCoins: number,
  earnedXp: number,
  earnedClues: number,
  isPerfect: boolean,
  context: GameMonetizationContext
) {
  emitMonetizationEvent({
    type: 'level_complete',
    stars,
    earnedCoins,
    earnedXp,
    earnedClues,
    isPerfect,
    context,
  });
}

export function onLeaguePassOpportunity(
  source: 'home_card' | 'league_screen',
  leagueId: string,
  rank: number,
  participants: number,
  ownsLeaguePass: boolean
) {
  emitMonetizationEvent({
    type: 'league_pass_opportunity',
    placement: 'league_pass',
    source,
    leagueId,
    rank,
    participants,
    ownsLeaguePass,
  });
}
