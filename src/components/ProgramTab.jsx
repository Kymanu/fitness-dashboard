import { useState, useRef, useEffect } from 'react';
import { TEMPLATE_TYPES } from '../data/program';
import ExerciseSheet from './ExerciseSheet';
import ExercisePickerSheet from './ExercisePickerSheet';

const TYPE_LABEL = { Push: 'tag-push', Pull: 'tag-pull', Legs: 'tag-legs' };
const ROW_H = 52;

function SwipeRow({ onDelete, children }) {
  const REVEAL = 72;
  const [offset,   setOffset]   = useState(0);
  const [dragging, setDragging] = useState(false);
  const revealed = useRef(false);
  const touch    = useRef(null);

  const onTouchStart = (e) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, axis: null };
  };

  const onTouchMove = (e) => {
    if (!touch.current) return;
    const dx = e.touches[0].clientX - touch.current.x;
    const dy = e.touches[0].clientY - touch.current.y;
    if (!touch.current.axis) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      touch.current.axis = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
    }
    if (touch.current.axis !== 'h') return;
    e.preventDefault();
    setDragging(true);
    const base = revealed.current ? -REVEAL : 0;
    setOffset(Math.max(-REVEAL, Math.min(0, base + dx)));
  };

  const onTouchEnd = () => {
    if (!touch.current) return;
    const wasH = touch.current.axis === 'h';
    touch.current = null;
    setDragging(false);
    if (!wasH) return;
    const snap = offset < -REVEAL / 2;
    revealed.current = snap;
    setOffset(snap ? -REVEAL : 0);
  };

  const handleDelete = () => {
    revealed.current = false;
    setOffset(0);
    onDelete();
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: REVEAL,
        background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <button
          onClick={handleDelete}
          style={{ color: '#fff', fontWeight: 700, fontSize: 13, width: '100%', height: '100%' }}
        >
          Delete
        </button>
      </div>
      <div
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? 'none' : 'transform 0.2s ease',
          background: 'var(--surface)',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

export default function ProgramTab({ program, setProgram }) {
  const [editEx,     setEditEx]     = useState(null);
  const [addExType,  setAddExType]  = useState(null);
  const [editModes,  setEditModes]  = useState({});
  const [drag,       setDrag]       = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef    = useRef(null);
  const programRef = useRef(program);
  useEffect(() => { programRef.current = program; }, [program]);

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e) => {
      if (!dragRef.current) return;
      e.preventDefault();
      const deltaY = e.touches[0].clientY - dragRef.current.startY;
      const exLen  = programRef.current[dragRef.current.type].exercises.length;
      const toIdx  = Math.max(0, Math.min(exLen - 1, dragRef.current.fromIdx + Math.round(deltaY / ROW_H)));
      dragRef.current = { ...dragRef.current, toIdx, deltaY };
      setDrag({ ...dragRef.current });
    };

    const onEnd = () => {
      if (!dragRef.current) return;
      const { type, fromIdx, toIdx } = dragRef.current;
      if (fromIdx !== toIdx) {
        setProgram(p => {
          const exs = [...p[type].exercises];
          const [item] = exs.splice(fromIdx, 1);
          exs.splice(toIdx, 0, item);
          return { ...p, [type]: { exercises: exs } };
        });
      }
      dragRef.current = null;
      setDrag(null);
      setIsDragging(false);
    };

    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    return () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
  }, [isDragging, setProgram]);

  const toggleEdit = (type) => setEditModes(m => ({ ...m, [type]: !m[type] }));

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

  const startDrag = (e, type, exId, idx) => {
    e.preventDefault();
    dragRef.current = { type, exId, startY: e.touches[0].clientY, fromIdx: idx, toIdx: idx, deltaY: 0 };
    setDrag({ ...dragRef.current });
    setIsDragging(true);
  };

  const rowStyle = (type, idx) => {
    if (!drag || drag.type !== type) return {};
    if (idx === drag.fromIdx) {
      return {
        transform: `translateY(${drag.deltaY}px)`,
        transition: 'none',
        zIndex: 20,
        opacity: 0.95,
        position: 'relative',
        boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
        borderRadius: 8,
      };
    }
    const dir     = Math.sign(drag.toIdx - drag.fromIdx);
    const inRange = dir > 0
      ? idx > drag.fromIdx && idx <= drag.toIdx
      : idx < drag.fromIdx && idx >= drag.toIdx;
    return inRange ? { transform: `translateY(${-dir * ROW_H}px)`, transition: 'transform 0.15s ease' } : {};
  };

  return (
    <div className="content">
      {TEMPLATE_TYPES.map(type => {
        const isEditing = !!editModes[type];
        return (
          <div key={type}>
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{type}</span>
                <span className={`day-tag ${TYPE_LABEL[type]}`}>{program[type].exercises.length} exercises</span>
              </div>
              <button
                onClick={() => toggleEdit(type)}
                style={{
                  fontSize: 13, fontWeight: 600,
                  color: isEditing ? 'var(--red)' : 'var(--accent)',
                  padding: '3px 10px',
                  background: isEditing ? 'var(--red-bg)' : 'var(--accent-bg)',
                  borderRadius: 6,
                }}
              >
                {isEditing ? 'Done' : 'Edit'}
              </button>
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
                  {program[type].exercises.map((ex, i) => (
                    <div key={ex.id} style={rowStyle(type, i)}>
                      {isEditing ? (
                        <div className="prog-ex-row">
                          <button
                            className="edit-minus-btn"
                            onClick={() => deleteEx(type, ex.id)}
                          >
                            −
                          </button>
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
                          <div
                            className="drag-handle"
                            onTouchStart={(e) => startDrag(e, type, ex.id, i)}
                          >
                            ☰
                          </div>
                        </div>
                      ) : (
                        <SwipeRow onDelete={() => deleteEx(type, ex.id)}>
                          <div className="prog-ex-row">
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
                          </div>
                        </SwipeRow>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ padding: '0 0 4px' }}>
                <button className="add-ex-btn" onClick={() => setAddExType(type)}>+ Add exercise</button>
              </div>
            </div>
          </div>
        );
      })}

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
