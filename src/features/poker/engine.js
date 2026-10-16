import { hands } from './hands.js';
import { positions, rangeKey } from './positions.js';
import { frequenciesFor } from './ranges.js';

export function evaluateAction({ callPercent, raisePercent }, rng, inverted = false) {
  if (inverted) {
    if (rng < raisePercent) return 'raise';
    if (rng < raisePercent + callPercent) return 'call';
    return 'fold';
  }
  if (rng < 100 - callPercent - raisePercent) return 'fold';
  if (rng < 100 - raisePercent) return 'call';
  return 'raise';
}

function firstOpenCandidates(ranges) {
  // Condition the existing uniform-seat draw on a first open, without rejection sampling.
  const openRates = positions.map(position => hands.reduce((sum, hand) =>
    sum + Math.floor(frequenciesFor(ranges[position], hand).raisePercent), 0) / (hands.length * 100));
  const candidates = [];
  for (let hero = 1; hero < positions.length; hero++) {
    let unopened = 1;
    for (let opener = 0; opener < hero; opener++) {
      const weight = unopened * openRates[opener];
      if (weight > 0) candidates.push({ hero, opener, weight });
      unopened *= 1 - openRates[opener];
    }
  }
  return candidates;
}

function threeBetSpot(ranges, random) {
  const candidates = firstOpenCandidates(ranges);
  const total = candidates.reduce((sum, spot) => sum + spot.weight, 0);
  if (total === 0) {
    throw new Error('No three-bet spot is possible with the current opening ranges.');
  }
  let target = random() * total;
  for (const candidate of candidates) {
    if (target < candidate.weight) return candidate;
    target -= candidate.weight;
  }
  return candidates[candidates.length - 1];
}

export function generateScenario(ranges, mode = 'all', random = Math.random) {
  let hero;
  let opener;
  if (mode === 'three-bet') {
    ({ hero, opener } = threeBetSpot(ranges, random));
  } else {
    hero = Math.floor(random() * positions.length);
    if (mode === 'all') {
      for (let index = 0; index < hero; index++) {
        const hand = hands[Math.floor(random() * hands.length)];
        const frequencies = frequenciesFor(ranges[positions[index]], hand);
        if (evaluateAction(frequencies, Math.floor(random() * 100)) === 'raise') {
          opener = index;
          break;
        }
      }
    }
    if (opener === undefined && hero === positions.length - 1) hero--;
  }
  const heroPosition = positions[hero];
  const history = opener === undefined ? [] : [positions[opener]];
  const hand = hands[Math.floor(random() * hands.length)];
  return {
    hand,
    heroPosition,
    history,
    frequencies: frequenciesFor(ranges[rangeKey(heroPosition, history[0])], hand),
  };
}

export function dealCards(hand, random = Math.random) {
  const colors = ['black', 'red', 'blue', 'green'];
  const first = Math.floor(random() * colors.length);
  const second = hand[2] === 's' ? first : (first + 1 + Math.floor(random() * 3)) % colors.length;
  return [colors[first], colors[second]];
}
