import { expect, test } from 'vitest';
import { loadRanges, saveRange } from './range-storage.js';

test('a saved sparse range replaces the whole default and retains the existing wire format', () => {
  const saved = new Map([['utg', '{"168":[25,75]}'], ['unrelated', 'keep me']]);
  const storage = { getItem: name => saved.get(name) ?? null, setItem: (name, value) => saved.set(name, value) };
  const ranges = loadRanges(storage);
  expect(ranges.utg).toEqual({ 168: { callPercent: 25, raisePercent: 75 } });
  expect(ranges.utg1[168]).toEqual({ callPercent: 0, raisePercent: 100 });
  saveRange(storage, 'utg', { 168: { callPercent: 50, raisePercent: 25 } });
  expect(saved.get('utg')).toBe('{"168":[50,25]}');
  expect(saved.get('unrelated')).toBe('keep me');
});

test('malformed stored ranges and failed reads/writes propagate explicit errors', () => {
  const storage = { getItem: name => name === 'utg' ? '{"168":[80,80]}' : null };
  expect(() => loadRanges(storage)).toThrow('Cannot load saved range "utg"');
  expect(storage.getItem('utg')).toBe('{"168":[80,80]}');
  expect(() => loadRanges({ getItem: () => { throw new Error('Access denied'); } })).toThrow('Cannot read saved range');
  expect(() => saveRange({ setItem: () => { throw new Error('Quota exceeded'); } }, 'utg', {}))
    .toThrow('Range "utg" was not saved. Quota exceeded');
});
