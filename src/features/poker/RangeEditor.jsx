import { useEffect, useRef, useState } from 'react';
import { handGrid } from './hands.js';
import { positions, rangeKey } from './positions.js';
import { frequenciesFor } from './ranges.js';

export function RangeEditor({ open, ranges, error, onEdit, onClose }) {
  const [opener, setOpener] = useState('utg');
  const [position, setPosition] = useState('');
  const [frequencies, setFrequencies] = useState({ callPercent: 0, raisePercent: 100 });
  const popupRef = useRef(null);
  const name = rangeKey(position || opener, position ? opener : undefined);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    popupRef.current.querySelector('#closeBtn').focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus.focus();
    };
  }, [open]);

  function handleDialogKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const controls = event.currentTarget.querySelectorAll(
      'button:not(:disabled), select:not(:disabled), input:not(:disabled), [tabindex="0"]',
    );
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function changeFrequency(field, value) {
    const other = field === 'callPercent' ? 'raisePercent' : 'callPercent';
    setFrequencies(current => ({
      [field]: value, [other]: Math.min(current[other], 100 - value),
    }));
  }

  return (
    <div id="popupBackground" style={{ display: open ? 'flex' : 'none' }}>
      <div id="popup" ref={popupRef} role="dialog" aria-modal="true" aria-labelledby="chart-title"
        aria-describedby="chart-instructions" onKeyDown={handleDialogKeyDown}>
        <div className="range-editor-header">
          <h2 id="chart-title">Chart - {position ? `${position.toUpperCase()} Against ${opener.toUpperCase()}` : opener.toUpperCase()}</h2>
          <button id="closeBtn" className="btn chart-close" onClick={onClose}>Close</button>
        </div>
        <div className="range-editor-body">
          {error && <p role="alert" className="trainer-error">{error}</p>}
          <div className="range-settings" id="select-position">
            <div className="range-setting">
              <label htmlFor="positionRFISelect">Select RFI:</label>
              <select id="positionRFISelect" value={opener}
                onChange={event => { setOpener(event.target.value); setPosition(''); }}>
                {positions.map(value => <option key={value} value={value}>{value.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="range-setting">
              <label htmlFor="position3bSelect">Select 3B:</label>
              <select id="position3bSelect" value={position} onChange={event => setPosition(event.target.value)}>
                <option value="">-----</option>
                {positions.slice(positions.indexOf(opener) + 1).map(value =>
                  <option key={value} value={value}>{value.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="range-setting">
              <label className="slide-result" htmlFor="call-range">Call Percent: {frequencies.callPercent}%</label>
              <input type="range" min="0" max="100" className="slider" id="call-range" aria-label="Call Percent"
                value={frequencies.callPercent} onChange={event => changeFrequency('callPercent', Number(event.target.value))} />
            </div>
            <div className="range-setting">
              <label className="slide-result" htmlFor="raise-range">Raise Percent: {frequencies.raisePercent}%</label>
              <input type="range" min="0" max="100" className="slider" id="raise-range" aria-label="Raise Percent"
                value={frequencies.raisePercent} onChange={event => changeFrequency('raisePercent', Number(event.target.value))} />
            </div>
          </div>
          <p id="chart-instructions">Select a hand to apply these percentages. Use Enter or Space with the keyboard.</p>
          <div className="range-legend" aria-label="Frequency colors">
            <span><i className="legend-raise" aria-hidden="true"></i>Raise</span>
            <span><i className="legend-call" aria-hidden="true"></i>Call</span>
            <span><i className="legend-fold" aria-hidden="true"></i>Fold</span>
          </div>
          <p className="chart-scroll-hint" id="chart-scroll-hint">Scroll sideways to see all hands.</p>
          {ranges && <div className="range-chart" role="region" aria-label="Starting hand chart" tabIndex={0}>
            <table className="poker-range-grid" id={name} aria-labelledby="chart-title">
              <tbody>
                {handGrid.map((row, index) => (
                  <tr key={index}>
                    {row.map(hand => {
                      const { callPercent, raisePercent } = frequenciesFor(ranges[name], hand);
                      return (
                        <td key={hand} tabIndex={0}
                          aria-label={`${hand}, raise ${raisePercent}%, call ${callPercent}%, fold ${100 - callPercent - raisePercent}%`}
                          onClick={() => onEdit(name, hand, frequencies)}
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
        </div>
      </div>
    </div>
  );
}
