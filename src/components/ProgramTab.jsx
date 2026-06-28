import { useState } from 'react';
import { TEMPLATE_TYPES } from '../data/program';
import { typeTag } from '../utils/helpers';
import ExerciseSheet from './ExerciseSheet';
import ExercisePickerSheet from './ExercisePickerSheet';

const TYPE_LABEL = { Push: 'tag-push', Pull: 'tag-pull', Legs: 'tag-legs' };

export default function ProgramTab({ program, setProgram }) {
  const [editEx,    setEditEx]    = useState(null); // { type, ex }
  const [addExType, setAddExType] = useState(null); // template key string

  const saveEx = (type, ex) => {
    setProgram(p => ({ ...p, [type]: { exercises: p[type].exercises.map(e => e.id === ex.id ? ex : e) } }));
    setEditEx(null);
  };

  const deleteEx = (type, exId) => {
    setProgram(p => ({ ...p, [type]: { exercises: p[type].exercises.filter(e => e.id !== exId) } }));
    setEditEx(null);
  };

  const addEx = (type, ex) => {
    setProgram(p => ({ ...p, [type]: { exercises: [...p[type].exercises, ex] } }));
  };

  const moveEx = (type, exId, dir) => {
    setProgram(p => {
      const exs = [...p[type].exercises];
      const i = exs.findIndex(e => e.id === exId);
      const j = i + dir;
      if (j < 0 || j >= exs.length) return p;
      [exs[i], exs[j]] = [exs[j], exs[i]];
      return { ...p, [type]: { exercises: exs } };
    });
  };

  return (
    <div className="content">
      {TEMPLATE_TYPES.map(type => (
        <div key={type}>
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{type}</span>
            <span className={`day-tag ${TYPE_LABEL[type]}`}>{program[type].exercises.length} exercises</span>
          </div>

          <div className="program-day" style={{ margin: '0 16px' }}>
            {program[type].exercises.length === 0 && (
              <div className="prog-exercises" style={{ borderTop: 'none' }}>
                <div style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '12px 0' }}>
                  No exercises yet
                </div>
              </div>
            )}

            {program[type].exercises.length > 0 && (
              <div className="prog-exercises" style={{ borderTop: 'none' }}>
                {program[type].exercises.map((ex, i) => {
                  const isFirst = i === 0;
                  const isLast  = i === program[type].exercises.length - 1;
                  return (
                    <div key={ex.id} className="prog-ex-row">
                      <button
                        style={{ flex: 1, textAlign: 'left', padding: '2px 0' }}
                        onClick={() => setEditEx({ type, ex })}
                      >
                        <div className="prog-ex-name">{ex.name}</div>
                        <div className="prog-ex-scheme">
                          {ex.sets}×{ex.reps}
                          {ex.lastWeight ? <span style={{ color: 'var(--text-3)', marginLeft: 6 }}>{ex.lastWeight} lbs</span> : null}
                        </div>
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                        <button
                          className="reorder-btn"
                          disabled={isFirst}
                          onClick={() => moveEx(type, ex.id, -1)}
                        >↑</button>
                        <button
                          className="reorder-btn"
                          disabled={isLast}
                          onClick={() => moveEx(type, ex.id, 1)}
                        >↓</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ padding: '0 0 4px' }}>
              <button className="add-ex-btn" onClick={() => setAddExType(type)}>+ Add exercise</button>
            </div>
          </div>
        </div>
      ))}

      <div style={{ height: 20 }} />

      {editEx && (
        <ExerciseSheet
          ex={editEx.ex}
          onSave={ex => saveEx(editEx.type, ex)}
          onDelete={id => deleteEx(editEx.type, id)}
          onClose={() => setEditEx(null)}
        />
      )}
      {addExType && (
        <ExercisePickerSheet
          templateName={addExType}
          onAdd={ex => addEx(addExType, ex)}
          onClose={() => setAddExType(null)}
        />
      )}
    </div>
  );
}
