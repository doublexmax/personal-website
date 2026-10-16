import { Link } from 'react-router-dom';
import { images } from '../../data/images.js';

export function TrainerControls({ options, onChange, onManageCharts }) {
  return (
    <div className="trainer-controls">
      <nav className="navbar nav-shell sticky-top poker-nav">
        <Link className="navbar-brand home-btn" to="/"><img src={images.logo} className="home-btn-img" alt="" /></Link>
        <div className="form-check">
          <input className="form-check-input" type="checkbox" id="pause-check" checked={options.slow}
            onChange={event => onChange({ ...options, slow: event.target.checked })} />
          <label className="form-check-label pause-label" htmlFor="pause-check">
            <p title="Fold through until hero's action with pauses.">Slow Mode</p>
          </label>
        </div>
        <div className="form-check">
          <input className="form-check-input" type="checkbox" id="rfi-check" checked={options.mode === 'rfi'}
            onChange={event => onChange({ ...options, mode: event.target.checked ? 'rfi' : 'all' })} />
          <label className="form-check-label rfi-label" htmlFor="rfi-check">
            <p title="Generate only raise-first-in spots.">RFI Only</p>
          </label>
        </div>
        <div className="form-check">
          <input className="form-check-input" type="checkbox" id="threebet-check" checked={options.mode === 'three-bet'}
            onChange={event => onChange({ ...options, mode: event.target.checked ? 'three-bet' : 'all' })} />
          <label className="form-check-label threebet-label" htmlFor="threebet-check">
            <p title="Generate only three-bet spots.">3B Only</p>
          </label>
        </div>
        <div className="form-check">
          <input className="form-check-input" type="checkbox" id="rng-check" checked={options.inverted}
            onChange={event => onChange({ ...options, inverted: event.target.checked })} />
          <label className="form-check-label rng-label" htmlFor="rng-check">
            <p title="Use low RNG numbers for raises instead of high RNG numbers.">Invert RNG</p>
          </label>
        </div>
        <div id="navbarNav">
          <ul className="navbar-nav">
            <li className="nav-item active">
              <button onClick={onManageCharts} className="nav-link charts-btn btn"> Manage Charts <i className="bi bi-gear"></i></button>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
}
