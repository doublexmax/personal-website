import { useState } from 'react';
import { handGrid } from './hands.js';
import { positions, rangeKey } from './positions.js';
import { frequenciesFor } from './ranges.js';

export function RangeEditor({ open, ranges, error, onEdit, onClose }) {
  const [opener, setOpener] = useState('utg');
  const [position, setPosition] = useState('');
  const [frequencies, setFrequencies] = useState({ callPercent: 0, raisePercent: 100 });
  const name = rangeKey(position || opener, position ? opener : undefined);

  function changeFrequency(field, value) {
    const other = field === 'callPercent' ? 'raisePercent' : 'callPercent';
    setFrequencies(current => ({
      [field]: value, [other]: Math.min(current[other], 100 - value),
    }));
  }

  return (
    <div id="popupBackground" style={{ display: open ? 'flex' : 'none' }}>
      <div id="popup" role="dialog" aria-modal="true" aria-labelledby="chart-title">
        <h2 id="chart-title">Chart - {position ? `${position.toUpperCase()} Against ${opener.toUpperCase()}` : opener.toUpperCase()}</h2>
        {error && <p role="alert" className="trainer-error">{error}</p>}
        <div className="container mt-3" id="select-position">
          <label htmlFor="positionRFISelect" className="form-label mr-2">Select RFI:</label>
          <select id="positionRFISelect" className="form-select" value={opener}
            onChange={event => { setOpener(event.target.value); setPosition(''); }}>
            {positions.map(value => <option key={value} value={value}>{value.toUpperCase()}</option>)}
          </select>
          <div>
            <label htmlFor="position3bSelect" className="form-label mr-2">Select 3B:</label>
            <select id="position3bSelect" className="form-select" value={position} onChange={event => setPosition(event.target.value)}>
              <option value="">-----</option>
              {positions.slice(positions.indexOf(opener) + 1).map(value =>
                <option key={value} value={value}>{value.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="mt-3"></div>
          <div className="slide-container">
            <input type="range" min="0" max="100" className="slider" id="call-range" aria-label="Call Percent"
              value={frequencies.callPercent} onChange={event => changeFrequency('callPercent', Number(event.target.value))} />
            <input type="range" min="0" max="100" className="slider" id="raise-range" aria-label="Raise Percent"
              value={frequencies.raisePercent} onChange={event => changeFrequency('raisePercent', Number(event.target.value))} />
          </div>
          <br />
          <div className="slide-container-result">
            <p className="slide-result">Call Percent: {frequencies.callPercent}</p>
            <p className="slide-result">Raise Percent: {frequencies.raisePercent}</p>
          </div>
        </div>
        {ranges && <div className="range-chart">
          <table className="poker-range-grid" id={name}>
            <tbody>
              {handGrid.map((row, index) => (
                <tr key={index}>
                  {row.map(hand => {
                    const { callPercent, raisePercent } = frequenciesFor(ranges[name], hand);
                    return (
                      <td key={hand} tabIndex={0} onClick={() => onEdit(name, hand, frequencies)}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            onEdit(name, hand, frequencies);
                          }
                        }}
                        style={{ background: `linear-gradient(90deg, red ${raisePercent}%, #23a607 ${raisePercent}% ${callPercent + raisePercent}%, aqua ${callPercent + raisePercent}% 100%)` }}>
                        {hand}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
        <button id="closeBtn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
