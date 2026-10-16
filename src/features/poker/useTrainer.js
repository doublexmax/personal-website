import { useEffect, useReducer, useState } from 'react';
import { dealCards, evaluateAction, generateScenario } from './engine.js';
import { handKey } from './hands.js';
import { positions } from './positions.js';
import { loadRanges, saveRange } from './range-storage.js';

function transition(state, event) {
  switch (event.type) {
    case 'start':
      if (state.phase === 'dealing' || state.phase === 'awaiting-answer') return state;
      return { ...state, phase: 'dealing', round: event.round, step: -1, result: null };
    case 'advance': {
      if (state.phase !== 'dealing' || state.round !== event.round) return state;
      const step = state.step + 1;
      return {
        ...state, step,
        phase: step >= positions.indexOf(state.round.heroPosition) ? 'awaiting-answer' : 'dealing',
      };
    }
    case 'answer': {
      if (state.phase !== 'awaiting-answer') return state;
      const answer = evaluateAction(state.round.frequencies, state.round.rng, state.round.inverted);
      const correct = answer === event.action;
      return {
        ...state, phase: 'answered', result: { answer, correct },
        total: state.total + 1, correct: state.correct + Number(correct),
      };
    }
    default:
      throw new Error(`Unknown trainer event "${event.type}".`);
  }
}

function readSavedRanges() {
  try {
    return { ranges: loadRanges(window.localStorage), error: null };
  } catch (error) {
    return { ranges: null, error: `Training unavailable. ${error.message}` };
  }
}

export function useTrainer() {
  const [data, setData] = useState(readSavedRanges);
  const [options, setOptions] = useState({ slow: true, inverted: false, mode: 'all' });
  const [session, dispatch] = useReducer(transition, {
    phase: 'idle', round: null, step: -1, correct: 0, total: 0, result: null,
  });
  const { phase, round, step } = session;

  useEffect(() => {
    if (phase !== 'dealing') return;
    const timer = setTimeout(() => dispatch({ type: 'advance', round }), step < 0 ? 250 : round.slow ? 800 : 0);
    return () => clearTimeout(timer);
  }, [phase, round, step]);

  function start() {
    if (!data.ranges || phase === 'dealing' || phase === 'awaiting-answer') return;
    try {
      const scenario = generateScenario(data.ranges, options.mode);
      const nextRound = {
        ...scenario,
        rng: Math.floor(Math.random() * 100),
        colors: dealCards(scenario.hand),
        slow: options.slow,
        inverted: options.inverted,
      };
      setData(current => ({ ...current, error: null }));
      dispatch({ type: 'start', round: nextRound });
    } catch (error) {
      setData(current => ({ ...current, error: error.message }));
    }
  }

  function editRange(name, hand, frequencies) {
    const updated = { ...data.ranges[name], [handKey(hand)]: frequencies };
    try {
      saveRange(window.localStorage, name, updated);
      setData(current => ({
        ranges: { ...current.ranges, [name]: updated }, error: null,
      }));
    } catch (error) {
      setData(current => ({ ...current, error: `Edit not applied. ${error.message}` }));
    }
  }

  return {
    ...data, options, setOptions, session, start, editRange,
    busy: phase === 'dealing' || phase === 'awaiting-answer',
    answer: action => dispatch({ type: 'answer', action }),
  };
}
