import { TEMPLATE_TYPES } from '../data/program';
import { typeTag } from '../utils/helpers';

const WORKOUT_META = {
  Push: { style: 'wbtn-push', abbr: 'P' },
  Pull: { style: 'wbtn-pull', abbr: 'PL' },
  Legs: { style: 'wbtn-legs', abbr: 'L' },
};

export default function TodayTab({ program, onStart }) {
  const start = (key) => {
    if (key === 'Custom') {
      onStart({ name: 'Custom', type: 'Custom', exercises: [] });
    } else {
      onStart({ name: key, type: key, exercises: program[key].exercises });
    }
  };

  return (
    <div className="content">
      <div style={{ padding: '24px 16px 8px' }}>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px' }}>Train</div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="workout-grid">
        {TEMPLATE_TYPES.map(key => {
          const meta = WORKOUT_META[key];
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

        <button className="workout-btn wbtn-custom" onClick={() => start('Custom')}>
          <div className="wbtn-abbr">+</div>
          <div>
            <div className="wbtn-name">Custom</div>
            <div className="wbtn-count">Blank session</div>
          </div>
        </button>
      </div>
    </div>
  );
}
