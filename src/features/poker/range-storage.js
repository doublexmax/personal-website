import { defaultRanges, parseRange, serializeRange } from './ranges.js';

export function loadRanges(storage) {
  const ranges = { ...defaultRanges };
  for (const name of Object.keys(defaultRanges)) {
    let serialized;
    try {
      serialized = storage.getItem(name);
    } catch (error) {
      throw new Error(`Cannot read saved range "${name}". ${error.message}`, { cause: error });
    }
    if (serialized !== null) {
      try {
        ranges[name] = parseRange(JSON.parse(serialized), name);
      } catch (error) {
        throw new Error(`Cannot load saved range "${name}". ${error.message} Original data was kept.`, { cause: error });
      }
    }
  }
  return ranges;
}

export function saveRange(storage, name, range) {
  try {
    storage.setItem(name, serializeRange(range));
  } catch (error) {
    throw new Error(`Range "${name}" was not saved. ${error.message}`, { cause: error });
  }
}
