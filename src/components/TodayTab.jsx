import { useState } from 'react';
import { DAYS_OF_WEEK } from '../data/program';
import { getTodayIdx, typeTag } from '../utils/helpers';

function DayPreviewSheet({ day, onStart, onClose }) {
  const isRest = day.exercises.length === 0;

  const startCustom = () =>
    onStart({ ...day, type: 'Custom', exercises: [] });

  return (
    <div className="sheet-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet">
        <div className="sheet-handle" />

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px' }}>{day.name}</span>
          <span className={`day-tag ${typeTag(day.type)}`}>{day.type}</span>
        </div>

        {!isRest ? (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '14px 0 2px' }}>
              {day.exercises.length} exercises
            </div>
            <div style={{ marginBottom: 4 }}>
              {day.exercises.map(ex => (
                <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{ex.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-2)', flexShrink: 0, marginLeft: 12 }}>
                    {ex.sets}×{ex.reps}
                    {ex.lastWeight ? <span style={{ color: 'var(--text-3)', marginLeft: 6 }}>{ex.lastWeight} lbs</span> : null}
                  </span>
                </div>
              ))}
            </div>
            <button className="start-btn" style={{ marginTop: 16 }} onClick={() => onStart(day)}>
              Start session →
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 14, color: 'var(--text-2)', margin: '12px 0 20px', lineHeight: 1.6 }}>
              This is a scheduled rest day. Recovery is part of the program — but if you want to move, go for it.
            </div>
            <button className="start-btn" onClick={startCustom}>
              Start custom session →
            </button>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center', marginTop: 10 }}>
              Logs as a custom session · won't affect program schedule
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function TodayTab({ program, onStart }) {
  const todayIdx = getTodayIdx();
  const today = program[todayIdx] || program[0];
  const [previewDay, setPreviewDay] = useState(null);

  const startCustom = (day) =>
    onStart({ ...day, type: 'Custom', exercises: [] });

  return (
    <div className="content">
      {previewDay && (
        <DayPreviewSheet
          day={previewDay}
          onStart={(d) => { setPreviewDay(null); onStart(d); }}
          onClose={() => setPreviewDay(null)}
        />
      )}

      <div style={{ padding: '16px 16px 4px' }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px' }}>Today</div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {today && (
        <div style={{ margin: '12px 16px' }}>
          <div className={`day-card ${today.type !== 'Rest' ? 'active-day' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="day-name">{today.name}</span>
              <span className={`day-tag ${typeTag(today.type)}`}>{today.type}</span>
            </div>
            {today.exercises.length > 0 ? (
              <>
                <div className="ex-preview">
                  {today.exercises.slice(0, 3).map(e => e.name).join(' · ')}
                  {today.exercises.length > 3 ? ` +${today.exercises.length - 3} more` : ''}
                </div>
                <button className="start-btn" onClick={() => onStart(today)}>Start session →</button>
              </>
            ) : (
              <>
                <div className="ex-preview" style={{ marginTop: 8 }}>Rest day — recovery is training too.</div>
                <button
                  className="start-btn"
                  style={{ marginTop: 12, background: 'var(--surface3)', color: 'var(--text)', border: '1px solid var(--border-strong)' }}
                  onClick={() => startCustom(today)}
                >
                  Start custom session →
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="section-title">Week ahead</div>
      {program.slice(0, 7).map((day, i) => {
        const isToday = i === todayIdx;
        const isPast = i < todayIdx;
        return (
          <div key={day.id} style={{ margin: '0 16px 8px' }}>
            <div
              className="card card-padded"
              onClick={() => setPreviewDay(day)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                opacity: isToday ? 1 : isPast ? 0.55 : 0.85,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                transition: 'opacity 0.1s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: isToday ? 'var(--accent-bg)' : 'var(--surface2)',
                  border: isToday ? '1px solid var(--accent-border)' : '1px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  color: isToday ? 'var(--accent)' : 'var(--text-3)',
                  flexShrink: 0,
                }}>
                  {DAYS_OF_WEEK[i]}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{day.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                    {day.exercises.length > 0 ? `${day.exercises.length} exercises` : 'Rest'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`day-tag ${typeTag(day.type)}`}>{day.type}</span>
                <span style={{ fontSize: 18, color: 'var(--text-3)', lineHeight: 1 }}>›</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
