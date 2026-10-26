import '@testing-library/jest-dom/vitest';
import { StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, test, vi } from 'vitest';
import { createLocalEngine } from './engine/engine.mjs';
import PappluPage from './PappluPage.jsx';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function seededRandom(seed = 42) {
  return () => {
    seed |= 0;
    seed = seed + 0x6d2b79f5 | 0;
    let value = Math.imul(seed ^ seed >>> 15, 1 | seed);
    value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

const localFactory = () => createLocalEngine();

function renderPage(props = {}) {
  return render(
    <MemoryRouter>
      <PappluPage engineFactory={localFactory} builderEngineFactory={localFactory}
        storage={null} random={seededRandom()} {...props} />
    </MemoryRouter>
  );
}

function table() {
  return within(screen.getByRole('tabpanel', { name: 'Play table' }));
}

function builder() {
  return within(screen.getByRole('tabpanel', { name: 'Hand Builder' }));
}

function openBuilder() {
  fireEvent.click(screen.getByRole('tab', { name: 'Hand Builder' }));
  return builder();
}

function smallSolo() {
  fireEvent.click(table().getByRole('button', { name: 'Solo Practice' }));
  fireEvent.change(table().getByLabelText('Decks'), { target: { value: '1' } });
  fireEvent.change(table().getByLabelText('Cards per hand'), { target: { value: '3' } });
  fireEvent.change(table().getByLabelText('Required pure sequences'), { target: { value: '1' } });
  fireEvent.click(table().getByRole('button', { name: 'Deal round' }));
}

test('presets configure actual seat editors and custom setups allow up to six seats', () => {
  renderPage();
  expect(table().getByLabelText('Seat 2 AI tier')).toHaveValue('neural');
  expect(table().getByLabelText('Decks')).toHaveValue(3);
  expect(table().getByLabelText(/Recycle the discard/)).toBeChecked();

  fireEvent.click(table().getByRole('button', { name: 'Solo Practice' }));
  expect(table().getByLabelText('Seat 1 type')).toHaveValue('human');
  expect(table().queryByLabelText('Seat 2 name')).not.toBeInTheDocument();

  fireEvent.click(table().getByRole('button', { name: 'Pass & Play' }));
  expect(table().getByLabelText('Seat 1 name')).toHaveValue('Player 1');
  expect(table().getByLabelText('Seat 2 type')).toHaveValue('human');

  fireEvent.click(table().getByRole('button', { name: 'AI Watch' }));
  expect(table().getByLabelText('Seat 1 AI tier')).toHaveValue('neural');
  expect(table().getByLabelText('Seat 2 AI tier')).toHaveValue('tactical');
  expect(table().getByLabelText('Seat 3 AI tier')).toHaveValue('casual');
  for (let index = 0; index < 3; index += 1) {
    fireEvent.click(table().getByRole('button', { name: 'Add seat' }));
  }
  expect(table().getByRole('button', { name: 'Add seat' })).toBeDisabled();
  expect(table().getByLabelText('Seat 6 name')).toHaveValue('Player 6');
  fireEvent.change(table().getByLabelText('Seat 6 type'), { target: { value: 'ai' } });
  fireEvent.change(table().getByLabelText('Seat 6 AI tier'), { target: { value: 'tactical' } });
  expect(table().getByLabelText('Seat 6 AI tier')).toHaveValue('tactical');
  fireEvent.click(table().getByRole('button', { name: 'Remove seat 6' }));
  expect(table().getByRole('button', { name: 'Add seat' })).toBeEnabled();
});

test('manual rule and capacity errors stay visible instead of becoming controller defaults', () => {
  renderPage();
  fireEvent.click(table().getByRole('button', { name: 'Pass & Play' }));
  fireEvent.change(table().getByLabelText('Decks'), { target: { value: '0' } });
  fireEvent.click(table().getByRole('button', { name: 'Deal round' }));
  expect(table().getByRole('alert')).toHaveTextContent('Decks must be an integer from 1 to 6.');
  expect(table().getByLabelText('Decks')).toHaveValue(0);

  fireEvent.change(table().getByLabelText('Decks'), { target: { value: '1' } });
  fireEvent.change(table().getByLabelText('Cards per hand'), { target: { value: '30' } });
  fireEvent.click(table().getByRole('button', { name: 'Deal round' }));
  expect(table().getByRole('alert')).toHaveTextContent('This setup needs 62 cards, but 1 deck supplies 52.');
  expect(table().getByLabelText('Cards per hand')).toHaveValue(30);

  fireEvent.change(table().getByLabelText('Decks'), { target: { value: '3' } });
  fireEvent.change(table().getByLabelText('Cards per hand'), { target: { value: '21' } });
  fireEvent.change(table().getByLabelText('Seat 1 name'), { target: { value: ' ' } });
  fireEvent.click(table().getByRole('button', { name: 'Deal round' }));
  expect(table().getByRole('alert')).toHaveTextContent('Seat 1 needs a name of 1 to 24 characters.');

  fireEvent.change(table().getByLabelText('Seat 1 name'), { target: { value: 'Alex' } });
  fireEvent.click(table().getByRole('button', { name: 'Deal round' }));
  expect(table().getByRole('heading', { name: "Alex's turn" })).toBeInTheDocument();
  expect(table().getByRole('button', { name: 'Reveal hand' })).toBeEnabled();
});

test('solo draw and explicit discard update the real hand, stock, pile, and turn', () => {
  renderPage();
  fireEvent.click(table().getByRole('button', { name: 'Solo Practice' }));
  fireEvent.click(table().getByRole('button', { name: 'Deal round' }));
  expect(within(table().getByRole('group', { name: 'Hand for You' })).getAllByRole('button')).toHaveLength(21);
  expect(within(table().getByRole('region', { name: 'Stock' })).getByText('133 cards')).toBeInTheDocument();
  expect(table().getByRole('button', { name: 'Declare win' })).toBeDisabled();

  fireEvent.click(table().getByRole('button', { name: 'Draw from stock' }));
  const hand = within(table().getByRole('group', { name: 'Hand for You' }));
  expect(hand.getAllByRole('button')).toHaveLength(22);
  expect(hand.getByRole('button', { name: /drawn card/ })).toHaveAttribute('aria-pressed', 'true');
  expect(table().getByRole('button', { name: 'Discard selected' })).toBeEnabled();

  fireEvent.click(table().getByRole('button', { name: 'Discard selected' }));
  expect(within(table().getByRole('group', { name: 'Hand for You' })).getAllByRole('button')).toHaveLength(21);
  expect(within(table().getByRole('region', { name: 'Stock' })).getByText('132 cards')).toBeInTheDocument();
  expect(within(table().getByRole('region', { name: 'Discard pile' })).getByText('2 cards')).toBeInTheDocument();
  expect(table().getByText('Turn 2 · Draw a card')).toBeInTheDocument();
});

test('setup changes leave the current hand alone until a new deal', () => {
  renderPage();
  fireEvent.click(table().getByRole('button', { name: 'Solo Practice' }));
  fireEvent.click(table().getByRole('button', { name: 'Deal round' }));
  fireEvent.click(table().getByText('Table setup', { exact: true }));
  fireEvent.change(table().getByLabelText('Cards per hand'), { target: { value: '3' } });
  fireEvent.change(table().getByLabelText('Required pure sequences'), { target: { value: '1' } });
  expect(within(table().getByRole('group', { name: 'Hand for You' })).getAllByRole('button')).toHaveLength(21);
  expect(table().getByText(/Changes apply to the next deal/)).toBeInTheDocument();
  fireEvent.click(table().getByRole('button', { name: 'Deal new round' }));
  expect(within(table().getByRole('group', { name: 'Hand for You' })).getAllByRole('button')).toHaveLength(3);
  expect(within(table().getByRole('region', { name: 'Stock' })).getByText('151 cards')).toBeInTheDocument();
});

test('pass-and-play covers every human hand between turns and reveals only the active player', () => {
  renderPage();
  fireEvent.click(table().getByRole('button', { name: 'Pass & Play' }));
  fireEvent.click(table().getByRole('button', { name: 'Deal round' }));
  expect(table().getByText('Pass the device to Player 1')).toBeInTheDocument();
  expect(table().queryByRole('group', { name: 'Hand for Player 1' })).not.toBeInTheDocument();

  fireEvent.click(table().getByRole('button', { name: 'Reveal hand' }));
  expect(within(table().getByRole('group', { name: 'Hand for Player 1' })).getAllByRole('button')).toHaveLength(21);
  expect(table().queryByRole('group', { name: 'Hand for Player 2' })).not.toBeInTheDocument();
  fireEvent.click(table().getByRole('button', { name: 'Draw from stock' }));
  fireEvent.click(table().getByRole('button', { name: 'Discard drawn' }));

  expect(table().getByText('Pass the device to Player 2')).toBeInTheDocument();
  expect(table().queryByRole('group', { name: 'Hand for Player 1' })).not.toBeInTheDocument();
  expect(table().queryByRole('checkbox', { name: 'Check hand' })).not.toBeInTheDocument();
  fireEvent.click(table().getByRole('button', { name: 'Reveal hand' }));
  expect(within(table().getByRole('group', { name: 'Hand for Player 2' })).getAllByRole('button')).toHaveLength(21);
  expect(table().queryByRole('group', { name: 'Hand for Player 1' })).not.toBeInTheDocument();
});

test('a solo human keeps their hand during an AI turn without seeing the opponent', () => {
  renderPage();
  fireEvent.click(table().getByRole('button', { name: 'Deal round' }));
  fireEvent.click(table().getByRole('button', { name: 'Draw from stock' }));
  fireEvent.click(table().getByRole('button', { name: 'Discard drawn' }));
  fireEvent.click(table().getByRole('button', { name: 'Pause' }));

  expect(table().getByRole('heading', { name: "Neural AI's turn" })).toBeInTheDocument();
  expect(within(table().getByRole('group', { name: 'Hand for You' })).getAllByRole('button')).toHaveLength(21);
  expect(within(table().getByRole('group', { name: 'Hand for You' })).getAllByRole('button')[0]).toBeDisabled();
  expect(table().queryByRole('group', { name: 'Hand for Neural AI' })).not.toBeInTheDocument();
  expect(table().getByRole('button', { name: 'Resume' })).toBeEnabled();
});

test('AI Watch exposes every AI hand, reports neural downgrade, and shows a failed Worker move', async () => {
  vi.useFakeTimers();
  const factory = () => {
    const engine = createLocalEngine();
    let moves = 0;
    return {
      ...engine,
      chooseMove(...args) {
        moves += 1;
        return moves === 2 ? Promise.reject(new Error('Worker disconnected')) : engine.chooseMove(...args);
      },
    };
  };
  renderPage({ engineFactory: factory });
  fireEvent.click(table().getByRole('button', { name: 'AI Watch' }));
  fireEvent.change(table().getByLabelText('Decks'), { target: { value: '1' } });
  fireEvent.change(table().getByLabelText('Cards per hand'), { target: { value: '3' } });
  fireEvent.change(table().getByLabelText('Required pure sequences'), { target: { value: '1' } });
  fireEvent.click(table().getByRole('button', { name: 'Deal round' }));
  for (const name of ['Neural', 'Tactical', 'Casual']) {
    expect(within(table().getByRole('group', { name: `Hand for ${name}` })).getAllByRole('button')).toHaveLength(3);
  }
  await act(async () => { await vi.advanceTimersByTimeAsync(600); });
  expect(table().getByText('Playing Tactical. The neural model is still loading or unavailable.')).toBeInTheDocument();
  expect(within(table().getByRole('group', { name: 'Hand for Neural' })).getAllByRole('button')).toHaveLength(4);
  await act(async () => { await vi.advanceTimersByTimeAsync(600); });
  expect(table().getByText('Neural could not choose a move, so it played a safe move.')).toBeInTheDocument();
  expect(within(table().getByRole('group', { name: 'Hand for Neural' })).getAllByRole('button')).toHaveLength(3);
  expect(table().getByRole('heading', { name: "Tactical's turn" })).toBeInTheDocument();
});

test('a false declaration has a separate 80-point scoreboard and deadwood witnesses for every seat', async () => {
  renderPage();
  fireEvent.click(table().getByRole('button', { name: 'Pass & Play' }));
  fireEvent.change(table().getByLabelText('Decks'), { target: { value: '1' } });
  fireEvent.change(table().getByLabelText('Cards per hand'), { target: { value: '3' } });
  fireEvent.change(table().getByLabelText('Required pure sequences'), { target: { value: '1' } });
  fireEvent.click(table().getByRole('button', { name: 'Deal round' }));
  fireEvent.click(table().getByRole('button', { name: 'Reveal hand' }));
  fireEvent.click(table().getByRole('button', { name: 'Draw from stock' }));
  fireEvent.click(table().getByRole('button', { name: 'Declare win' }));

  const first = within(await table().findByRole('article', { name: 'Player 1 round summary' }));
  const second = within(table().getByRole('article', { name: 'Player 2 round summary' }));
  expect(first.getByRole('heading', { name: 'Minimum deadwood 19 points' })).toBeInTheDocument();
  expect(second.getByRole('heading', { name: 'Minimum deadwood 27 points' })).toBeInTheDocument();
  expect(first.getByText('No exempt melds.')).toBeInTheDocument();
  expect(within(first.getByRole('group', { name: 'Counted deadwood cards' })).getAllByRole('img').map(card => card.getAttribute('aria-label')))
    .toEqual(['9 of Spades', '6 of Diamonds', '4 of Clubs']);
  expect(table().getByText('Round 80 · Total 80')).toBeInTheDocument();
  expect(table().getByRole('heading', { name: 'Player 2 is the last active player.' })).toBeInTheDocument();
});

test('a failed declaration check keeps the committed hand and charges nothing until a retry returns a verdict', async () => {
  let fail = true;
  const factory = () => {
    const engine = createLocalEngine();
    return {
      ...engine,
      evaluate(...args) {
        if (fail) {
          fail = false;
          return Promise.reject(new Error('Worker connection lost'));
        }
        return engine.evaluate(...args);
      },
    };
  };
  renderPage({ engineFactory: factory });
  smallSolo();
  fireEvent.click(table().getByRole('button', { name: 'Draw from stock' }));
  fireEvent.click(table().getByRole('button', { name: 'Declare win' }));

  expect(await table().findByRole('alert')).toHaveTextContent('No penalty was applied.');
  expect(table().getByText('Round 0 · Total 0')).toBeInTheDocument();
  expect(within(table().getByRole('group', { name: 'Hand for You' })).getAllByRole('button')).toHaveLength(3);
  expect(table().getByRole('button', { name: 'Draw from stock' })).toBeDisabled();
  fireEvent.click(table().getByRole('button', { name: 'Retry declaration' }));
  expect(await table().findByText('Round 80 · Total 80')).toBeInTheDocument();
  expect(table().getByRole('heading', { name: 'Round over. No winner.' })).toBeInTheDocument();
});

test('deadline errors are retryable and a valid hand check still requires an explicit face-down declaration', async () => {
  let fail = true;
  const factory = () => {
    const engine = createLocalEngine();
    return {
      ...engine,
      evaluate(...args) {
        if (fail) {
          fail = false;
          const error = new Error('evaluate exceeded 10 seconds');
          error.name = 'EngineTimeout';
          return Promise.reject(error);
        }
        return engine.evaluate(...args);
      },
    };
  };
  renderPage({ engineFactory: factory, random: () => 0.999999 });
  smallSolo();
  fireEvent.click(table().getByRole('checkbox', { name: 'Check hand' }));
  expect(await table().findByRole('alert')).toHaveTextContent('This is not a losing-hand verdict.');
  fireEvent.click(table().getByRole('button', { name: 'Retry hand check' }));

  expect(await within(table().getByRole('region', { name: 'Hand check' })).findByText('Valid hand')).toBeInTheDocument();
  expect(table().getByRole('button', { name: 'Draw from stock' })).toBeEnabled();
  expect(table().getByRole('button', { name: 'Declare win' })).toBeDisabled();
  expect(table().queryByRole('region', { name: 'Round summary' })).not.toBeInTheDocument();
  fireEvent.click(table().getByRole('button', { name: 'Draw from stock' }));
  fireEvent.click(table().getByRole('button', { name: 'Declare win' }));
  expect(await table().findByRole('heading', { name: 'You win with a valid declaration.' })).toBeInTheDocument();
  expect(await table().findByRole('article', { name: 'You round summary' })).toHaveTextContent('Minimum deadwood 0 points');
});

test('a summary Worker failure can be retried without changing the declaration scoreboard', async () => {
  let fail = true;
  renderPage({ random: () => 0.999999, engineFactory: () => {
    const engine = createLocalEngine();
    return {
      ...engine,
      penalties(...args) {
        if (fail) {
          fail = false;
          return Promise.reject(new Error('Scoring Worker unavailable'));
        }
        return engine.penalties(...args);
      },
    };
  } });
  smallSolo();
  fireEvent.click(table().getByRole('button', { name: 'Draw from stock' }));
  fireEvent.click(table().getByRole('button', { name: 'Declare win' }));
  expect(await table().findByRole('alert')).toHaveTextContent('Round summary failed. Scoring Worker unavailable');
  expect(table().getByText('Round 0 · Total 0')).toBeInTheDocument();
  fireEvent.click(table().getByRole('button', { name: 'Retry summary' }));
  expect(await table().findByRole('article', { name: 'You round summary' })).toHaveTextContent('Minimum deadwood 0 points');
  expect(table().getByText('Round 0 · Total 0')).toBeInTheDocument();
});

test('an unavailable Worker is a visible startup failure with no synchronous fallback', () => {
  vi.stubGlobal('Worker', undefined);
  renderPage({ engineFactory: undefined });
  expect(table().getByRole('alert')).toHaveTextContent('This browser does not support module Workers.');
  expect(table().getByRole('button', { name: 'Retry table engine' })).toBeEnabled();
  expect(table().getByRole('button', { name: 'Deal round' })).toBeDisabled();
});

test('retrying a constructor failure starts a usable table', () => {
  let fail = true;
  renderPage({ engineFactory: () => {
    if (fail) {
      fail = false;
      throw new Error('Module Worker blocked');
    }
    return createLocalEngine();
  } });
  expect(table().getByRole('alert')).toHaveTextContent('Module Worker blocked');
  fireEvent.click(table().getByRole('button', { name: 'Retry table engine' }));
  fireEvent.click(table().getByRole('button', { name: 'Deal round' }));
  expect(within(table().getByRole('group', { name: 'Hand for You' })).getAllByRole('button')).toHaveLength(21);
});

test('StrictMode effect restart recreates the engine and unmount disposes the live engine', async () => {
  const engines = [];
  const factory = () => {
    const engine = createLocalEngine();
    engines.push(engine);
    return engine;
  };
  const page = render(
    <StrictMode><MemoryRouter>
      <PappluPage engineFactory={factory} builderEngineFactory={localFactory} storage={null} random={seededRandom()} />
    </MemoryRouter></StrictMode>
  );
  const counts = Array(52).fill(0);
  counts[0] = 1;
  counts[1] = 1;
  counts[2] = 1;
  const rules = { joker: 7, cardsInHand: 3, requiredSequences: 1 };
  await expect(engines[0].evaluate(counts, rules)).rejects.toThrow('engine disposed');
  expect((await engines.at(-1).evaluate(counts, rules)).is_valid).toBe(true);
  fireEvent.click(table().getByRole('button', { name: 'Deal round' }));
  expect(table().getByRole('heading', { name: 'Your turn' })).toBeInTheDocument();
  page.unmount();
  await expect(engines.at(-1).evaluate(counts, rules)).rejects.toThrow('engine disposed');
});

test('storage read failures are visible while the current session remains playable', () => {
  renderPage({ storage: {
    getItem() { throw new Error('Storage denied'); },
    setItem() { throw new Error('Storage denied'); },
  } });
  expect(screen.getByRole('alert')).toHaveTextContent('The saved setup could not be read.');
  expect(screen.getByRole('alert')).toHaveTextContent('The saved value has not been changed.');
  fireEvent.click(table().getByRole('button', { name: 'Deal round' }));
  expect(table().getByRole('heading', { name: 'Your turn' })).toBeInTheDocument();
});

test('a failed save keeps session edits usable and does not erase the previous saved setup', () => {
  const saved = '{"preset":"solo","seats":[{"kind":"human","name":"Saved player"}],"decks":1,"cardsInHand":3,"requiredSequences":1,"recycleDiscard":true,"aiSpeed":"normal"}';
  const storage = {
    getItem: () => saved,
    setItem() { throw new Error('Quota exceeded'); },
  };
  const page = renderPage({ storage });
  fireEvent.change(table().getByLabelText('Cards per hand'), { target: { value: '4' } });
  fireEvent.click(table().getByRole('button', { name: 'Deal round' }));
  expect(screen.getByRole('alert')).toHaveTextContent('The setup could not be saved.');
  expect(within(table().getByRole('group', { name: 'Hand for Saved player' })).getAllByRole('button')).toHaveLength(4);
  page.unmount();
  renderPage({ storage });
  expect(table().getByLabelText('Cards per hand')).toHaveValue(3);
  expect(table().getByLabelText('Seat 1 name')).toHaveValue('Saved player');
});

test('an explicit successful save replaces malformed settings and clears the old storage warning', () => {
  let saved = '{broken';
  const storage = {
    getItem: () => saved,
    setItem(key, value) { saved = value; },
  };
  const page = renderPage({ storage });
  expect(screen.getByRole('alert')).toHaveTextContent('The saved setup could not be parsed.');
  fireEvent.click(table().getByRole('button', { name: 'Solo Practice' }));
  expect(table().getByLabelText('Seat 1 type')).toHaveValue('human');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  page.unmount();
  renderPage({ storage });
  expect(table().getByRole('button', { name: 'Solo Practice' })).toHaveAttribute('aria-pressed', 'true');
  expect(table().queryByLabelText('Seat 2 name')).not.toBeInTheDocument();
});

test('Hand Builder returns actual valid and invalid 21-card evaluations with minimum deadwood', async () => {
  renderPage();
  const ui = openBuilder();
  fireEvent.click(ui.getByRole('button', { name: 'Load valid 21-card example' }));
  fireEvent.click(ui.getByRole('button', { name: 'Evaluate hand' }));
  expect(await ui.findByText('Valid hand')).toBeInTheDocument();
  expect(ui.getByRole('heading', { name: 'Minimum deadwood 0 points' })).toBeInTheDocument();
  expect(ui.getByText('5 qualifying pure sequences. False-declaration points are separate.')).toBeInTheDocument();

  fireEvent.click(ui.getByRole('button', { name: 'Load invalid 21-card example' }));
  fireEvent.click(ui.getByRole('button', { name: 'Evaluate hand' }));
  expect(await ui.findByText('Not a valid hand')).toBeInTheDocument();
  expect(ui.getByRole('heading', { name: 'Minimum deadwood 60 points' })).toBeInTheDocument();
  expect(within(ui.getByRole('group', { name: 'Counted deadwood cards' })).getAllByRole('img').map(card => card.getAttribute('aria-label')))
    .toEqual(['10 of Spades', 'Queen of Spades', 'Queen of Hearts', '10 of Diamonds', 'Queen of Diamonds', 'King of Clubs']);
});

test('partial builder hands show deadwood without a false complete-hand verdict and enforce copy and hand caps', async () => {
  renderPage();
  const ui = openBuilder();
  fireEvent.click(ui.getByRole('button', { name: 'Add Ace of Spades' }));
  fireEvent.click(ui.getByRole('button', { name: 'Evaluate hand' }));
  expect(await ui.findByText(/Partial hand · 1 of 21 cards/)).toBeInTheDocument();
  expect(ui.getByRole('heading', { name: 'Minimum deadwood 10 points' })).toBeInTheDocument();
  expect(ui.queryByText('Not a valid hand')).not.toBeInTheDocument();

  fireEvent.click(ui.getByRole('button', { name: 'Add Ace of Spades' }));
  fireEvent.click(ui.getByRole('button', { name: 'Add Ace of Spades' }));
  expect(ui.getByRole('button', { name: 'Add Ace of Spades' })).toBeDisabled();
  fireEvent.change(ui.getByLabelText('Cards per hand'), { target: { value: '3' } });
  expect(ui.getByRole('button', { name: 'Add 2 of Spades' })).toBeDisabled();
  fireEvent.click(ui.getByRole('button', { name: 'Remove selected' }));
  expect(ui.getByRole('button', { name: 'Add 2 of Spades' })).toBeEnabled();
  expect(ui.getByRole('button', { name: 'Add Ace of Spades' })).toBeEnabled();
});

test('builder selection, keyboard-sized move buttons, sorting, and removal preserve individual card instances', () => {
  renderPage();
  const ui = openBuilder();
  fireEvent.click(ui.getByRole('button', { name: 'Add King of Clubs' }));
  fireEvent.click(ui.getByRole('button', { name: 'Add Ace of Spades' }));
  fireEvent.click(ui.getByRole('button', { name: 'Move left' }));
  const cards = () => within(ui.getByRole('group', { name: 'Builder hand' })).getAllByRole('button').map(card => card.getAttribute('aria-label'));
  expect(cards()).toEqual(['Ace of Spades, card 2', 'King of Clubs, card 1']);
  fireEvent.click(ui.getByRole('button', { name: 'Move right' }));
  expect(cards()).toEqual(['King of Clubs, card 1', 'Ace of Spades, card 2']);
  fireEvent.click(ui.getByRole('button', { name: 'Sort hand' }));
  expect(cards()).toEqual(['Ace of Spades, card 2', 'King of Clubs, card 1']);
  fireEvent.click(ui.getByRole('button', { name: 'Remove selected' }));
  expect(cards()).toEqual(['King of Clubs, card 1']);
});

test('builder evaluation failures are retryable errors, not invalid verdicts', async () => {
  let fail = true;
  renderPage({ builderEngineFactory: () => {
    const engine = createLocalEngine();
    return {
      ...engine,
      evaluate(...args) {
        if (fail) {
          fail = false;
          return Promise.reject(new Error('evaluate exceeded 10 seconds'));
        }
        return engine.evaluate(...args);
      },
    };
  } });
  const ui = openBuilder();
  fireEvent.click(ui.getByRole('button', { name: 'Load valid 21-card example' }));
  fireEvent.click(ui.getByRole('button', { name: 'Evaluate hand' }));
  expect(await ui.findByRole('alert')).toHaveTextContent('evaluate exceeded 10 seconds');
  expect(ui.getByRole('alert')).toHaveTextContent('not an invalid-hand verdict');
  expect(ui.queryByText('Not a valid hand')).not.toBeInTheDocument();
  fireEvent.click(ui.getByRole('button', { name: 'Retry evaluation' }));
  expect(await ui.findByText('Valid hand')).toBeInTheDocument();
  expect(ui.getByRole('heading', { name: 'Minimum deadwood 0 points' })).toBeInTheDocument();
});

test('a builder Worker constructor failure is visible and retry creates an independent usable engine', async () => {
  let fail = true;
  renderPage({ builderEngineFactory: () => {
    if (fail) {
      fail = false;
      throw new Error('Evaluation Worker blocked');
    }
    return createLocalEngine();
  } });
  const ui = openBuilder();
  expect(ui.getByRole('alert')).toHaveTextContent('Evaluation Worker blocked');
  expect(ui.getByRole('button', { name: 'Evaluate hand' })).toBeDisabled();
  fireEvent.click(ui.getByRole('button', { name: 'Retry builder engine' }));
  fireEvent.click(ui.getByRole('button', { name: 'Add Ace of Spades' }));
  fireEvent.click(ui.getByRole('button', { name: 'Evaluate hand' }));
  expect(await ui.findByText(/Partial hand · 1 of 21 cards/)).toBeInTheDocument();
  expect(ui.getByRole('heading', { name: 'Minimum deadwood 10 points' })).toBeInTheDocument();
});

test('builder ignores stale results after edits and disposes its own engine when leaving the tab', async () => {
  let release;
  let builderEngine;
  renderPage({ builderEngineFactory: () => {
    builderEngine = createLocalEngine();
    let first = true;
    return {
      ...builderEngine,
      evaluate(...args) {
        if (!first) return builderEngine.evaluate(...args);
        first = false;
        return new Promise(resolve => { release = () => resolve(builderEngine.evaluate(...args)); });
      },
    };
  } });
  const ui = openBuilder();
  fireEvent.click(ui.getByRole('button', { name: 'Load valid 21-card example' }));
  fireEvent.click(ui.getByRole('button', { name: 'Evaluate hand' }));
  fireEvent.click(ui.getByRole('button', { name: 'Load invalid 21-card example' }));
  fireEvent.click(ui.getByRole('button', { name: 'Evaluate hand' }));
  expect(await ui.findByText('Not a valid hand')).toBeInTheDocument();
  await act(async () => { release(); });
  expect(ui.getByText('Not a valid hand')).toBeInTheDocument();
  expect(ui.getByRole('heading', { name: 'Minimum deadwood 60 points' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: 'Play table' }));
  await expect(builderEngine.evaluate(Array(52).fill(0), { joker: 7, cardsInHand: 21, requiredSequences: 5 }))
    .rejects.toThrow('engine disposed');
  fireEvent.click(screen.getByRole('tab', { name: 'Hand Builder' }));
  expect(within(builder().getByRole('group', { name: 'Builder hand' })).getAllByRole('button')).toHaveLength(21);
  expect(builder().getByText('Not a valid hand')).toBeInTheDocument();
  expect(builder().getByRole('heading', { name: 'Minimum deadwood 60 points' })).toBeInTheDocument();
});

test('leaving during builder evaluation keeps the draft and allows a new check after returning', async () => {
  let finish;
  let hold = true;
  renderPage({ builderEngineFactory: () => {
    const engine = createLocalEngine();
    return {
      ...engine,
      evaluate(...args) {
        if (!hold) return engine.evaluate(...args);
        hold = false;
        return new Promise(resolve => { finish = resolve; });
      },
    };
  } });
  const ui = openBuilder();
  fireEvent.click(ui.getByRole('button', { name: 'Load valid 21-card example' }));
  fireEvent.click(ui.getByRole('button', { name: 'Evaluate hand' }));
  expect(ui.getByText('Checking hand and minimum deadwood...')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: 'Play table' }));
  fireEvent.click(screen.getByRole('tab', { name: 'Hand Builder' }));
  expect(within(builder().getByRole('group', { name: 'Builder hand' })).getAllByRole('button')).toHaveLength(21);
  expect(builder().getByRole('button', { name: 'Evaluate hand' })).toBeEnabled();
  fireEvent.click(builder().getByRole('button', { name: 'Evaluate hand' }));
  expect(await builder().findByText('Valid hand')).toBeInTheDocument();
  await act(async () => { finish({ is_valid: false, melds: [] }); });
  expect(builder().getByText('Valid hand')).toBeInTheDocument();
  expect(builder().getByRole('heading', { name: 'Minimum deadwood 0 points' })).toBeInTheDocument();
});

test('tab keyboard navigation pauses the table before opening Hand Builder', async () => {
  renderPage();
  fireEvent.click(table().getByRole('button', { name: 'Deal round' }));
  fireEvent.keyDown(screen.getByRole('tab', { name: 'Play table' }), { key: 'ArrowRight' });
  expect(screen.getByRole('tab', { name: 'Hand Builder' })).toHaveFocus();
  expect(builder().getByText(/The table is paused/)).toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole('tab', { name: 'Hand Builder' }), { key: 'Home' });
  expect(screen.getByRole('tab', { name: 'Play table' })).toHaveFocus();
  await waitFor(() => expect(table().getByRole('button', { name: 'Resume' })).toBeEnabled());
});
