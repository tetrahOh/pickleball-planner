import React, { useEffect, useMemo, useState } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://uiopgjahnzzabsfdfcts.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Lq8i9SaaaklE5V6HF0PPCA_E752z49G';
const CURRENT_USER_KEY = 'family-pickleball-current-user';

const blankSession = {
  title: '',
  date: '',
  startTime: '',
  durationHours: 1,
  location: '',
  courts: 1,
  costPerCourtHour: 0,
  notes: '',
};

function normaliseName(name) {
  return name.trim().replace(/\s+/g, ' ');
}

function normalisedKey(name) {
  return normaliseName(name).toLowerCase();
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(date) {
  if (!date) return 'Date not set';
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function formatMoney(value) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(Number.isFinite(value) ? value : 0);
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || data?.hint || 'Supabase request failed.');
  }

  return data;
}

function mapSession(row) {
  const attendees = row.session_attendees || [];

  return {
    id: row.id,
    title: row.title || '',
    date: row.session_date,
    startTime: String(row.start_time || '').slice(0, 5),
    durationHours: Number(row.duration_hours),
    location: row.location || '',
    courts: Number(row.courts),
    costPerCourtHour: Number(row.cost_per_court_hour),
    notes: row.notes || '',
    creatorId: row.creator_id,
    creatorName: row.creator?.name || 'Unknown',
    attendeeIds: attendees.map((attendee) => attendee.user_id),
    attendees: attendees
      .map((attendee) => attendee.family_members)
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

function LoginScreen({ onLogin, isBusy, setupError }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    const cleanName = normaliseName(name);

    if (cleanName.length < 2) {
      setError('Please enter your name.');
      return;
    }

    onLogin(cleanName).catch((loginError) => setError(loginError.message));
  }

  return (
    <main className="login-shell">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="brand-mark">PB</div>
        <h1 id="login-title">Family Pickleball Planner</h1>
        <p className="privacy-note">This family planner is for people with the link only.</p>
        {setupError ? <p className="setup-error">{setupError}</p> : null}
        <form onSubmit={submit} className="login-form">
          <label htmlFor="login-name">Your name</label>
          <input
            id="login-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError('');
            }}
            placeholder="e.g. Sam Taylor"
            autoComplete="name"
          />
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button" type="submit" disabled={isBusy}>
            {isBusy ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </section>
    </main>
  );
}

function SessionForm({ initialSession, onSubmit, onCancel, submitLabel, isBusy }) {
  const [session, setSession] = useState(initialSession ?? blankSession);

  function update(field, value) {
    setSession((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    onSubmit({
      ...session,
      title: session.title.trim(),
      location: session.location.trim(),
      notes: session.notes.trim(),
      durationHours: Number(session.durationHours),
      courts: Number(session.courts),
      costPerCourtHour: Number(session.costPerCourtHour),
    });
  }

  return (
    <form className="session-form" onSubmit={submit}>
      <div className="field full">
        <label htmlFor="session-title">Session title <span>optional</span></label>
        <input id="session-title" value={session.title} onChange={(event) => update('title', event.target.value)} placeholder="Saturday morning hit" />
      </div>
      <div className="field">
        <label htmlFor="session-date">Date</label>
        <input id="session-date" type="date" value={session.date} onChange={(event) => update('date', event.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="session-time">Start time</label>
        <input id="session-time" type="time" value={session.startTime} onChange={(event) => update('startTime', event.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="session-duration">Duration</label>
        <select id="session-duration" value={session.durationHours} onChange={(event) => update('durationHours', event.target.value)}>
          <option value="0.5">30 minutes</option>
          <option value="1">1 hour</option>
          <option value="1.5">1.5 hours</option>
          <option value="2">2 hours</option>
          <option value="2.5">2.5 hours</option>
          <option value="3">3 hours</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="session-location">Location</label>
        <input id="session-location" value={session.location} onChange={(event) => update('location', event.target.value)} placeholder="Local pickleball courts" required />
      </div>
      <div className="field">
        <label htmlFor="session-courts">Number of courts</label>
        <input id="session-courts" type="number" min="1" step="1" value={session.courts} onChange={(event) => update('courts', event.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="session-cost">Cost per court per hour</label>
        <input id="session-cost" type="number" min="0" step="0.01" value={session.costPerCourtHour} onChange={(event) => update('costPerCourtHour', event.target.value)} required />
      </div>
      <div className="field full">
        <label htmlFor="session-notes">Notes <span>optional</span></label>
        <textarea id="session-notes" value={session.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Bring paddles, drinks, or anything else the family should know." />
      </div>
      <div className="form-actions full">
        {onCancel ? <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button> : null}
        <button className="primary-button" type="submit" disabled={isBusy}>{isBusy ? 'Saving...' : submitLabel}</button>
      </div>
    </form>
  );
}

function RsvpPanel({ session, users, currentUser, onAddAttendees, onRemoveAttendee, isBusy }) {
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const attendeeSet = useMemo(() => new Set(session.attendeeIds), [session.attendeeIds]);
  const familyChoices = users.filter((user) => !attendeeSet.has(user.id));
  const isCurrentUserAttending = attendeeSet.has(currentUser.id);

  function addAttendees(ids) {
    onAddAttendees(session.id, ids).then(() => setSelectedUserIds([]));
  }

  return (
    <div className="rsvp-panel">
      <div className="button-row">
        <button className="primary-button compact" type="button" onClick={() => addAttendees([currentUser.id])} disabled={isBusy || isCurrentUserAttending}>
          I'm Attending
        </button>
        <button className="secondary-button compact" type="button" onClick={() => onRemoveAttendee(session.id, currentUser.id)} disabled={isBusy || !isCurrentUserAttending}>
          Not Attending
        </button>
      </div>

      <div className="family-rsvp">
        <label htmlFor={`family-${session.id}`}>RSVP for Family</label>
        <select
          id={`family-${session.id}`}
          multiple
          value={selectedUserIds}
          onChange={(event) => setSelectedUserIds(Array.from(event.target.selectedOptions, (option) => option.value))}
        >
          {familyChoices.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
        </select>
        <button className="secondary-button compact" type="button" onClick={() => addAttendees(selectedUserIds)} disabled={isBusy || selectedUserIds.length === 0}>
          Add Selected
        </button>
      </div>
    </div>
  );
}

function SessionCard({ session, users, currentUser, onAddAttendees, onRemoveAttendee, onEdit, onDelete, isBusy }) {
  const totalCost = session.courts * session.costPerCourtHour * session.durationHours;
  const perAttendeeCost = session.attendees.length ? totalCost / session.attendees.length : null;
  const canManage = session.creatorId === currentUser.id;

  return (
    <article className="session-card">
      <div className="session-card-header">
        <div>
          <p className="date-line">{formatDate(session.date)} at {session.startTime}</p>
          <h3>{session.title || 'Pickleball Session'}</h3>
        </div>
        {canManage ? (
          <div className="card-actions">
            <button className="secondary-button compact" type="button" onClick={() => onEdit(session)}>Edit Session</button>
            <button className="danger-button compact" type="button" onClick={() => onDelete(session.id)} disabled={isBusy}>Delete Session</button>
          </div>
        ) : null}
      </div>

      <dl className="session-details">
        <div><dt>Duration</dt><dd>{session.durationHours} hour{session.durationHours === 1 ? '' : 's'}</dd></div>
        <div><dt>Location</dt><dd>{session.location}</dd></div>
        <div><dt>Courts</dt><dd>{session.courts}</dd></div>
        <div><dt>Court cost</dt><dd>{formatMoney(session.costPerCourtHour)} / hour</dd></div>
        <div><dt>Total cost</dt><dd>{formatMoney(totalCost)}</dd></div>
        <div><dt>Cost per attendee</dt><dd>{perAttendeeCost === null ? 'No attendees confirmed yet' : formatMoney(perAttendeeCost)}</dd></div>
        <div><dt>Created by</dt><dd>{session.creatorName}</dd></div>
      </dl>

      {session.notes ? <p className="session-notes">{session.notes}</p> : null}

      <section className="attendees" aria-label="Confirmed attendees">
        <h4>Confirmed attendees</h4>
        {session.attendees.length ? (
          <div className="attendee-list">
            {session.attendees.map((user) => (
              <span className="attendee-pill" key={user.id}>
                {user.name}
                <button type="button" aria-label={`Remove ${user.name}`} onClick={() => onRemoveAttendee(session.id, user.id)} disabled={isBusy}>x</button>
              </span>
            ))}
          </div>
        ) : <p className="empty-text">No attendees confirmed yet</p>}
      </section>

      <RsvpPanel session={session} users={users} currentUser={currentUser} onAddAttendees={onAddAttendees} onRemoveAttendee={onRemoveAttendee} isBusy={isBusy} />
    </article>
  );
}

export default function App() {
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CURRENT_USER_KEY));
    } catch {
      return null;
    }
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [setupError, setSetupError] = useState('');

  async function loadData() {
    const [members, sessionRows] = await Promise.all([
      supabaseRequest('family_members?select=id,name&order=name.asc'),
      supabaseRequest(`sessions?select=id,title,session_date,start_time,duration_hours,location,courts,cost_per_court_hour,notes,creator_id,created_at,creator:family_members(id,name),session_attendees(user_id,family_members(id,name))&session_date=gte.${todayString()}&order=session_date.asc,start_time.asc`),
    ]);

    setUsers(members);
    setSessions(sessionRows.map(mapSession));
    setSetupError('');
  }

  useEffect(() => {
    if (!currentUser) return;
    loadData().catch((error) => setSetupError(error.message));
  }, [currentUser]);

  async function login(name) {
    setIsBusy(true);
    setMessage('');
    try {
      const key = normalisedKey(name);
      const existing = await supabaseRequest(`family_members?select=id,name&normalized_name=eq.${encodeURIComponent(key)}&limit=1`);
      let user = existing[0];

      if (!user) {
        try {
          const created = await supabaseRequest('family_members', {
            method: 'POST',
            headers: { Prefer: 'return=representation' },
            body: JSON.stringify({ name, normalized_name: key }),
          });
          user = created[0];
        } catch {
          const matchingUsers = await supabaseRequest(`family_members?select=id,name&normalized_name=eq.${encodeURIComponent(key)}&limit=1`);
          user = matchingUsers[0];
        }
      }

      setCurrentUser(user);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      await loadData();
    } catch (error) {
      setSetupError(error.message);
      throw error;
    } finally {
      setIsBusy(false);
    }
  }

  function logout() {
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
    setShowCreateForm(false);
    setEditingSession(null);
  }

  async function saveSession(session) {
    setIsBusy(true);
    setMessage('');
    const payload = {
      title: session.title || null,
      session_date: session.date,
      start_time: session.startTime,
      duration_hours: session.durationHours,
      location: session.location,
      courts: session.courts,
      cost_per_court_hour: session.costPerCourtHour,
      notes: session.notes || null,
    };

    try {
      if (session.id) {
        await supabaseRequest(`sessions?id=eq.${session.id}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify(payload),
        });
        setEditingSession(null);
        setMessage('Session updated.');
      } else {
        await supabaseRequest('sessions', {
          method: 'POST',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ ...payload, creator_id: currentUser.id }),
        });
        setShowCreateForm(false);
        setMessage('Session created.');
      }
      await loadData();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsBusy(false);
    }
  }

  async function deleteSession(sessionId) {
    const session = sessions.find((item) => item.id === sessionId);
    const label = session?.title || 'this pickleball session';
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;

    setIsBusy(true);
    setMessage('');
    try {
      await supabaseRequest(`sessions?id=eq.${sessionId}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' },
      });
      setMessage('Session deleted.');
      await loadData();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsBusy(false);
    }
  }

  async function addAttendees(sessionId, attendeeIds) {
    setIsBusy(true);
    setMessage('');
    try {
      const rows = attendeeIds.map((userId) => ({ session_id: sessionId, user_id: userId }));
      await supabaseRequest('session_attendees?on_conflict=session_id,user_id', {
        method: 'POST',
        headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' },
        body: JSON.stringify(rows),
      });
      await loadData();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsBusy(false);
    }
  }

  async function removeAttendee(sessionId, userId) {
    setIsBusy(true);
    setMessage('');
    try {
      await supabaseRequest(`session_attendees?session_id=eq.${sessionId}&user_id=eq.${userId}`, {
        method: 'DELETE',
        headers: { Prefer: 'return=minimal' },
      });
      await loadData();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsBusy(false);
    }
  }

  if (!currentUser) {
    return <LoginScreen onLogin={login} isBusy={isBusy} setupError={setupError} />;
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Private family planner</p>
          <h1>Family Pickleball Planner</h1>
        </div>
        <div className="user-box">
          <span>Logged in as <strong>{currentUser.name}</strong></span>
          <button className="secondary-button compact" type="button" onClick={logout}>Logout</button>
        </div>
      </header>

      <main>
        {setupError ? <p className="setup-error">{setupError}</p> : null}
        {message ? <p className="status-message">{message}</p> : null}

        <section className="toolbar">
          <div>
            <h2>Upcoming sessions</h2>
            <p>{sessions.length ? `${sessions.length} session${sessions.length === 1 ? '' : 's'} ready to plan.` : 'No upcoming sessions yet.'}</p>
          </div>
          <button className="primary-button" type="button" onClick={() => setShowCreateForm((value) => !value)}>
            {showCreateForm ? 'Close' : 'Create Session'}
          </button>
        </section>

        {showCreateForm ? (
          <section className="form-panel" aria-label="Create session">
            <h2>Create Session</h2>
            <SessionForm initialSession={blankSession} onSubmit={saveSession} onCancel={() => setShowCreateForm(false)} submitLabel="Create Session" isBusy={isBusy} />
          </section>
        ) : null}

        {editingSession ? (
          <section className="form-panel" aria-label="Edit session">
            <h2>Edit Session</h2>
            <SessionForm initialSession={editingSession} onSubmit={saveSession} onCancel={() => setEditingSession(null)} submitLabel="Save Changes" isBusy={isBusy} />
          </section>
        ) : null}

        <section className="session-list" aria-label="Session list">
          {sessions.length ? (
            sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                users={users}
                currentUser={currentUser}
                onAddAttendees={addAttendees}
                onRemoveAttendee={removeAttendee}
                onEdit={(item) => {
                  setShowCreateForm(false);
                  setEditingSession(item);
                }}
                onDelete={deleteSession}
                isBusy={isBusy}
              />
            ))
          ) : (
            <div className="empty-state">
              <h3>No sessions planned</h3>
              <p>Create the first pickleball session and the family can start RSVPing.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
