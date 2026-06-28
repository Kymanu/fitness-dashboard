import { useState } from 'react';
import { uid } from '../utils/helpers';

export default function DaySheet({ day, onSave, onDelete, onClose }) {
  const [name, setName] = useState(day?.name || '');
  const [type, setType] = useState(day?.type || 'Push');
  const types = ['Push', 'Pull', 'Legs', 'Rest', 'Custom'];

  return (
    <div className="sheet-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-title">{day ? 'Edit day' : 'Add day'}</div>
        <div className="field-label">Day name</div>
        <input className="field-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Monday" />
        <div className="field-label">Type</div>
        <div className="type-grid">
          {types.map(t => (
            <button key={t} className={`type-opt ${type === t ? 'sel' : ''}`} onClick={() => setType(t)}>{t}</button>
          ))}
        </div>
        <button className="sheet-save" onClick={() => { if (name.trim()) onSave({ id: day?.id || uid(), name: name.trim(), type, exercises: day?.exercises || [] }); }}>Save</button>
        {day && <button className="sheet-delete" onClick={() => onDelete(day.id)}>Remove day</button>}
      </div>
    </div>
  );
}
