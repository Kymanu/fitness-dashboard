import { DAYS_OF_WEEK } from '../data/program';
import { getTodayIdx, typeTag } from '../utils/helpers';

export default function TodayTab({ program, onStart }) {
  const todayIdx = getTodayIdx();
  const today = program[todayIdx] || program[0];

  return (
    <div className="content">
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
              <div className="ex-preview" style={{ marginTop: 8 }}>Rest day — recovery is training too.</div>
            )}
          </div>
        </div>
      )}

      <div className="section-title">Week ahead</div>
      {program.slice(0, 7).map((day, i) => (
        <div key={day.id} style={{ margin: '0 16px 8px' }}>
          <div
            className="card card-padded"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              opacity: i === todayIdx ? 1 : i < todayIdx ? 0.55 : 0.85,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-3)' }}>
                {DAYS_OF_WEEK[i]}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{day.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                  {day.exercises.length > 0 ? `${day.exercises.length} exercises` : 'Rest'}
                </div>
              </div>
            </div>
            <span className={`day-tag ${typeTag(day.type)}`}>{day.type}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
