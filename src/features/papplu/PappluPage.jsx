import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DECLARATION_PENALTY } from './engine/game.mjs';
import { CardArt, Evaluation, faceName, PenaltyResult, PlayingCard, FaceList, StaticCard, RANKS } from './PappluCards.jsx';
import { HandBuilder } from './HandBuilder.jsx';
import { PRESET_NAMES, readTableSetup, TIER_NAMES } from './settings.js';
import { createBuilderEngine, usePappluTable } from './usePappluTable.js';
import './papplu.css';

function TableSetup({ settings, hasRound, ready, dispatch }) {
  const [draft, setDraft] = useState(() => ({
    ...settings, seats: settings.seats.map(seat => ({ ...seat })),
  }));
  const [dirty, setDirty] = useState(false);
  const [open, setOpen] = useState(!hasRound);
  const [error, setError] = useState(null);

  function change(patch) {
    setDraft(current => ({ ...current, ...patch, preset: 'custom' }));
    setDirty(true);
    setError(null);
  }

  function changeSeat(index, patch) {
    change({ seats: draft.seats.map((seat, position) => position === index ? { ...seat, ...patch } : seat) });
  }

  function deal(event) {
    event.preventDefault();
    if (!ready) return;
    try {
      const patch = readTableSetup(draft);
      if (dirty) dispatch({ type: 'configure', patch });
      dispatch({ type: 'deal' });
      setError(null);
      setOpen(false);
    } catch (failure) {
      setError(failure.message);
      setOpen(true);
    }
  }

  return (
    <section className="papplu-setup" aria-label="Table setup">
      <details open={open} onToggle={event => setOpen(event.currentTarget.open)}>
        <summary>
          <span>Table setup</span>
          <span className="papplu-muted">
            {draft.seats.length} {draft.seats.length === 1 ? 'seat' : 'seats'} · {draft.cardsInHand} cards · {draft.requiredSequences} pure
          </span>
        </summary>
        <form id="papplu-setup-form" noValidate onSubmit={deal}>
          <fieldset className="papplu-presets">
            <legend>Quick setup</legend>
            <div className="papplu-preset-list">
              {Object.entries(PRESET_NAMES).map(([name, label]) => (
                <button type="button" key={name} className="papplu-preset"
                  aria-pressed={draft.preset === name}
                  onClick={() => dispatch({ type: 'preset', name })}>{label}</button>
              ))}
            </div>
          </fieldset>
          <div className="papplu-setup-grid">
            <fieldset className="papplu-seat-editor">
              <legend>Players</legend>
              {draft.seats.map((seat, index) => (
                <div className="papplu-seat-row" key={index}>
                  <label>
                    Seat {index + 1} name
                    <input aria-label={`Seat ${index + 1} name`} value={seat.name} maxLength={24}
                      onChange={event => changeSeat(index, { name: event.target.value })} />
                  </label>
                  <label>
                    Player type
                    <select aria-label={`Seat ${index + 1} type`} value={seat.kind}
                      onChange={event => changeSeat(index, {
                        kind: event.target.value, tier: seat.tier ?? 'neural',
                      })}>
                      <option value="human">Human</option>
                      <option value="ai">AI</option>
                    </select>
                  </label>
                  {seat.kind === 'ai' && <label>
                    AI tier
                    <select aria-label={`Seat ${index + 1} AI tier`} value={seat.tier}
                      onChange={event => changeSeat(index, { tier: event.target.value })}>
                      {Object.entries(TIER_NAMES).map(([tier, label]) => <option key={tier} value={tier}>{label}</option>)}
                    </select>
                  </label>}
                  <button type="button" className="papplu-button papplu-quiet"
                    aria-label={`Remove seat ${index + 1}`} disabled={draft.seats.length === 1}
                    onClick={() => change({ seats: draft.seats.filter((_, position) => position !== index) })}>
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" className="papplu-button papplu-quiet" disabled={draft.seats.length === 6}
                onClick={() => change({
                  seats: [...draft.seats, { name: `Player ${draft.seats.length + 1}`, kind: 'human' }],
                })}>Add seat</button>
            </fieldset>
            <fieldset className="papplu-rule-editor">
              <legend>Rules for the next deal</legend>
              <div className="papplu-rule-fields">
                <label>
                  Decks
                  <input type="number" min="1" max="6" step="1" value={draft.decks}
                    onChange={event => change({ decks: event.target.value })} />
                </label>
                <label>
                  Cards per hand
                  <input type="number" min="3" max="30" step="1" value={draft.cardsInHand}
                    onChange={event => change({ cardsInHand: event.target.value })} />
                </label>
                <label>
                  Required pure sequences
                  <input type="number" min="0" max="10" step="1" value={draft.requiredSequences}
                    onChange={event => change({ requiredSequences: event.target.value })} />
                </label>
                <label>
                  AI pace
                  <select value={draft.aiSpeed} onChange={event => change({ aiSpeed: event.target.value })}>
                    <option value="instant">Instant</option>
                    <option value="normal">Normal</option>
                    <option value="slow">Slow</option>
                  </select>
                </label>
              </div>
              <label className="papplu-toggle">
                <input type="checkbox" checked={draft.recycleDiscard}
                  onChange={event => change({ recycleDiscard: event.target.checked })} />
                Recycle the discard pile when stock runs out
              </label>
              <p className="papplu-muted">Recycling keeps the top discard in place and shuffles the cards underneath.</p>
              <p className="papplu-muted">Neural + Search uses the exported model for supported rules. Any switch to Tactical appears on the seat.</p>
            </fieldset>
          </div>
        </form>
      </details>
      <div className="papplu-setup-footer">
        <p className="papplu-muted">
          {hasRound ? 'Changes apply to the next deal, not the round in play. A new deal replaces this round.' : 'Choose a setup, then deal. You can change every seat before playing.'}
        </p>
        <button type="button" className="papplu-button papplu-primary" disabled={!ready} onClick={deal}>
          {hasRound ? 'Deal new round' : 'Deal round'}
        </button>
      </div>
      {error && <p className="papplu-error" role="alert">{error}</p>}
    </section>
  );
}

const DOWNGRADE_MESSAGES = {
  'no-model': 'The neural model is still loading or unavailable.',
  'rules-mismatch': 'The model does not support these rules.',
  'seat-count': 'The model does not support this seat count.',
};

function Scoreboard({ round }) {
  return (
    <section className="papplu-scoreboard" aria-label="False-declaration scoreboard">
      <div className="papplu-section-heading">
        <h3>False-declaration scoreboard</h3>
        <p className="papplu-muted">Deadwood is scored separately at the end of the round.</p>
      </div>
      <ul className="papplu-seats">
        {round.seats.map((seat, index) => (
          <li key={index} className={`papplu-seat${index === round.currentSeat ? ' is-current' : ''}${seat.active ? '' : ' is-eliminated'}`}>
            <div className="papplu-seat-title">
              <strong>{seat.name}</strong>
              <span>{seat.active ? `${seat.handSize} cards` : 'Eliminated'}</span>
            </div>
            <span className="papplu-muted">
              {seat.kind === 'human' ? 'Human' : TIER_NAMES[seat.effectiveTier ?? seat.tier]}
              {seat.thinking ? ' · Thinking...' : ''}
            </span>
            <p className="papplu-score">Round {seat.roundPenalty} · Total {seat.penaltyPoints}</p>
            {seat.downgrade && <p className="papplu-downgrade" role="status">
              Playing {TIER_NAMES[seat.effectiveTier]}. {DOWNGRADE_MESSAGES[seat.downgrade] ?? seat.downgrade}
            </p>}
            {seat.lastReason && <span className="papplu-ai-reason">Last move · {seat.lastReason.replaceAll('-', ' ')}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function HandCheck({ check, joker, dispatch }) {
  if (check.status === 'off') return null;
  return (
    <section className="papplu-result-panel" aria-label="Hand check">
      <h3>Hand check</h3>
      {check.status === 'ready' && <Evaluation evaluation={check.evaluation} joker={joker} />}
      {check.status === 'checking' && <p role="status">Checking hand...</p>}
      {check.status === 'unavailable' && <p className="papplu-muted">{check.message}</p>}
      {check.status === 'error' && <>
        <p role="alert" className="papplu-error">Hand evaluation error. {check.message}</p>
        <button type="button" className="papplu-button"
          onClick={() => dispatch({ type: 'retry', what: 'hand-check' })}>Retry hand check</button>
      </>}
    </section>
  );
}

function Declaration({ round, dispatch }) {
  const declaration = round.declaration;
  if (declaration.status === 'none') return null;
  return (
    <section className="papplu-result-panel" aria-label="Declaration">
      <h3>Declaration</h3>
      {declaration.status === 'checking' && <p role="status">Checking the committed face-down discard and remaining hand...</p>}
      {declaration.status === 'error' && <>
        <p role="alert" className="papplu-error">{declaration.message}</p>
        <button type="button" className="papplu-button"
          onClick={() => dispatch({ type: 'retry', what: 'declaration' })}>Retry declaration</button>
      </>}
      {declaration.status === 'resolved' && <>
        <p>{round.seats[declaration.seat].name}{declaration.valid
          ? ' made a valid declaration.'
          : ` made a false declaration, received ${DECLARATION_PENALTY} penalty points, and was eliminated.`}</p>
        <Evaluation evaluation={declaration.evaluation} joker={round.joker} />
      </>}
    </section>
  );
}

function RoundSummary({ round, dispatch }) {
  if (round.summary.status === 'none') return null;
  return (
    <section className="papplu-summary" aria-label="Round summary">
      <h2>Round summary</h2>
      <p className="papplu-muted">Each hand receives its minimum deadwood score. These points are not added to the false-declaration scoreboard.</p>
      {round.summary.status === 'scoring' && <p role="status">Scoring every hand...</p>}
      {round.summary.status === 'error' && <>
        <p role="alert" className="papplu-error">{round.summary.message}</p>
        <button type="button" className="papplu-button"
          onClick={() => dispatch({ type: 'retry', what: 'summary' })}>Retry summary</button>
      </>}
      {round.summary.status === 'ready' && <div className="papplu-summary-grid">
        {round.summary.rows.map(row => (
          <article key={row.seat} className="papplu-summary-seat" aria-label={`${row.name} round summary`}>
            <h3>{row.name}</h3>
            <p className="papplu-muted">False-declaration points · {row.roundPenalty} this round · {row.penaltyPoints} total</p>
            <details>
              <summary>Final hand and face-down discard</summary>
              <FaceList faces={row.faces} joker={round.joker} label={`${row.name} final hand`} />
              <h4>Face-down discard</h4>
              {row.faceDown === null
                ? <p className="papplu-muted">No declaration discard.</p>
                : <FaceList faces={[row.faceDown]} joker={round.joker} label={`${row.name} declaration discard`} />}
            </details>
            <PenaltyResult penalty={row.penalty} joker={round.joker} />
          </article>
        ))}
      </div>}
    </section>
  );
}

const PHASE_LABELS = {
  draw: 'Draw a card',
  discard: 'Choose your discard',
  declaring: 'Checking declaration',
  finished: 'Round complete',
};

function roundHeading(round) {
  if (!round.outcome) {
    const name = round.seats[round.currentSeat].name;
    return name === 'You' ? 'Your turn' : `${name}'s turn`;
  }
  if (round.outcome.winner === null) return 'Round over. No winner.';
  const name = round.seats[round.outcome.winner].name;
  if (round.outcome.reason === 'last-remaining') return `${name} is the last active player.`;
  return name === 'You' ? 'You win with a valid declaration.' : `${name} wins with a valid declaration.`;
}

function TableRound({ round, paused, dispatch }) {
  const active = round.seats[round.currentSeat];
  const [selection, setSelection] = useState({ stamp: round.stamp, cardId: active.drawnCardId });
  const selectedId = selection.stamp === round.stamp ? selection.cardId : active.drawnCardId;
  const selectedIndex = active.hand?.findIndex(card => card.id === selectedId) ?? -1;
  const selected = active.hand?.[selectedIndex];
  const send = (type, fields = {}) => dispatch({ type, ...fields, stamp: round.stamp });
  const drawAllowed = round.canAct && round.phase === 'draw';

  return (
    <>
      <section className="papplu-table" aria-label="Papplu table">
        <div className="papplu-round-header">
          <div>
            <p className="papplu-eyebrow">Turn {round.turn} · {paused ? 'Paused' : PHASE_LABELS[round.phase]}</p>
            <h2>{roundHeading(round)}</h2>
            {active.thinking && <p role="status">{active.name} is thinking...</p>}
          </div>
          {round.phase !== 'finished' && <button type="button" className="papplu-button"
            onClick={() => dispatch({ type: paused ? 'resume' : 'pause' })}>{paused ? 'Resume' : 'Pause'}</button>}
        </div>
        <Scoreboard round={round} />
        <div className="papplu-felt">
          <div className="papplu-piles">
            <section className="papplu-pile" aria-label="Stock">
              <h3>Stock</h3>
              <p>{round.stockCount} cards</p>
              <div className="papplu-pile-card"><CardArt /></div>
              <button type="button" className="papplu-button" disabled={!drawAllowed || !round.stockCount}
                onClick={() => send('draw', { source: 'stock' })}>Draw from stock</button>
            </section>
            <section className="papplu-pile" aria-label="Discard pile">
              <h3>Discard</h3>
              <p>{round.pileCount} {round.pileCount === 1 ? 'card' : 'cards'}</p>
              <div className="papplu-pile-card">
                {round.pileTop === null ? <span className="papplu-empty-pile">Empty pile</span> : <StaticCard face={round.pileTop} joker={round.joker} />}
              </div>
              <button type="button" className="papplu-button" disabled={!drawAllowed || !round.pileCount}
                onClick={() => send('draw', { source: 'discard' })}>Take discard</button>
            </section>
            <section className="papplu-pile papplu-joker-reference" aria-label="Joker reference">
              <h3>Joker</h3>
              <p>Rank {RANKS[round.joker % 13]} is wild</p>
              <div className="papplu-pile-card"><StaticCard face={round.joker} /></div>
              <p className="papplu-muted">Wild in all four suits.<br />{round.recycleDiscard ? 'Stock recycling on' : 'Stock recycling off'}</p>
            </section>
          </div>
          {round.viewer.mode === 'cover' ? (
            <div className="papplu-cover" role="group" aria-label="Private hand handoff">
              <h3>Pass the device to {active.name}</h3>
              <p>All human hands are covered. Reveal only when the next player is ready.</p>
              <button type="button" className="papplu-button papplu-primary" disabled={paused}
                onClick={() => send('reveal')}>Reveal hand</button>
            </div>
          ) : <>
            {round.viewer.mode === 'table' && <p className="papplu-waiting">All human hands are covered while {active.name} plays.</p>}
            {round.viewer.mode === 'spectator' && <p className="papplu-muted">AI Watch shows every hand. AI declares verified wins automatically.</p>}
            {round.seats.map((seat, index) => seat.hand && (
              <section className="papplu-hand-section" key={index}>
                <div className="papplu-section-heading">
                  <h3>{seat.name === 'You' ? 'Your hand' : `${seat.name}'s hand`}</h3>
                  <span className="papplu-muted">{seat.handSize} cards</span>
                </div>
                <div className="papplu-hand" role="group" aria-label={`Hand for ${seat.name}`}>
                  {seat.hand.map(card => (
                    <PlayingCard key={card.id} card={card} joker={round.joker}
                      selected={round.canAct && card.id === selectedId}
                      drawn={card.id === seat.drawnCardId} disabled={!round.canAct || index !== round.currentSeat}
                      onSelect={() => setSelection({
                        stamp: round.stamp, cardId: selectedId === card.id ? null : card.id,
                      })} />
                  ))}
                </div>
                {index === round.currentSeat && seat.kind === 'human' && round.phase !== 'finished' && <>
                  <p className="papplu-selection">{selected ? `Selected discard · ${faceName(selected.face)}` : 'Select a card to arrange, discard, or commit face down.'}</p>
                  <div className="papplu-hand-tools" aria-label="Arrange hand">
                    <button type="button" className="papplu-button papplu-quiet" disabled={!round.canAct || selectedIndex <= 0}
                      onClick={() => send('arrange', { cardId: selectedId, index: selectedIndex - 1 })}>Move left</button>
                    <button type="button" className="papplu-button papplu-quiet"
                      disabled={!round.canAct || selectedIndex < 0 || selectedIndex === seat.hand.length - 1}
                      onClick={() => send('arrange', { cardId: selectedId, index: selectedIndex + 1 })}>Move right</button>
                    <button type="button" className="papplu-button papplu-quiet" disabled={!round.canAct}
                      onClick={() => send('sort-hand')}>Sort hand</button>
                  </div>
                  <div className="papplu-hand-actions">
                    <button type="button" className="papplu-button" disabled={!round.canAct || round.phase !== 'discard' || selectedIndex < 0}
                      onClick={() => send('discard', { cardId: selectedId })}>Discard selected</button>
                    <button type="button" className="papplu-button" disabled={!round.canAct || round.phase !== 'discard' || seat.drawnCardId === null}
                      onClick={() => send('discard', { cardId: seat.drawnCardId })}>Discard drawn</button>
                    <button type="button" className="papplu-button papplu-declare" aria-describedby="papplu-declare-risk"
                      disabled={!round.canAct || round.phase !== 'discard' || selectedIndex < 0}
                      onClick={() => send('declare', { cardId: selectedId })}>Declare win</button>
                  </div>
                  <p className="papplu-declare-risk" id="papplu-declare-risk">
                    Declare win commits the selected discard face down. An invalid declaration costs {DECLARATION_PENALTY} points and eliminates you from the round.
                  </p>
                </>}
                {seat.kind === 'human' && active.kind === 'ai' && <p className="papplu-muted">Your hand stays visible. Opponent hands stay private.</p>}
              </section>
            ))}
          </>}
        </div>
        {['seat', 'hand'].includes(round.viewer.mode) && <div className="papplu-check-control">
          <label className="papplu-toggle">
            <input type="checkbox" checked={round.handCheck.status !== 'off'}
              onChange={event => dispatch({ type: 'check-hand', on: event.target.checked })} />
            Check hand
          </label>
          <p className="papplu-muted">A valid hand check does not win the round. You must draw, select a discard, and use Declare win.</p>
        </div>}
        <HandCheck check={round.handCheck} joker={round.joker} dispatch={dispatch} />
        <Declaration round={round} dispatch={dispatch} />
      </section>
      <RoundSummary round={round} dispatch={dispatch} />
    </>
  );
}

export default function PappluPage({ engineFactory, builderEngineFactory = createBuilderEngine, storage, random }) {
  const { snapshot, startup, storageError, dispatch, retry } = usePappluTable({ engineFactory, storage, random });
  const [tab, setTab] = useState('table');
  const { round } = snapshot;

  function selectTab(next) {
    if (next === 'builder' && round && round.phase !== 'finished' && !snapshot.paused) {
      dispatch({ type: 'pause' });
    }
    setTab(next);
  }

  function navigateTabs(event) {
    const adjacent = tab === 'table' ? 'builder' : 'table';
    const keys = { ArrowLeft: adjacent, ArrowRight: adjacent, Home: 'table', End: 'builder' };
    if (!keys[event.key]) return;
    event.preventDefault();
    selectTab(keys[event.key]);
    document.getElementById(`papplu-tab-${keys[event.key]}`).focus();
  }

  return (
    <main className="papplu-page">
      <div className="papplu-shell">
        <nav className="papplu-back-links" aria-label="Website navigation">
          <Link to="/portfolio">Back to portfolio</Link>
          <Link to="/">Home</Link>
        </nav>
        <header className="papplu-header">
          <div>
            <p className="papplu-eyebrow">Papplu AI</p>
            <h1>A seat at your own table.</h1>
            <p>Play 21-card Papplu against AI, practice solo, or pass the device to friends.</p>
          </div>
          <p className="papplu-local-note">Runs in your browser.<br /> No account. No server. No online opponents.</p>
        </header>
        <div className="papplu-tabs" role="tablist" aria-label="Papplu modes" onKeyDown={navigateTabs}>
          {[['table', 'Play table'], ['builder', 'Hand Builder']].map(([name, label]) => (
            <button type="button" role="tab" key={name} id={`papplu-tab-${name}`}
              className="papplu-tab" aria-selected={tab === name} aria-controls={`papplu-panel-${name}`}
              tabIndex={tab === name ? 0 : -1} onClick={() => selectTab(name)}>{label}</button>
          ))}
        </div>
        {storageError && <p role="alert" className="papplu-error">{storageError}</p>}
        <section role="tabpanel" id="papplu-panel-table" aria-labelledby="papplu-tab-table" hidden={tab !== 'table'}>
          {startup.status === 'starting' && <p role="status">Starting the table Worker...</p>}
          {startup.status === 'error' && <div className="papplu-error">
            <p role="alert">The table could not start. {startup.message}</p>
            <button type="button" className="papplu-button" onClick={retry}>Retry table engine</button>
          </div>}
          <TableSetup key={JSON.stringify(snapshot.settings)} settings={snapshot.settings}
            hasRound={Boolean(round)} ready={startup.status === 'ready'} dispatch={dispatch} />
          {snapshot.notice && <p role="status" className="papplu-notice">{snapshot.notice}</p>}
          {round
            ? <TableRound round={round} paused={snapshot.paused} dispatch={dispatch} />
            : <section className="papplu-welcome" aria-label="How to play">
              <div className="papplu-welcome-cards" aria-hidden="true">
                {[0, 1, 2].map(face => <CardArt key={face} face={face} />)}
              </div>
              <div>
                <h2>Draw. Arrange. Declare.</h2>
                <p>Draw from the stock or take the top discard. Arrange your cards into melds, then discard one card to finish your turn.</p>
                <p>For a win, the remaining hand must form complete melds with the required qualifying pure sequences. Select a face-down discard and declare when you are ready.</p>
                <p className="papplu-muted">Start with Solo Practice to learn the flow, or open Hand Builder to try a valid 21-card example.</p>
              </div>
            </section>}
        </section>
        <section role="tabpanel" id="papplu-panel-builder" aria-labelledby="papplu-tab-builder" hidden={tab !== 'builder'}>
          {round && snapshot.paused && round.phase !== 'finished' && <p className="papplu-notice">The table is paused. Return to Play table and use Resume when you are ready.</p>}
          <HandBuilder engineFactory={builderEngineFactory} active={tab === 'builder'} />
        </section>
        <footer className="papplu-footer">
          <p>Local play only. Settings stay on this device when browser storage is available.</p>
          <a href="https://github.com/doublexmax/PappluAI" target="_blank" rel="noreferrer">PappluAI source</a>
        </footer>
      </div>
    </main>
  );
}
