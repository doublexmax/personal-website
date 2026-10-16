import { positions } from './positions.js';

export function PokerTable({ session, onAnswer }) {
  const { phase, round, step, result } = session;
  const ready = phase === 'awaiting-answer' || phase === 'answered';
  let details = 'Use Manage Charts to set your ranges, or run a sim with the default ranges.';
  if (phase === 'dealing') details = step < 0 ? 'Run the next sim.' : 'Running sim.';
  if (ready) {
    const facing = round.history.length ? ` facing an open from the ${round.history[0].toUpperCase()}` : '';
    details = `You are the ${round.heroPosition.toUpperCase()} with ${round.hand}${facing}. RNG: ${round.rng}`;
  }
  if (result) {
    details = result.correct ? 'Correct!' :
      `Incorrect. Correct answer was to ${result.answer}! Call ${round.frequencies.callPercent}%. Raise ${round.frequencies.raisePercent}% `;
  }

  return (
    <div className="table-container">
      <div className="poker-table-surface">
        {positions.map((position, index) => {
          const revealed = round && index <= step;
          const opener = round?.history.includes(position);
          const hero = round?.heroPosition === position;
          return (
            <div key={position} className={`seat ${position}${revealed && !opener && !hero ? ' folded' : ''}`}>
              {position.toUpperCase()}
              <div className={`chips ${position}`}>{revealed && (opener ? 'OPEN' : hero ? 'RAISE' : '')}</div>
            </div>
          );
        })}
        <div className="table-round">
          <p className={`sim-details${result ? result.correct ? ' answer-correct' : ' answer-incorrect' : ''}`} role="status">{details}</p>
          <div className="simulation" style={{ display: ready ? 'flex' : 'none' }}>
            <div className="card-display">
              <div className="poker-card" id="card1" style={{ backgroundColor: round?.colors[0] }}>{round?.hand[0]}</div>
              <div className="poker-card" id="card2" style={{ backgroundColor: round?.colors[1] }}>{round?.hand[1]}</div>
            </div>
          </div>
          <div className="sim-buttons" style={{ display: ready ? 'flex' : 'none' }}>
            <button className="sim-button btn btn-info" disabled={phase !== 'awaiting-answer'} onClick={() => onAnswer('fold')}>Fold</button>
            <button className="sim-button btn btn-success" disabled={phase !== 'awaiting-answer'} onClick={() => onAnswer('call')}>Call</button>
            <button className="sim-button btn btn-danger" disabled={phase !== 'awaiting-answer'} onClick={() => onAnswer('raise')}>Raise</button>
          </div>
        </div>
      </div>
    </div>
  );
}
