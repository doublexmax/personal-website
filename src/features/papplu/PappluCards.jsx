import { cardBackSvg, cardFaceSvg } from './engine/cards.mjs';

export const SUITS = ['Spades', 'Hearts', 'Diamonds', 'Clubs'];
export const SUIT_SYMBOLS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King'];

export function faceName(face) {
  return `${RANKS[face % 13]} of ${SUITS[Math.floor(face / 13)]}`;
}

export function CardArt({ face = null }) {
  return <span className="papplu-card-art" aria-hidden="true"
    dangerouslySetInnerHTML={{ __html: face === null ? cardBackSvg() : cardFaceSvg(face) }} />;
}

function JokerBadge({ face, joker }) {
  if (joker === undefined || face % 13 !== joker % 13) return null;
  return <span className="papplu-joker-badge" aria-hidden="true">{face === joker ? 'exact' : 'wild'}</span>;
}

export function StaticCard({ face, joker }) {
  return (
    <span className="papplu-static-card" role="img" aria-label={faceName(face)}>
      <CardArt face={face} />
      <JokerBadge face={face} joker={joker} />
    </span>
  );
}

export function PlayingCard({ card, joker, selected = false, drawn = false, disabled = false, onSelect }) {
  return (
    <button type="button"
      className={`papplu-playing-card${selected ? ' is-selected' : ''}${drawn ? ' is-drawn' : ''}`}
      aria-label={`${faceName(card.face)}, card ${card.id}${drawn ? ', drawn card' : ''}`}
      aria-pressed={selected} disabled={disabled} onClick={onSelect}>
      <CardArt face={card.face} />
      <JokerBadge face={card.face} joker={joker} />
      {drawn && <span className="papplu-drawn-label" aria-hidden="true">drawn</span>}
    </button>
  );
}

export function FaceList({ faces, joker, label }) {
  return (
    <div className="papplu-face-list" role="group" aria-label={label}>
      {faces.map((face, index) => <StaticCard key={index} face={face} joker={joker} />)}
    </div>
  );
}

export function MeldList({ melds, joker }) {
  return (
    <div className="papplu-meld-list">
      {melds.map((meld, index) => (
        <div className="papplu-meld" key={index}>
          <p className="papplu-meld-label">
            {meld.kind === 'set' ? 'Set' : meld.is_pure ? 'Qualifying pure sequence' : 'Non-pure sequence'}
          </p>
          <FaceList faces={meld.cards} joker={joker} label={`Meld ${index + 1}`} />
          {meld.cards.map((face, position) => face !== meld.represented_cards[position] && (
            <p className="papplu-substitution" key={position}>
              {faceName(face)} represents {faceName(meld.represented_cards[position])}.
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

export function Evaluation({ evaluation, joker }) {
  return (
    <div className="papplu-evaluation">
      <p className={evaluation.is_valid ? 'papplu-success' : 'papplu-invalid'}>
        {evaluation.is_valid ? 'Valid hand' : 'Not a valid hand'}
      </p>
      {evaluation.is_valid
        ? <MeldList melds={evaluation.melds} joker={joker} />
        : <p>No complete grouping meets the required pure sequences.</p>}
    </div>
  );
}

export function PenaltyResult({ penalty, joker }) {
  const counted = penalty.counted_cards.flatMap((copies, face) => Array(copies).fill(face));
  return (
    <section className="papplu-penalty" aria-label="Minimum deadwood">
      <h4>Minimum deadwood <strong>{penalty.points} points</strong></h4>
      <p className="papplu-muted">
        {penalty.qualifying_sequences} qualifying pure sequences. False-declaration points are separate.
      </p>
      <h5>Exempt melds</h5>
      {penalty.exempt_melds.length
        ? <MeldList melds={penalty.exempt_melds} joker={joker} />
        : <p className="papplu-muted">No exempt melds.</p>}
      <h5>Counted deadwood cards</h5>
      {counted.length
        ? <FaceList faces={counted} joker={joker} label="Counted deadwood cards" />
        : <p className="papplu-muted">No counted cards.</p>}
    </section>
  );
}
