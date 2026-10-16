import source from './default-ranges.json';
import { hands, handKey } from './hands.js';

const validKeys = new Set(hands.map(hand => String(handKey(hand))));
const fold = Object.freeze({ callPercent: 0, raisePercent: 0 });

export function parseRange(value, name) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Range "${name}" must be an object.`);
  }
  return Object.fromEntries(Object.entries(value).map(([key, frequencies]) => {
    if (!validKeys.has(key) || !Array.isArray(frequencies) || frequencies.length !== 2 ||
        frequencies.some(percent => !Number.isFinite(percent) || percent < 0 || percent > 100) ||
        frequencies[0] + frequencies[1] > 100) {
      throw new Error(`Range "${name}" has invalid frequencies for hand "${key}".`);
    }
    return [key, { callPercent: frequencies[0], raisePercent: frequencies[1] }];
  }));
}

export const defaultRanges = Object.fromEntries(Object.entries(source)
  .map(([name, value]) => [name, parseRange(value, name)]));

export function frequenciesFor(range, hand) {
  return range[handKey(hand)] ?? fold;
}

export function serializeRange(range) {
  return JSON.stringify(Object.fromEntries(Object.entries(range)
    .map(([key, { callPercent, raisePercent }]) => [key, [callPercent, raisePercent]])));
}
