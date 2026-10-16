import { Link } from 'react-router-dom';
import { images } from '../../data/images.js';

export function TrainerControls({ options, onChange, onManageCharts }) {
  return (
    <div className="trainer-controls">
      <nav className="poker-nav" aria-label="Trainer controls">
        <Link className="home-btn" to="/" aria-label="Maxx Tandon home">
          <img src={images.logo} className="home-btn-img" alt="Maxx Tandon logo" />
        </Link>
        <div className="trainer-options" role="group" aria-label="Training options">
          <div className="trainer-option">
            <input type="checkbox" id="pause-check" checked={options.slow}
              onChange={event => onChange({ ...options, slow: event.target.checked })} />
            <label htmlFor="pause-check" title="Fold through until hero's action with pauses.">
              Slow Mode
            </label>
          </div>
          <div className="trainer-option">
            <input type="checkbox" id="rfi-check" checked={options.mode === 'rfi'}
              onChange={event => onChange({ ...options, mode: event.target.checked ? 'rfi' : 'all' })} />
            <label htmlFor="rfi-check" title="Generate only raise-first-in spots.">
              RFI Only
            </label>
          </div>
          <div className="trainer-option">
            <input type="checkbox" id="threebet-check" checked={options.mode === 'three-bet'}
              onChange={event => onChange({ ...options, mode: event.target.checked ? 'three-bet' : 'all' })} />
            <label htmlFor="threebet-check" title="Generate only three-bet spots.">
              3B Only
            </label>
          </div>
          <div className="trainer-option">
            <input type="checkbox" id="rng-check" checked={options.inverted}
              onChange={event => onChange({ ...options, inverted: event.target.checked })} />
            <label htmlFor="rng-check" title="Use low RNG numbers for raises instead of high RNG numbers.">
              Invert RNG
            </label>
          </div>
        </div>
        <button onClick={onManageCharts} className="charts-btn btn">
          Manage Charts <i className="bi bi-gear" aria-hidden="true"></i>
        </button>
      </nav>
    </div>
  );
}
