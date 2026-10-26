export const TIER_NAMES = {
  neural: 'Neural + Search',
  tactical: 'Tactical',
  casual: 'Casual',
};

export const PRESET_NAMES = {
  'vs-ai': 'vs AI',
  solo: 'Solo Practice',
  'pass-and-play': 'Pass & Play',
  'ai-watch': 'AI Watch',
};

export function readRules(draft) {
  const rules = {};
  for (const [key, label, min, max] of [
    ['decks', 'Decks', 1, 6],
    ['cardsInHand', 'Cards per hand', 3, 30],
    ['requiredSequences', 'Required pure sequences', 0, 10],
  ]) {
    const value = Number(draft[key]);
    if (String(draft[key]).trim() === '' || !Number.isInteger(value) || value < min || value > max) {
      throw new Error(`${label} must be an integer from ${min} to ${max}.`);
    }
    rules[key] = value;
  }
  return rules;
}

export function readTableSetup(draft) {
  const rules = readRules(draft);
  const seats = draft.seats.map((seat, index) => {
    const name = seat.name.trim();
    if (!name || name.length > 24) {
      throw new Error(`Seat ${index + 1} needs a name of 1 to 24 characters.`);
    }
    return { name, kind: seat.kind, ...(seat.kind === 'ai' ? { tier: seat.tier } : {}) };
  });
  const needed = seats.length * rules.cardsInHand + 2;
  const available = rules.decks * 52;
  if (needed > available) {
    throw new Error(`This setup needs ${needed} cards, but ${rules.decks} deck${rules.decks === 1 ? '' : 's'} supplies ${available}. Add decks or reduce the seats or hand size.`);
  }
  return {
    ...rules, seats, recycleDiscard: draft.recycleDiscard, aiSpeed: draft.aiSpeed,
  };
}
