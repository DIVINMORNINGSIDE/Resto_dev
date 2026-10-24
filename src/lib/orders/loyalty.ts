export type LoyaltyRules = {
  fcfaPerPoint: number;
  redeemPointsBlock: number;
  redeemValueFcfa: number;
};

export const DEFAULT_RULES: LoyaltyRules = { fcfaPerPoint: 1000, redeemPointsBlock: 15, redeemValueFcfa: 1000 };

// 1 point par tranche entière de fcfaPerPoint payée (après réduction).
export function pointsEarned(totalFcfa: number, rules: LoyaltyRules): number {
  return Math.max(0, Math.floor(totalFcfa / rules.fcfaPerPoint));
}

// Nombre maximal de tranches de points utilisables : limité par le solde et
// par le montant de la commande (la réduction ne dépasse jamais le sous-total).
export function maxRedeemBlocks(balance: number, subtotalFcfa: number, rules: LoyaltyRules): number {
  return Math.max(0, Math.min(Math.floor(balance / rules.redeemPointsBlock), Math.floor(subtotalFcfa / rules.redeemValueFcfa)));
}

export function orderTotals(subtotalFcfa: number, blocks: number, rules: LoyaltyRules) {
  const discount = blocks * rules.redeemValueFcfa;
  const total = subtotalFcfa - discount;
  return {
    discount,
    total,
    pointsUsed: blocks * rules.redeemPointsBlock,
    pointsEarned: pointsEarned(total, rules),
  };
}
