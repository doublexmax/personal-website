const ranks = 'AKQJT98765432';

export function handAt(row, column) {
  if (row === column) return ranks[row] + ranks[column];
  return row < column
    ? ranks[row] + ranks[column] + 's'
    : ranks[column] + ranks[row] + 'o';
}

export const handGrid = Array.from({ length: 13 }, (_, row) =>
  Array.from({ length: 13 }, (_, column) => handAt(row, column)));

export const hands = handGrid.flat();

export function handKey(hand) {
  const key = 13 * (12 - ranks.indexOf(hand[0])) + 12 - ranks.indexOf(hand[1]);
  return hand[2] === 'o' ? -key : key;
}

export function handFromKey(key) {
  const value = Math.abs(key);
  const first = ranks[12 - Math.floor(value / 13)];
  const second = ranks[12 - value % 13];
  return first + second + (first === second ? '' : key < 0 ? 'o' : 's');
}
