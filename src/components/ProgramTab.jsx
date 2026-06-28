import { useState } from 'react';
import { typeTag } from '../utils/helpers';
import ExerciseSheet from './ExerciseSheet';
import DaySheet from './DaySheet';

export default function ProgramTab({ program, setProgram }) {
  const [editDay, setEditDay] = useState(null);
  const [editEx, setEditEx] = useState(null);
  const [editExDay, setEditExDay] = useState(null);
  const [addExDay, setAddExDay] = useState(null);
  const [addDay, setAddDay] = useState(false);

  const saveDay = (d) => {
    setProgram(p => p.map(x => x.id === d.id ? { ...x, name: d.name, type: d.type } : x));
    setEditDay(null);
  };
  const deleteDay = (id) => { setProgram(p => p.filter(x => x.id !== id)); setEditDay(null); };
  const addNewDay = (d) => { setProgram(p => [...p, d]); setAddDay(false); };
  const saveEx = (dayId, ex) => {
    setProgram(p => p.map(d => d.id === dayId ? { ...d, exercises: d.exercises.map(e => e.id === ex.id ? ex : e) } : d));
    setEditEx(null); setEditExDay(null);
  };
  const deleteEx = (dayId, exId) => {
    setProgram(p => p.map(d => d.id === dayId ? { ...d, exercises: d.exercises.filter(e => e.id !== exId) } : d));
    setEditEx(null); setEditExDay(null);
  };
  const addEx = (dayId, ex) => {
    setProgram(p => p.map(d => d.id === dayId ? { ...d, exercises: [...d.exercises, ex] } : d));
    setAddExDay(null);
  };

  return (
    <div className="content">
      <div className="section-title">Your program</div>
      {program.map(day => (
        <div key={day.id} className="program-day">
          <div className="program-day-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="prog-day-name">{day.name}</span>
              <span className={`day-tag ${typeTag(day.type)}`}>{day.type}</span>
            </div>
            <button className="prog-edit-btn" onClick={() => setEditDay(day)}>Edit</button>
          </div>
          {day.exercises.length > 0 && (
            <div className="prog-exercises">
              {day.exercises.map(ex => (
                <div key={ex.id} className="prog-ex-row">
                  <span className="prog-ex-name">{ex.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="prog-ex-scheme">{ex.sets}×{ex.reps}</span>
                    <button style={{ fontSize: 13, color: 'var(--text-3)' }} onClick={() => { setEditEx(ex); setEditExDay(day.id); }}>✎</button>
                  </div>
                </div>
              ))}
              <button className="add-ex-btn" onClick={() => setAddExDay(day.id)}>+ Add exercise</button>
            </div>
          )}
          {day.exercises.length === 0 && day.type !== 'Rest' && (
            <div className="prog-exercises" style={{ borderTop: '1px solid var(--border)' }}>
              <button className="add-ex-btn" onClick={() => setAddExDay(day.id)}>+ Add exercise</button>
            </div>
          )}
        </div>
      ))}
      <button className="add-day-btn" onClick={() => setAddDay(true)}>+ Add day</button>

      {editDay && <DaySheet day={editDay} onSave={saveDay} onDelete={deleteDay} onClose={() => setEditDay(null)} />}
      {addDay && <DaySheet onSave={addNewDay} onClose={() => setAddDay(false)} />}
      {editEx && <ExerciseSheet ex={editEx} onSave={ex => saveEx(editExDay, ex)} onDelete={id => deleteEx(editExDay, id)} onClose={() => { setEditEx(null); setEditExDay(null); }} />}
      {addExDay && <ExerciseSheet onSave={ex => addEx(addExDay, ex)} onClose={() => setAddExDay(null)} />}
    </div>
  );
}
