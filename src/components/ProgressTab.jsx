import { useState, useRef, useEffect } from 'react';
import { DAYS_OF_WEEK } from '../data/program';
import { getTodayIdx, typeTag, formatTime, load, save } from '../utils/helpers';

const GOALS = [
  { name: 'BB Bench Press',    target: 225, unit: 'lbs'  },
  { name: 'RDL',               target: 225, unit: 'lbs'  },
  { name: 'Cable Row',         target: 150, unit: 'lbs'  },
  { name: 'DB Shoulder Press', target: 80,  unit: 'lbs'  },
  { name: 'Pull Ups',          target: 15,  unit: 'reps' },
  { name: 'Incline DB Press',  target: 100, unit: 'lbs'  },
];

const selectOnFocus = (e) => {
  const el = e.target;
  requestAnimationFrame(() => el.select());
};

const fmtStatDate = (dateStr) =>
  new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function SwipeableRow({ onDelete, children }) {
  const [offset, setOffset] = useState(0);
  const [snapping, setSnapping] = useState(false);
  const startXRef = useRef(0);
  const revealedRef = useRef(false);
  const DELETE_W = 80;

  const handleTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX;
    setSnapping(false);
  };

  const handleTouchMove = (e) => {
    const dx = e.touches[0].clientX - startXRef.current;
    if (revealedRef.current) {
      setOffset(Math.min(0, Math.max(dx - DELETE_W, -DELETE_W)));
    } else if (dx < 0) {
      setOffset(Math.max(dx, -DELETE_W));
    }
  };

  const handleTouchEnd = () => {
    setSnapping(true);
    if (offset < -DELETE_W / 2) {
      setOffset(-DELETE_W);
      revealedRef.current = true;
    } else {
      setOffset(0);
      revealedRef.current = false;
    }
  };

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <button className="swipe-delete-btn" style={{ width: DELETE_W }} onClick={onDelete}>
        Delete
      </button>
      <div
        style={{
          transform: `translateX(${offset}px)`,
          transition: snapping ? 'transform 0.2s ease' : 'none',
          background: 'var(--surface)',
          position: 'relative',
          zIndex: 1,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

export default function ProgressTab({ history, prs, onDeleteSession, onDeletePr, bodyStats, onAddBodyStat }) {
  const todayIdx = getTodayIdx();
  const [apiKey,          setApiKey]         = useState(() => load('lift_ai_key', ''));
  const [keyDraft,        setKeyDraft]        = useState('');
  const [loading,         setLoading]         = useState(false);
  const [feedback,        setFeedback]        = useState('');
  const [aiError,         setAiError]         = useState('');
  const [chatMessages,    setChatMessages]    = useState(() => load('lift_ai_chat', []));
  const [chatInput,       setChatInput]       = useState('');
  const [chatLoading,     setChatLoading]     = useState(false);
  const [chatError,       setChatError]       = useState('');
  const [showStatForm,    setShowStatForm]    = useState(false);
  const [statDraftWeight, setStatDraftWeight] = useState('');
  const [statDraftBf,     setStatDraftBf]     = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    save('lift_ai_chat', chatMessages);
  }, [chatMessages]);

  const clearChat = () => setChatMessages([]);

  // Goals helpers
  const getGoalCurrent = (goal) => {
    if (goal.unit === 'reps') {
      let max = 0;
      history.forEach(session => {
        (session.exercises || []).forEach(ex => {
          if (ex.name === goal.name) {
            (ex.sets || []).forEach(s => {
              const r = parseInt(s.reps) || 0;
              if (r > max) max = r;
            });
          }
        });
      });
      return max;
    }
    return prs[goal.name] || 0;
  };

  // Body stats helpers
  const saveBodyStat = () => {
    const w = parseFloat(statDraftWeight);
    if (!w) return;
    const bf = statDraftBf !== '' ? parseFloat(statDraftBf) : null;
    onAddBodyStat({ date: new Date().toISOString().split('T')[0], weight: w, bodyFat: bf });
    setStatDraftWeight('');
    setStatDraftBf('');
    setShowStatForm(false);
  };

  const latestStat = bodyStats.length > 0 ? bodyStats[bodyStats.length - 1] : null;
  const histStats  = bodyStats.length > 1 ? bodyStats.slice(0, -1).reverse().slice(0, 8) : [];

  // AI helpers
  const buildContext = () => {
    const reversed = [...history].reverse().slice(0, 20);
    const typeCounts = {};
    history.forEach(h => { typeCounts[h.type] = (typeCounts[h.type] || 0) + 1; });
    const sessionLines = reversed.map(h => {
      const date = new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const min = Math.round((h.duration || 0) / 60);
      return `- ${date}: ${h.type} — ${h.totalSets} sets, ${min} min`;
    }).join('\n');
    const prLines = Object.entries(prs).length > 0
      ? Object.entries(prs).map(([ex, w]) => `- ${ex}: ${w} lbs`).join('\n')
      : '- No PRs recorded yet';
    const freqSummary = Object.entries(typeCounts).map(([t, n]) => `${t}: ${n}`).join(', ');
    return `User's workout data:\n\nLast ${Math.min(history.length, 20)} workouts (most recent first):\n${sessionLines}\n\nWorkout breakdown: ${freqSummary} (${history.length} total)\n\nPersonal Records:\n${prLines}`;
  };

  const callClaude = async (system, messages, maxTokens = 1024) => {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: maxTokens, system, messages }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.content[0].text;
  };

  const getFeedback = async () => {
    setLoading(true);
    setFeedback('');
    setAiError('');
    try {
      const text = await callClaude(
        "You are a knowledgeable personal trainer analyzing a user's workout history. Give specific, actionable feedback based on their actual data. Be concise and direct — 3 to 5 bullet points max. Focus on patterns, imbalances, and what to prioritize next.",
        [{ role: 'user', content: buildContext() }]
      );
      setFeedback(text);
    } catch (e) {
      setAiError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const userMsg = { role: 'user', content: text };
    const nextMessages = [...chatMessages, userMsg];
    setChatMessages(nextMessages);
    setChatInput('');
    setChatLoading(true);
    setChatError('');
    try {
      const reply = await callClaude(
        `You are a knowledgeable personal trainer. Answer the user's questions with specific, actionable advice based on their actual training data. Be concise.\n\n${buildContext()}`,
        nextMessages
      );
      setChatMessages(msgs => [...msgs, { role: 'assistant', content: reply }]);
    } catch (e) {
      setChatError(e.message);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  };

  const thisWeek = DAYS_OF_WEEK.map((d, i) => {
    const done = history.some(h => {
      const date = new Date(h.date);
      const dayDiff = Math.floor((Date.now() - date) / 86400000);
      const hDay = date.getDay() === 0 ? 6 : date.getDay() - 1;
      return dayDiff < 7 && hDay === i;
    });
    return { label: d, done, today: i === todayIdx };
  });

  const recent = [...history].reverse().slice(0, 20);
  const maxVol = Math.max(...history.map(h => h.totalSets || 0), 1);

  return (
    <div className="content">
      {/* This week */}
      <div className="section-title">This week</div>
      <div className="week-streak">
        {thisWeek.map((d, i) => (
          <div key={i} className={`streak-dot ${d.today ? 'today' : d.done ? 'done' : 'empty'}`}>
            {d.label.slice(0, 1)}
          </div>
        ))}
      </div>

      {/* PRs */}
      <div className="section-title" style={{ marginTop: 8 }}>PRs</div>
      <div className="card" style={{ margin: '0 16px' }}>
        {Object.keys(prs).length === 0 && (
          <div style={{ padding: '16px', color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>
            Complete workouts to track PRs
          </div>
        )}
        {Object.entries(prs).map(([name, weight]) => (
          <SwipeableRow key={name} onDelete={() => onDeletePr(name)}>
            <div className="pr-row">
              <div className="pr-name">{name}</div>
              <div className="pr-val">{weight} lbs</div>
            </div>
          </SwipeableRow>
        ))}
      </div>

      {/* Strength Goals */}
      <div className="section-title" style={{ marginTop: 8 }}>Strength Goals</div>
      <div className="card" style={{ margin: '0 16px' }}>
        {GOALS.map((goal, i) => {
          const current  = getGoalCurrent(goal);
          const pct      = current > 0 ? Math.min(100, Math.round((current / goal.target) * 100)) : 0;
          const achieved = pct >= 100;
          return (
            <div key={goal.name} className="goal-row" style={{ borderBottom: i < GOALS.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div className="goal-top">
                <span className="goal-name">{goal.name}</span>
                <span className={`goal-vals${achieved ? ' goal-achieved' : ''}`}>
                  {current > 0 ? `${current} / ${goal.target} ${goal.unit}` : `— / ${goal.target} ${goal.unit}`}
                </span>
              </div>
              <div className="goal-bar-track">
                <div
                  className="goal-bar-fill"
                  style={{ width: `${pct}%`, background: achieved ? 'var(--green)' : 'var(--accent)' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* History */}
      <div className="section-title" style={{ marginTop: 8 }}>History</div>
      <div className="card" style={{ margin: '0 16px' }}>
        {recent.length === 0 && (
          <div style={{ padding: '16px', color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>
            No sessions yet
          </div>
        )}
        {recent.map(h => {
          const d        = new Date(h.date);
          const date     = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          const dur      = formatTime(h.duration || 0);
          const dayLabel = h.dayTag || (h.dayName !== h.type ? h.dayName : null);

          return (
            <SwipeableRow key={h.id} onDelete={() => onDeleteSession(h.id)}>
              <div className="history-item">
                <div className="history-date">{date} · {dur}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  {dayLabel && <div className="history-name">{dayLabel}</div>}
                  <span className={`day-tag ${typeTag(h.type)}`}>{h.type}</span>
                </div>
                <div className="history-stats">{h.totalSets} sets logged</div>
                <div className="vol-bar">
                  <div className="vol-fill" style={{ width: `${(h.totalSets / maxVol) * 100}%` }} />
                </div>
              </div>
            </SwipeableRow>
          );
        })}
      </div>

      {/* Body Stats */}
      <div className="section-title" style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 20 }}>
        <span>Body Stats</span>
        <button
          onClick={() => setShowStatForm(v => !v)}
          style={{ fontSize: 11, fontWeight: 600, color: showStatForm ? 'var(--text-3)' : 'var(--accent)', letterSpacing: 0 }}
        >
          {showStatForm ? 'Cancel' : '+ Log'}
        </button>
      </div>
      <div className="card" style={{ margin: '0 16px' }}>
        {showStatForm && (
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <div className="field-row">
              <div>
                <div className="field-label">Weight (lbs)</div>
                <input
                  className="field-input"
                  style={{ marginBottom: 0 }}
                  type="number"
                  step="0.1"
                  placeholder="162"
                  value={statDraftWeight}
                  onChange={e => setStatDraftWeight(e.target.value)}
                  onFocus={selectOnFocus}
                />
              </div>
              <div>
                <div className="field-label">Body fat %</div>
                <input
                  className="field-input"
                  style={{ marginBottom: 0 }}
                  type="number"
                  step="0.1"
                  placeholder="13"
                  value={statDraftBf}
                  onChange={e => setStatDraftBf(e.target.value)}
                  onFocus={selectOnFocus}
                />
              </div>
            </div>
            <button
              className="sheet-save"
              style={{ marginTop: 12, opacity: statDraftWeight.trim() ? 1 : 0.45 }}
              onClick={saveBodyStat}
            >
              Save entry
            </button>
          </div>
        )}

        {latestStat ? (
          <>
            <div style={{ padding: '14px 16px', borderBottom: histStats.length > 0 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', gap: 28, marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px' }}>
                    {latestStat.weight}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-2)' }}> lbs</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Weight</div>
                </div>
                {latestStat.bodyFat != null && (
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px' }}>
                      {latestStat.bodyFat}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-2)' }}>%</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Body fat</div>
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{fmtStatDate(latestStat.date)}</div>
            </div>

            {histStats.map((s, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 14px',
                  borderBottom: i < histStats.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{fmtStatDate(s.date)}</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>
                  {s.weight} lbs{s.bodyFat != null ? ` · ${s.bodyFat}%` : ''}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div style={{ padding: '16px', color: 'var(--text-3)', fontSize: 13, textAlign: 'center' }}>
            Tap + Log to record your stats
          </div>
        )}
      </div>

      {/* AI Trainer */}
      <div className="section-title" style={{ marginTop: 8 }}>AI Trainer</div>
      <div className="card" style={{ margin: '0 16px' }}>
        {!apiKey ? (
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12, lineHeight: 1.5 }}>
              Enter your Anthropic API key to get personalized feedback on your training.
            </div>
            <input
              className="field-input"
              type="password"
              placeholder="sk-ant-api..."
              value={keyDraft}
              onChange={e => setKeyDraft(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              className="sheet-save"
              style={{ marginTop: 4, opacity: keyDraft.trim() ? 1 : 0.45 }}
              onClick={() => { const k = keyDraft.trim(); if (!k) return; save('lift_ai_key', k); setApiKey(k); setKeyDraft(''); }}
            >
              Save key
            </button>
          </div>
        ) : (
          <div style={{ padding: '14px 16px' }}>
            <button className="ai-btn" onClick={getFeedback} disabled={loading}>
              {loading ? 'Analyzing…' : 'Get AI feedback'}
            </button>
            {aiError && (
              <div style={{ fontSize: 13, color: 'var(--red)', marginTop: 10, lineHeight: 1.5 }}>
                {aiError}
              </div>
            )}
            {feedback && (
              <div className="ai-feedback">{feedback}</div>
            )}

            <div className="chat-window">
              {chatMessages.length > 0 && (
                <div className="chat-messages">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}
                    >
                      {msg.content}
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="chat-bubble chat-bubble-ai chat-bubble-typing">
                      <span className="chat-dot" /><span className="chat-dot" /><span className="chat-dot" />
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
              {chatError && (
                <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 8, lineHeight: 1.5 }}>
                  {chatError}
                </div>
              )}
              <div className="chat-input-row">
                <textarea
                  className="chat-input"
                  placeholder="Ask your trainer…"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={handleChatKey}
                  rows={1}
                />
                <button
                  className="chat-send-btn"
                  onClick={sendChat}
                  disabled={!chatInput.trim() || chatLoading}
                  aria-label="Send"
                >
                  ↑
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <button
                onClick={() => { save('lift_ai_key', ''); setApiKey(''); setFeedback(''); setAiError(''); }}
                style={{ fontSize: 11, color: 'var(--text-3)' }}
              >
                Change API key
              </button>
              {chatMessages.length > 0 && (
                <button onClick={clearChat} style={{ fontSize: 11, color: 'var(--red)' }}>
                  Clear chat
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}
