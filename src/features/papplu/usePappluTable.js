import { useEffect, useState, useSyncExternalStore } from 'react';
import { createEngine } from './engine/engine.mjs';
import { createTable } from './engine/table.mjs';
import modelUrl from './engine/papplu-model.json?url';

function requireWorker() {
  if (typeof Worker === 'undefined') {
    throw new Error('This browser does not support module Workers. Use a current browser to play Papplu. No game is running on the main thread.');
  }
}

export function createTableEngine() {
  requireWorker();
  return createEngine({ modelUrl });
}

export function createBuilderEngine() {
  requireWorker();
  return createEngine();
}

function settingsStorage(providedStorage) {
  let problem = null;
  const listeners = new Set();
  const report = (message) => {
    problem = message;
    listeners.forEach(listener => listener());
  };
  const storage = () => providedStorage === undefined ? window.localStorage : providedStorage;
  return {
    getSnapshot: () => problem,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    adapter: {
      getItem(key) {
        try {
          const value = storage()?.getItem(key) ?? null;
          if (value !== null) {
            try { JSON.parse(value); } catch {
              report('The saved setup could not be parsed. Defaults are in use. The saved value has not been changed.');
            }
          }
          return value;
        } catch (error) {
          report(`The saved setup could not be read. Defaults are in use. The saved value has not been changed. ${error.message}`);
          return null;
        }
      },
      setItem(key, value) {
        try {
          storage()?.setItem(key, value);
          if (problem) report(null);
        } catch (error) {
          report(`The setup could not be saved. Changes still work for this visit. The previous saved value has not been removed. ${error.message}`);
        }
      },
    },
  };
}

export function usePappluTable({ engineFactory = createTableEngine, storage, random = Math.random } = {}) {
  const [session] = useState(() => {
    const persistence = settingsStorage(storage);
    return {
      persistence,
      table: createTable({ engineFactory, storage: persistence.adapter, random }),
    };
  });
  const { table, persistence } = session;
  const snapshot = useSyncExternalStore(table.subscribe, table.getSnapshot);
  const storageError = useSyncExternalStore(persistence.subscribe, persistence.getSnapshot);
  const [startup, setStartup] = useState({ status: 'starting' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    try {
      table.start();
      setStartup({ status: 'ready' });
    } catch (error) {
      setStartup({ status: 'error', message: error.message });
    }
    return () => table.stop();
  }, [table, attempt]);

  return {
    snapshot, startup, storageError, dispatch: table.dispatch,
    retry: () => setAttempt(value => value + 1),
  };
}
