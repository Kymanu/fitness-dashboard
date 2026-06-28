import { TEMPLATE_TYPES } from '../data/program';
import { typeTag } from '../utils/helpers';

const WORKOUT_META = {
  Push: { style: 'wbtn-push', abbr: 'P'  },
  Pull: { style: 'wbtn-pull', abbr: 'PL' },
  Legs: { style: 'wbtn-legs', abbr: 'L'  },
};

export default function TodayTab({ program, onStart, onBuildCustom, minimizedSession, onResume }) {
  const start = (key) =>
    onStart({ name: key, type: key, exercises: program[key].exercises });

  return (
    <div className="content">
      <div style={{ padding: '24px 16px 8px' }}>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px' }}>Train</div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {minimizedSession && (
        <button className="resume-banner" onClick={onResume}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
              Session in progress
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
              {minimizedSession.name} · paused — tap to resume
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={`day-tag ${typeTag(minimizedSession.type)}`}>
              {minimizedSession.type}
            </span>
            <span style={{ fontSize: 20, color: 'var(--accent)', lineHeight: 1 }}>›</span>
          </div>
        </button>
      )}

      <div className="workout-grid">
        {TEMPLATE_TYPES.map(key => {
          const meta  = WORKOUT_META[key];
          const count = program[key]?.exercises.length ?? 0;
          return (
            <button key={key} className={`workout-btn ${meta.style}`} onClick={() => start(key)}>
              <div className="wbtn-abbr">{meta.abbr}</div>
              <div>
                <div className="wbtn-name">{key}</div>
                <div className="wbtn-count">{count} exercises</div>
              </div>
            </button>
          );
        })}

        {/* Custom opens the builder, not a blank session */}
        <button className="workout-btn wbtn-custom" onClick={onBuildCustom}>
          <div className="wbtn-abbr">+</div>
          <div>
            <div className="wbtn-name">Custom</div>
            <div className="wbtn-count">Build your own</div>
          </div>
        </button>
      </div>
    </div>
  );
}
