import { useState, useRef, useEffect } from 'react';
import { DAYS_OF_WEEK } from '../data/program';
import { getTodayIdx, typeTag, formatTime, load, save } from '../utils/helpers';

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

export default function ProgressTab({ history, prs, onDeleteSession, onDeletePr }) {
  const todayIdx = getTodayIdx();
  const [apiKey,       setApiKey]      = useState(() => load('lift_ai_key', ''));
  const [keyDraft,     setKeyDraft]    = useState('');
  const [loading,      setLoading]     = useState(false);
  const [feedback,     setFeedback]    = useState('');
  const [aiError,      setAiError]     = useState('');
  const [chatMessages, setChatMessages] = useState(() => load('lift_ai_chat', []));
  const [chatInput,    setChatInput]   = useState('');
  const [chatLoading,  setChatLoading] = useState(false);
  const [chatError,    setChatError]   = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    save('lift_ai_chat', chatMessages);
  }, [chatMessages]);

  const clearChat = () => {
    setChatMessages([]);
  };

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
          <SwipeableRow key={name} onDelete={() => onDeletePr(name)}>
            <div className="pr-row">
              <div className="pr-name">{name}</div>
              <div className="pr-val">{weight} lbs</div>
            </div>
          </SwipeableRow>
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
          const d       = new Date(h.date);
          const date    = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          const dur     = formatTime(h.duration || 0);
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
