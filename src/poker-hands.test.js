import { expect, test } from 'vitest';
import { cards_to_num, num_to_cards } from './info';
import { getPokerHand } from './utils';

test.each([
  [0, 0, 'AA'],
  [0, 1, 'AKs'],
  [1, 0, 'AKo'],
  [12, 12, '22'],
])('chart cell %i, %i displays %s', (row, column, hand) => {
  expect(getPokerHand(row, column)).toBe(hand);
});

test.each([
  ['AA', 168],
  ['AKs', 167],
  ['AKo', -167],
  ['22', 0],
])('%s maps to the existing signed chart key %i', (hand, key) => {
  expect(cards_to_num(hand)).toBe(key);
});

test.each([
  [168, 'AA'],
  [-167, 'AKo'],
  [0, '22'],
])('chart key %i retains its pair or offsuit notation %s', (key, hand) => {
  expect(num_to_cards(key)).toBe(hand);
});
