import { DAYS_OF_WEEK } from '../data/program';
import { getTodayIdx, typeTag, formatTime } from '../utils/helpers';

export default function ProgressTab({ history, prs }) {
  const todayIdx = getTodayIdx();
  const thisWeek = DAYS_OF_WEEK.map((d, i) => {
    const done = history.some(h => {
      const date = new Date(h.date);
      const dayDiff = Math.floor((Date.now() - date) / 86400000);
      const hDay = date.getDay() === 0 ? 6 : date.getDay() - 1;
      return dayDiff < 7 && hDay === i;
    });
    return { label: d, done, today: i === todayIdx };
  });

  const recent = [...history].reverse().slice(0, 10);
  const maxVol = Math.max(...history.map(h => h.totalSets || 0), 1);

  return (
    <div className="content">
      <div className="section-title">This week</div>
      <div className="week-streak">
        {thisWeek.map((d, i) => (
          <div key={i} className={`streak-dot ${d.today ? 'today' : d.done ? 'done' : 'empty'}`}>
            {d.label.slice(0, 1)}
          </div>
        ))}
      </div>

      <div className="section-title" style={{ marginTop: 8 }}>PRs</div>
      <div className="card" style={{ margin: '0 16px' }}>
        {Object.keys(prs).length === 0 && (
          <div style={{ padding: '16px', color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>
            Complete workouts to track PRs
          </div>
        )}
        {Object.entries(prs).map(([name, weight]) => (
          <div key={name} className="pr-row">
            <div className="pr-name">{name}</div>
            <div className="pr-val">{weight} lbs</div>
          </div>
        ))}
      </div>

      <div className="section-title" style={{ marginTop: 8 }}>History</div>
      <div className="card" style={{ margin: '0 16px' }}>
        {recent.length === 0 && (
          <div style={{ padding: '16px', color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>
            No sessions yet
          </div>
        )}
        {recent.map(h => {
          const d = new Date(h.date);
          const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          const dur = formatTime(h.duration || 0);
          return (
            <div key={h.id} className="history-item">
              <div className="history-date">{label} · {dur}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="history-name">{h.dayName}</div>
                <span className={`day-tag ${typeTag(h.type)}`}>{h.type}</span>
              </div>
              <div className="history-stats">{h.totalSets} sets logged</div>
              <div className="vol-bar">
                <div className="vol-fill" style={{ width: `${(h.totalSets / maxVol) * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ height: 20 }} />
    </div>
  );
}
