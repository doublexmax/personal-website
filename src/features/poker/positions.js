export const positions = ['utg', 'utg1', 'utg2', 'lj', 'hj', 'co', 'button', 'sb', 'bb'];

export function rangeKey(position, opener) {
  return opener ? `${position}_vs_${opener}` : position;
}
