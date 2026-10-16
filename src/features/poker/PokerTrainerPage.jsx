import { useState } from 'react';
import { TrainerControls } from './TrainerControls.jsx';
import { RangeEditor } from './RangeEditor.jsx';
import { PokerTable } from './PokerTable.jsx';
import { useTrainer } from './useTrainer.js';
import './poker.css';

export default function PokerTrainerPage() {
  const [editorOpen, setEditorOpen] = useState(false);
  const trainer = useTrainer();

  return (
    <main className="poker-trainer">
      <TrainerControls options={trainer.options} onChange={trainer.setOptions}
        onManageCharts={() => setEditorOpen(open => !open)} />
      {trainer.error && !editorOpen && <p role="alert" className="trainer-error">{trainer.error}</p>}
      <RangeEditor open={editorOpen} ranges={trainer.ranges} error={trainer.error}
        onEdit={trainer.editRange} onClose={() => setEditorOpen(false)} />
      <div className="trainer-session-bar">
        <div>
          <h1 className="trainer-title">Pre-flop poker trainer</h1>
          <div className="sim-results" role="status">
            <span>Num Correct: {trainer.session.correct}</span>
            <span>Total Sims: {trainer.session.total}</span>
          </div>
        </div>
        <button onClick={trainer.start} disabled={!trainer.ranges || trainer.busy} className="btn btn-primary btn-run-simulation">
          Simulate
        </button>
      </div>
      <PokerTable session={trainer.session} onAnswer={trainer.answer} />
    </main>
  );
}
