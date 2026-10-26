// @vitest-environment node
import { execFileSync, spawnSync } from 'node:child_process';
import {
  appendFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test, vi } from 'vitest';
import {
  beginDeclaration, createGame, discardCard, drawCard, observe, resolveDeclaration, toCounts,
} from './engine/game.mjs';
import { evaluateHand, minimumPenalty } from './engine/evaluate.mjs';
import { createLocalEngine } from './engine/engine.mjs';
import { parseQModel } from './engine/qnet.mjs';
import { createTable } from './engine/table.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const cards = (faces) => faces.map((face, id) => ({ id: 100 + id, face }));

function sequenceGame() {
  const game = createGame({ players: 2, decks: 1, cardsInHand: 3, requiredSequences: 1 }, () => 0.5);
  game.players[0].hand = cards([0, 1, 2]);
  game.stock = [{ id: 103, face: 12 }];
  game.joker = { id: 104, face: 7 };
  return game;
}

describe('the vendored browser engine', () => {
  test('the offline build gate verifies every shipped source file and the model', () => {
    const output = execFileSync(process.execPath, ['scripts/sync-papplu.mjs', '--check'], {
      cwd: root,
      encoding: 'utf8',
    });
    expect(output.trim()).toBe('Verified 9 Papplu engine files against VERSION.json.');
  });

  test('the build gate rejects an edited vendor file and the sync refuses its own destination', () => {
    const fixture = mkdtempSync(join(tmpdir(), 'papplu-vendor-'));
    try {
      mkdirSync(join(fixture, 'scripts'));
      cpSync(join(root, 'scripts', 'sync-papplu.mjs'), join(fixture, 'scripts', 'sync-papplu.mjs'));
      const enginePath = join(fixture, 'src', 'features', 'papplu', 'engine');
      cpSync(join(root, 'src', 'features', 'papplu', 'engine'), enginePath, { recursive: true });
      appendFileSync(join(enginePath, 'game.mjs'), '\nchanged\n');
      const check = spawnSync(process.execPath, ['scripts/sync-papplu.mjs', '--check'], {
        cwd: fixture, encoding: 'utf8',
      });
      expect(check.status).toBe(1);
      expect(check.stderr).toContain('game.mjs differs from VERSION.json');
      const sync = spawnSync(process.execPath, ['scripts/sync-papplu.mjs', '--source', enginePath], {
        cwd: fixture, encoding: 'utf8',
      });
      expect(sync.status).toBe(1);
      expect(sync.stderr).toContain('The source must be the upstream PappluAI web directory.');
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  });

  test('sync rejects a redirected destination before it creates files outside the engine directory', () => {
    const fixture = mkdtempSync(join(tmpdir(), 'papplu-path-'));
    try {
      mkdirSync(join(fixture, 'scripts'));
      cpSync(join(root, 'scripts', 'sync-papplu.mjs'), join(fixture, 'scripts', 'sync-papplu.mjs'));
      const outside = join(fixture, 'outside');
      mkdirSync(outside);
      symlinkSync(outside, join(fixture, 'src'), process.platform === 'win32' ? 'junction' : 'dir');
      const result = spawnSync(process.execPath, [
        'scripts/sync-papplu.mjs', '--source', join(root, 'src', 'features', 'papplu', 'engine'),
      ], { cwd: fixture, encoding: 'utf8' });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('The engine destination must stay inside src/features/papplu/engine.');
      expect(readdirSync(outside)).toEqual([]);
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  });

  test('evaluation and deadwood return the public snake_case witnesses', () => {
    const hand = toCounts(cards([0, 1, 2, 12]));
    const counted = Array(52).fill(0);
    counted[12] = 1;

    expect(evaluateHand(hand, 7, { cardsInHand: 4, requiredSequences: 1 })).toEqual({
      is_valid: false, melds: [],
    });
    expect(minimumPenalty(hand, 7, { requiredSequences: 1 })).toEqual({
      points: 10,
      exempt_melds: [{
        kind: 'sequence',
        cards: [0, 1, 2],
        represented_cards: [0, 1, 2],
        is_pure: true,
      }],
      counted_cards: counted,
      qualifying_sequences: 1,
    });
  });

  test('a valid hand still requires a committed declaration to win', () => {
    const drawn = drawCard(sequenceGame(), 'stock');
    const discarded = discardCard(drawn, 103);
    expect(evaluateHand(toCounts(discarded.players[0].hand), 7, {
      cardsInHand: 3, requiredSequences: 1,
    }).is_valid).toBe(true);
    expect(discarded).toMatchObject({ phase: 'draw', currentPlayer: 1, winnerIndex: null });

    const pending = beginDeclaration(drawn, 103);
    expect(pending).toMatchObject({ phase: 'declaring', winnerIndex: null });
    expect(observe(pending, 1).declarations).toEqual([{ ownerIndex: 0, verdict: 'pending' }]);
    expect(resolveDeclaration(pending, true)).toMatchObject({
      phase: 'finished', winnerIndex: 0, outcomeReason: 'valid-declaration',
    });
  });

  test('an invalid declaration eliminates the player and adds 80 to the existing scoreboard', () => {
    const game = sequenceGame();
    game.players[0].hand = cards([0, 4, 9]);
    game.players[0].penaltyPoints = 160;
    const pending = beginDeclaration(drawCard(game, 'stock'), 103);
    const evaluation = evaluateHand(toCounts(pending.players[0].hand), 7, {
      cardsInHand: 3, requiredSequences: 1,
    });
    expect(evaluation).toEqual({ is_valid: false, melds: [] });
    const finished = resolveDeclaration(pending, evaluation.is_valid);
    expect(finished).toMatchObject({
      phase: 'finished', winnerIndex: 1, outcomeReason: 'last-remaining',
      players: [
        { active: false, roundPenalty: 80, penaltyPoints: 240 },
        { active: true, roundPenalty: 0, penaltyPoints: 0 },
      ],
    });
  });

  test.each([true, false])('stock recycling=%s keeps the top discard and every physical card', (recycleDiscard) => {
    let game = createGame({
      players: 1, decks: 1, cardsInHand: 3, requiredSequences: 1, recycleDiscard,
    }, () => 0.5);
    let lastId;
    for (let turn = 0; turn < 47; turn += 1) {
      game = drawCard(game, 'stock');
      lastId = game.drawnCardId;
      game = discardCard(game, lastId, () => 0.5);
    }
    expect(game).toMatchObject({ phase: 'draw', turn: 48 });
    expect(game.stock).toHaveLength(recycleDiscard ? 47 : 0);
    expect(game.discard).toHaveLength(recycleDiscard ? 1 : 48);
    expect(game.discard.at(-1).id).toBe(lastId);
    expect(new Set([
      ...game.players[0].hand, ...game.stock, ...game.discard, game.joker,
    ].map((card) => card.id)).size).toBe(52);
    if (!recycleDiscard) expect(() => drawCard(game, 'stock')).toThrow('stock is empty');
  });

  test('neural play loads the shipped model while unsupported rules report a tactical downgrade', async () => {
    const json = JSON.parse(readFileSync(new URL('./engine/papplu-model.json', import.meta.url), 'utf8'));
    const engine = createLocalEngine({ model: parseQModel(json) });
    try {
      const game = createGame({ recycleDiscard: true }, () => 0.5);
      expect(await engine.chooseMove(observe(game, 0), 'neural', 42)).toEqual({
        move: { type: 'draw', source: 'stock' },
        tier: 'neural',
        downgrade: null,
        reason: 'draw-lookahead',
      });
      const otherRules = createGame({ cardsInHand: 3, requiredSequences: 1 }, () => 0.5);
      expect(await engine.chooseMove(observe(otherRules, 0), 'neural', 42)).toMatchObject({
        tier: 'tactical', downgrade: 'rules-mismatch', move: { type: 'draw' },
      });
    } finally {
      engine.dispose();
    }
    await expect(engine.evaluate(Array(52).fill(0), {
      joker: 7, cardsInHand: 3, requiredSequences: 1,
    })).rejects.toMatchObject({ name: 'EngineDisposed' });
  });
});

describe('the shared table controller', () => {
  test('pass-and-play snapshots cover all hands between turns and reject stale actions', () => {
    const table = createTable({ engineFactory: createLocalEngine, random: () => 0.5 });
    table.start();
    try {
      table.dispatch({ type: 'preset', name: 'pass-and-play' });
      table.dispatch({ type: 'configure', patch: { cardsInHand: 3, requiredSequences: 1 } });
      table.dispatch({ type: 'deal' });
      let round = table.getSnapshot().round;
      expect(round.viewer).toEqual({ mode: 'cover', seat: 0 });
      expect(round.seats.map((seat) => seat.hand)).toEqual([null, null]);
      table.dispatch({ type: 'reveal', stamp: round.stamp });
      round = table.getSnapshot().round;
      expect(round.viewer).toEqual({ mode: 'hand', seat: 0 });
      expect(round.seats[0].hand).toHaveLength(3);
      expect(round.seats[1].hand).toBeNull();
      const previousStamp = round.stamp;
      table.dispatch({ type: 'draw', source: 'stock', stamp: round.stamp });
      round = table.getSnapshot().round;
      table.dispatch({ type: 'discard', cardId: round.seats[0].drawnCardId, stamp: round.stamp });
      round = table.getSnapshot().round;
      expect(round).toMatchObject({ phase: 'draw', turn: 2, currentSeat: 1, canAct: false });
      expect(round.viewer).toEqual({ mode: 'cover', seat: 1 });
      expect(round.seats.map((seat) => seat.hand)).toEqual([null, null]);
      table.dispatch({ type: 'reveal', stamp: previousStamp });
      expect(table.getSnapshot().round.viewer).toEqual({ mode: 'cover', seat: 1 });
    } finally {
      table.stop();
    }
  });

  test('the completed round reports both players and keeps deadwood separate from declaration penalties', async () => {
    const table = createTable({ engineFactory: createLocalEngine, random: () => 0.5 });
    table.start();
    try {
      table.dispatch({ type: 'preset', name: 'pass-and-play' });
      table.dispatch({ type: 'configure', patch: { cardsInHand: 3, requiredSequences: 2 } });
      table.dispatch({ type: 'deal' });
      table.dispatch({ type: 'reveal', stamp: table.getSnapshot().round.stamp });
      table.dispatch({ type: 'draw', source: 'stock', stamp: table.getSnapshot().round.stamp });
      const round = table.getSnapshot().round;
      table.dispatch({
        type: 'declare', cardId: round.seats[0].drawnCardId, stamp: round.stamp,
      });
      await vi.waitFor(() => expect(table.getSnapshot().round.summary.status).toBe('ready'));
      const finished = table.getSnapshot().round;
      expect(finished.outcome).toEqual({ reason: 'last-remaining', winner: 1 });
      expect(finished.summary.rows.map((row) => ({
        name: row.name, roundPenalty: row.roundPenalty, penaltyPoints: row.penaltyPoints,
      }))).toEqual([
        { name: 'Player 1', roundPenalty: 80, penaltyPoints: 80 },
        { name: 'Player 2', roundPenalty: 0, penaltyPoints: 0 },
      ]);
      expect(finished.summary.rows.map((row) => row.faces.length)).toEqual([3, 3]);
      expect(finished.summary.rows.map((row) => row.penalty.counted_cards.length)).toEqual([52, 52]);
    } finally {
      table.stop();
    }
  });
});
