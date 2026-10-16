import { expect, test } from 'vitest';
import { dealCards, evaluateAction, generateScenario } from './engine.js';
import { hands, handFromKey, handKey } from './hands.js';
import { defaultRanges, parseRange } from './ranges.js';

test('every chart hand retains its notation and signed storage key', () => {
  expect(hands.map(hand => handFromKey(handKey(hand)))).toEqual(hands);
  expect(handFromKey(167)).toBe('AKs');
  expect(handKey('AKo')).toBe(-167);
  expect(handKey('22')).toBe(0);
});

test('integer RNG intervals have exact fold/call/raise frequencies in either direction', () => {
  for (const inverted of [false, true]) {
    const counts = { fold: 0, call: 0, raise: 0 };
    for (let rng = 0; rng < 100; rng++) {
      counts[evaluateAction({ callPercent: 25, raisePercent: 35 }, rng, inverted)]++;
    }
    expect(counts).toEqual({ fold: 40, call: 25, raise: 35 });
    expect(evaluateAction({ callPercent: 0, raisePercent: 100 }, 0, inverted)).toBe('raise');
    expect(evaluateAction({ callPercent: 0, raisePercent: 0 }, 0, inverted)).toBe('fold');
  }
});

test('the first actual opening raise determines the facing-open range', () => {
  const ranges = {
    ...defaultRanges,
    utg: parseRange({ 168: [0, 100] }, 'utg'),
    utg1: parseRange({ 168: [0, 100] }, 'utg1'),
  };
  const draws = [2 / 9 + 0.001, 0, 0, 0];
  expect(generateScenario(ranges, 'all', () => draws.shift())).toEqual({
    hand: 'AA', heroPosition: 'utg2', history: ['utg'],
    frequencies: { callPercent: 0, raisePercent: 100 },
  });
});

test('RFI keeps the existing big-blind convention and missing hands remain folds', () => {
  const draws = [0.99, 0.99];
  expect(generateScenario(defaultRanges, 'rfi', () => draws.shift())).toEqual({
    hand: '32o', heroPosition: 'sb', history: [],
    frequencies: { callPercent: 0, raisePercent: 0 },
  });
});

test('three-bet selection terminates with an explicit error when no opener can raise', () => {
  const ranges = Object.fromEntries(Object.keys(defaultRanges).map(key => [key, {}]));
  expect(() => generateScenario(ranges, 'three-bet', () => 0)).toThrow('No three-bet spot is possible');
  ranges.utg = parseRange({ 168: [0, 100] }, 'utg');
  expect(generateScenario(ranges, 'three-bet', () => 0)).toEqual({
    hand: 'AA', heroPosition: 'utg1', history: ['utg'],
    frequencies: { callPercent: 0, raisePercent: 0 },
  });
});

test('suited displays share a color while pairs and offsuit displays always differ', () => {
  expect(dealCards('AKs', () => 0)).toEqual(['black', 'black']);
  expect(dealCards('AKo', () => 0)).toEqual(['black', 'red']);
  expect(dealCards('AA', () => 0)).toEqual(['black', 'red']);
});
