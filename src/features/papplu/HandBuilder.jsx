import { useEffect, useReducer, useRef, useState } from 'react';
import { moveCard, sortCards, toCounts } from './engine/game.mjs';
import { CardArt, Evaluation, faceName, PenaltyResult, PlayingCard, RANKS, SUITS, SUIT_SYMBOLS } from './PappluCards.jsx';
import { readRules } from './settings.js';

const VALID_EXAMPLE = [0, 1, 2, 13, 14, 15, 26, 27, 28, 3, 4, 5, 19, 20, 21, 9, 22, 35, 11, 24, 37];
const EXAMPLES = {
  valid: VALID_EXAMPLE,
  invalid: VALID_EXAMPLE.map(face => face === 5 ? 51 : face),
};
const DEFAULT_CONFIG = { decks: '3', cardsInHand: '21', requiredSequences: '5', jokerSuit: '0', jokerRank: '7' };

function changed(state, patch) {
  return { ...state, ...patch, revision: state.revision + 1, evaluation: { status: 'idle' } };
}

function builderReducer(state, action) {
  switch (action.type) {
    case 'configure':
      return changed(state, { config: { ...state.config, ...action.patch } });
    case 'add':
      return changed(state, {
        cards: [...state.cards, { id: state.nextId, face: action.face }],
        selectedId: state.nextId, nextId: state.nextId + 1,
      });
    case 'remove':
      return changed(state, { cards: state.cards.filter(card => card.id !== state.selectedId), selectedId: null });
    case 'clear':
      return changed(state, { cards: [], selectedId: null });
    case 'sample': {
      const cards = EXAMPLES[action.name].map((face, index) => ({ face, id: state.nextId + index }));
      return changed(state, {
        cards: sortCards(cards), nextId: state.nextId + cards.length,
        selectedId: null, config: DEFAULT_CONFIG,
      });
    }
    case 'select':
      return { ...state, selectedId: state.selectedId === action.id ? null : action.id };
    case 'move':
      return { ...state, cards: moveCard(state.cards, state.selectedId, action.index) };
    case 'sort':
      return { ...state, cards: sortCards(state.cards) };
    case 'checking':
      return { ...state, evaluation: { status: 'checking' } };
    case 'cancel':
      return state.evaluation.status === 'checking'
        ? { ...state, evaluation: { status: 'idle' } }
        : state;
    case 'result':
      return action.revision === state.revision
        ? { ...state, evaluation: { status: 'ready', hand: action.hand, penalty: action.penalty } }
        : state;
    case 'error':
      return action.revision === state.revision
        ? { ...state, evaluation: { status: 'error', message: action.message } }
        : state;
    default:
      return state;
  }
}

function builderConfig(draft, cards) {
  const config = {
    ...readRules(draft),
    joker: Number(draft.jokerSuit) * 13 + Number(draft.jokerRank),
  };
  if (cards.length > config.cardsInHand) {
    throw new Error(`The hand has ${cards.length} cards. Remove cards to meet the ${config.cardsInHand}-card limit, or raise the hand size.`);
  }
  const overLimit = toCounts(cards).findIndex(copies => copies > config.decks);
  if (overLimit >= 0) {
    throw new Error(`There are more than ${config.decks} copies of ${faceName(overLimit)}. Remove a copy or add a deck.`);
  }
  return config;
}

export function HandBuilder({ engineFactory, active }) {
  const [state, dispatch] = useReducer(builderReducer, {
    cards: [], selectedId: null, nextId: 1, config: DEFAULT_CONFIG,
    revision: 0, evaluation: { status: 'idle' },
  });
  const [startup, setStartup] = useState({ status: 'starting' });
  const [attempt, setAttempt] = useState(0);
  const engineRef = useRef(null);
  const requestRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setStartup({ status: 'starting' });
      dispatch({ type: 'cancel' });
      return;
    }
    let engine;
    try {
      engine = engineFactory();
      engineRef.current = engine;
      setStartup({ status: 'ready' });
    } catch (error) {
      setStartup({ status: 'error', message: error.message });
    }
    return () => {
      requestRef.current += 1;
      engineRef.current = null;
      engine?.dispose();
    };
  }, [engineFactory, attempt, active]);

  let config = null;
  let validationError = null;
  try {
    config = builderConfig(state.config, state.cards);
  } catch (error) {
    validationError = error.message;
  }
  const joker = Number(state.config.jokerSuit) * 13 + Number(state.config.jokerRank);
  const counts = toCounts(state.cards);
  const selectedIndex = state.cards.findIndex(card => card.id === state.selectedId);
  const evaluation = state.evaluation;

  async function evaluate() {
    if (!config || !engineRef.current) return;
    const engine = engineRef.current;
    const request = ++requestRef.current;
    const revision = state.revision;
    dispatch({ type: 'checking' });
    try {
      const [hand, penalties] = await Promise.all([
        engine.evaluate(toCounts(state.cards), config),
        engine.penalties({ ...config, hands: [{ faces: state.cards.map(card => card.face) }] }),
      ]);
      if (request !== requestRef.current) return;
      dispatch({ type: 'result', revision, hand, penalty: penalties[0] });
    } catch (error) {
      if (request !== requestRef.current) return;
      dispatch({
        type: 'error', revision,
        message: `${error.message}. This is an evaluation error, not an invalid-hand verdict. You can retry.`,
      });
    }
  }

  return (
    <div className="papplu-builder">
      <header className="papplu-section-heading">
        <div>
          <h2>Hand Builder</h2>
          <p className="papplu-muted">Try a grouping without dealing a round. The table and builder use separate Workers.</p>
        </div>
        <span className="papplu-count" role="status">{state.cards.length} / {state.config.cardsInHand} cards</span>
      </header>
      {startup.status === 'starting' && <p role="status">Starting the evaluation Worker...</p>}
      {startup.status === 'error' && <div className="papplu-error">
        <p role="alert">The builder could not start. {startup.message}</p>
        <button type="button" className="papplu-button" onClick={() => setAttempt(value => value + 1)}>Retry builder engine</button>
      </div>}
      <fieldset className="papplu-builder-settings">
        <legend>Hand rules</legend>
        <label>
          Decks
          <input type="number" min="1" max="6" step="1" value={state.config.decks}
            onChange={event => dispatch({ type: 'configure', patch: { decks: event.target.value } })} />
        </label>
        <label>
          Cards per hand
          <input type="number" min="3" max="30" step="1" value={state.config.cardsInHand}
            onChange={event => dispatch({ type: 'configure', patch: { cardsInHand: event.target.value } })} />
        </label>
        <label>
          Required pure sequences
          <input type="number" min="0" max="10" step="1" value={state.config.requiredSequences}
            onChange={event => dispatch({ type: 'configure', patch: { requiredSequences: event.target.value } })} />
        </label>
        <label>
          Joker suit
          <select value={state.config.jokerSuit}
            onChange={event => dispatch({ type: 'configure', patch: { jokerSuit: event.target.value } })}>
            {SUITS.map((suit, index) => <option key={suit} value={index}>{suit}</option>)}
          </select>
        </label>
        <label>
          Joker rank
          <select value={state.config.jokerRank}
            onChange={event => dispatch({ type: 'configure', patch: { jokerRank: event.target.value } })}>
            {RANKS.map((rank, index) => <option key={rank} value={index}>{rank}</option>)}
          </select>
        </label>
      </fieldset>
      {validationError && <p className="papplu-error" role="alert">{validationError}</p>}
      <div className="papplu-example-buttons">
        <button type="button" className="papplu-button" onClick={() => dispatch({ type: 'sample', name: 'valid' })}>Load valid 21-card example</button>
        <button type="button" className="papplu-button" onClick={() => dispatch({ type: 'sample', name: 'invalid' })}>Load invalid 21-card example</button>
      </div>
      <section className="papplu-builder-hand papplu-felt" aria-label="Built hand">
        <div className="papplu-section-heading">
          <h3>Your cards</h3>
          <span className="papplu-muted">Joker · {faceName(joker)}</span>
        </div>
        {state.cards.length ? <div className="papplu-hand" role="group" aria-label="Builder hand">
          {state.cards.map(card => <PlayingCard key={card.id} card={card} joker={joker}
            selected={card.id === state.selectedId} onSelect={() => dispatch({ type: 'select', id: card.id })} />)}
        </div> : <p className="papplu-empty-hand">Choose cards below, or load an example to begin.</p>}
        <p className="papplu-selection">
          {selectedIndex < 0 ? 'Select a card to move or remove it.' : `Selected card · ${faceName(state.cards[selectedIndex].face)}`}
        </p>
        <div className="papplu-hand-tools">
          <button type="button" className="papplu-button papplu-quiet" disabled={selectedIndex <= 0}
            onClick={() => dispatch({ type: 'move', index: selectedIndex - 1 })}>Move left</button>
          <button type="button" className="papplu-button papplu-quiet"
            disabled={selectedIndex < 0 || selectedIndex === state.cards.length - 1}
            onClick={() => dispatch({ type: 'move', index: selectedIndex + 1 })}>Move right</button>
          <button type="button" className="papplu-button papplu-quiet" disabled={state.cards.length < 2}
            onClick={() => dispatch({ type: 'sort' })}>Sort hand</button>
          <button type="button" className="papplu-button" disabled={selectedIndex < 0}
            onClick={() => dispatch({ type: 'remove' })}>Remove selected</button>
          <button type="button" className="papplu-button papplu-quiet" disabled={!state.cards.length}
            onClick={() => dispatch({ type: 'clear' })}>Clear hand</button>
        </div>
      </section>
      <section className="papplu-card-picker" aria-label="Card picker">
        <h3>Add cards</h3>
        <p className="papplu-muted">Up to {state.config.decks} copies of each face. Stop at {state.config.cardsInHand} cards. On a narrow screen, scroll each suit to see every rank.</p>
        {SUITS.map((suit, suitIndex) => (
          <section className="papplu-picker-suit" key={suit} aria-label={suit}>
            <h4><span aria-hidden="true">{SUIT_SYMBOLS[suitIndex]}</span> {suit}</h4>
            <div className="papplu-picker-scroll" role="group" tabIndex={0} aria-label={`${suit} card choices`}>
              <div className="papplu-picker-row">
                {RANKS.map((rank, rankIndex) => {
                  const face = suitIndex * 13 + rankIndex;
                  return (
                    <button type="button" className="papplu-picker-card" key={rank}
                      aria-label={`Add ${faceName(face)}`} disabled={!config || state.cards.length >= config.cardsInHand || counts[face] >= config.decks}
                      onClick={() => dispatch({ type: 'add', face })}>
                      <CardArt face={face} />
                      <span className="papplu-copy-count" aria-hidden="true">{counts[face]} / {state.config.decks}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        ))}
      </section>
      <section className="papplu-result-panel" aria-label="Builder evaluation">
        <div className="papplu-section-heading">
          <h3>Hand evaluation</h3>
          <button type="button" className="papplu-button papplu-primary"
            disabled={!config || startup.status !== 'ready' || evaluation.status === 'checking'}
            onClick={evaluate}>{evaluation.status === 'error' ? 'Retry evaluation' : 'Evaluate hand'}</button>
        </div>
        {evaluation.status === 'idle' && <p className="papplu-muted">Evaluate to see the minimum deadwood and a complete-hand verdict. Changing the cards or rules clears the previous result.</p>}
        {evaluation.status === 'checking' && <p role="status">Checking hand and minimum deadwood...</p>}
        {evaluation.status === 'error' && <p role="alert" className="papplu-error">{evaluation.message}</p>}
        {evaluation.status === 'ready' && <>
          {state.cards.length === config.cardsInHand
            ? <Evaluation evaluation={evaluation.hand} joker={joker} />
            : <p className="papplu-notice">Partial hand · {state.cards.length} of {config.cardsInHand} cards. Minimum deadwood is shown below, but this is not a complete-hand verdict.</p>}
          <PenaltyResult penalty={evaluation.penalty} joker={joker} />
        </>}
      </section>
    </div>
  );
}
