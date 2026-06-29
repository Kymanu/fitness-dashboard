import { useState } from 'react';
import { uid } from '../utils/helpers';

export default function ExerciseSheet({ ex, onSave, onDelete, onClose }) {
  const [name, setName] = useState(ex?.name || '');
  const [sets, setSets] = useState(ex?.sets || 3);
  const [reps, setReps] = useState(ex?.reps || '8–10');
  const [lastWeight, setLastWeight] = useState(ex?.lastWeight || 0);

  return (
    <div className="sheet-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-title">{ex ? 'Edit exercise' : 'Add exercise'}</div>
        <div className="field-label">Exercise name</div>
        <input className="field-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. BB Bench Press" />
        <div className="field-row">
          <div>
            <div className="field-label">Sets</div>
            <input className="field-input" type="number" value={sets} onChange={e => setSets(Number(e.target.value))} />
          </div>
          <div>
            <div className="field-label">Reps</div>
            <input className="field-input" value={reps} onChange={e => setReps(e.target.value)} placeholder="8–10" />
          </div>
        </div>
        <div className="field-label">Last weight (lbs)</div>
        <input className="field-input" type="number" value={lastWeight} onChange={e => setLastWeight(Number(e.target.value) || 0)} />
        <button className="sheet-save" onClick={() => { if (name.trim()) onSave({ id: ex?.id || uid(), name: name.trim(), sets, reps, lastWeight }); }}>Save</button>
        {ex && <button className="sheet-delete" onClick={() => onDelete(ex.id)}>Remove exercise</button>}
      </div>
    </div>
  );
}
