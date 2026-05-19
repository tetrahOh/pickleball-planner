import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const USERS_KEY = 'family-pickleball-users';
const SESSIONS_KEY = 'family-pickleball-sessions';
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

function loadJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normaliseName(name) {
  return name.trim().replace(/\s+/g, ' ');
}

function sameName(a, b) {
  return normaliseName(a).toLowerCase() === normaliseName(b).toLowerCase();
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  function submit(event) {
    event.preventDefault();
    const cleanName = normaliseName(name);

    if (cleanName.length < 2) {
      setError('Please enter your name.');
      return;
    }

    onLogin(cleanName);
  }

  return (
    <main className='login-shell'>
      <section className='login-panel' aria-labelledby='login-title'>
        <div className='brand-mark'>PB</div>
        <h1 id='login-title'>Family Pickleball Planner</h1>
        <p className='privacy-note'>This family planner is for people with the link only.</p>
        <form onSubmit={submit} className='login-form'>
          <label htmlFor='login-name'>Your name</label>
          <input
            id='login-name'
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError('');
            }}
            placeholder='e.g. Sam Taylor'
            autoComplete='name'
          />
          {error ? <p className='form-error'>{error}</p> : null}
          <button className='primary-button' type='submit'>Log In</button>
        </form>
      </section>
    </main>
  );
}

function SessionForm({ initialSession, onSubmit, onCancel, submitLabel }) {
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
    <form className='session-form' onSubmit={submit}>
      <div className='field full'>
        <label htmlFor='session-title'>Session title <span>optional</span></label>
        <input id='session-title' value={session.title} onChange={(event) => update('title', event.target.value)} placeholder='Saturday morning hit' />
      </div>
      <div className='field'>
        <label htmlFor='session-date'>Date</label>
        <input id='session-date' type='date' value={session.date} onChange={(event) => update('date', event.target.value)} required />
      </div>
      <div className='field'>
        <label htmlFor='session-time'>Start time</label>
        <input id='session-time' type='time' value={session.startTime} onChange={(event) => update('startTime', event.target.value)} required />
      </div>
      <div className='field'>
        <label htmlFor='session-duration'>Duration</label>
        <select id='session-duration' value={session.durationHours} onChange={(event) => update('durationHours', event.target.value)}>
          <option value='0.5'>30 minutes</option>
          <option value='1'>1 hour</option>
          <option value='1.5'>1.5 hours</option>
          <option value='2'>2 hours</option>
          <option value='2.5'>2.5 hours</option>
          <option value='3'>3 hours</option>
        </select>
      </div>
      <div className='field'>
        <label htmlFor='session-location'>Location</label>
        <input id='session-location' value={session.location} onChange={(event) => update('location', event.target.value)} placeholder='Local pickleball courts' required />
      </div>
      <div className='field'>
        <label htmlFor='session-courts'>Number of courts</label>
        <input id='session-courts' type='number' min='1' step='1' value={session.courts} onChange={(event) => update('courts', event.target.value)} required />
      </div>
      <div className='field'>
        <label htmlFor='session-cost'>Cost per court per hour</label>
        <input id='session-cost' type='number' min='0' step='0.01' value={session.costPerCourtHour} onChange={(event) => update('costPerCourtHour', event.target.value)} required />
      </div>
      <div className='field full'>
        <label htmlFor='session-notes'>Notes <span>optional</span></label>
        <textarea id='session-notes' value={session.notes} onChange={(event) => update('notes', event.target.value)} placeholder='Bring paddles, drinks, or anything else the family should know.' />
      </div>
      <div className='form-actions full'>
        {onCancel ? <button className='secondary-button' type='button' onClick={onCancel}>Cancel</button> : null}
        <button className='primary-button' type='submit'>{submitLabel}</button>
      </div>
    </form>
  );
}

function RsvpPanel({ session, users, currentUser, onUpdateAttendees }) {
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const attendeeSet = useMemo(() => new Set(session.attendeeIds), [session.attendeeIds]);
  const familyChoices = users.filter((user) => !attendeeSet.has(user.id));
  const isCurrentUserAttending = attendeeSet.has(currentUser.id);

  function addAttendees(ids) {
    const merged = Array.from(new Set([...session.attendeeIds, ...ids]));
    onUpdateAttendees(session.id, merged);
    setSelectedUserIds([]);
  }

  function removeAttendee(id) {
    onUpdateAttendees(session.id, session.attendeeIds.filter((attendeeId) => attendeeId !== id));
  }

  return (
    <div className='rsvp-panel'>
      <div className='button-row'>
        <button className='primary-button compact' type='button' onClick={() => addAttendees([currentUser.id])} disabled={isCurrentUserAttending}>I'm Attending</button>
        <button className='secondary-button compact' type='button' onClick={() => removeAttendee(currentUser.id)} disabled={!isCurrentUserAttending}>Not Attending</button>
      </div>
      <div className='family-rsvp'>
        <label htmlFor={`family-${session.id}`}>RSVP for Family</label>
        <select
          id={`family-${session.id}`}
          multiple
          value={selectedUserIds}
          onChange={(event) => setSelectedUserIds(Array.from(event.target.selectedOptions, (option) => option.value))}
        >
          {familyChoices.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
        </select>
        <button className='secondary-button compact' type='button' onClick={() => addAttendees(selectedUserIds)} disabled={selectedUserIds.length === 0}>Add Selected</button>
      </div>
    </div>
  );
}

function SessionCard({ session, users, currentUser, onUpdateAttendees, onEdit, onDelete }) {
  const creator = users.find((user) => user.id === session.creatorId);
  const attendees = session.attendeeIds.map((id) => users.find((user) => user.id === id)).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
  const totalCost = session.courts * session.costPerCourtHour * session.durationHours;
  const perAttendeeCost = attendees.length ? totalCost / attendees.length : null;
  const canManage = session.creatorId === currentUser.id;

  return (
    <article className='session-card'>
      <div className='session-card-header'>
        <div>
          <p className='date-line'>{formatDate(session.date)} at {session.startTime}</p>
          <h3>{session.title || 'Pickleball Session'}</h3>
        </div>
        {canManage ? (
          <div className='card-actions'>
            <button className='secondary-button compact' type='button' onClick={() => onEdit(session)}>Edit Session</button>
            <button className='danger-button compact' type='button' onClick={() => onDelete(session.id)}>Delete Session</button>
          </div>
        ) : null}
      </div>
      <dl className='session-details'>
        <div><dt>Duration</dt><dd>{session.durationHours} hour{session.durationHours === 1 ? '' : 's'}</dd></div>
        <div><dt>Location</dt><dd>{session.location}</dd></div>
        <div><dt>Courts</dt><dd>{session.courts}</dd></div>
        <div><dt>Court cost</dt><dd>{formatMoney(session.costPerCourtHour)} / hour</dd></div>
        <div><dt>Total cost</dt><dd>{formatMoney(totalCost)}</dd></div>
        <div><dt>Cost per attendee</dt><dd>{perAttendeeCost === null ? 'No attendees confirmed yet' : formatMoney(perAttendeeCost)}</dd></div>
        <div><dt>Created by</dt><dd>{creator?.name ?? 'Unknown'}</dd></div>
      </dl>
      {session.notes ? <p className='session-notes'>{session.notes}</p> : null}
      <section className='attendees' aria-label='Confirmed attendees'>
        <h4>Confirmed attendees</h4>
        {attendees.length ? (
          <div className='attendee-list'>
            {attendees.map((user) => (
              <span className='attendee-pill' key={user.id}>
                {user.name}
                <button type='button' aria-label={`Remove ${user.name}`} onClick={() => onUpdateAttendees(session.id, session.attendeeIds.filter((id) => id !== user.id))}>x</button>
              </span>
            ))}
          </div>
        ) : <p className='empty-text'>No attendees confirmed yet</p>}
      </section>
      <RsvpPanel session={session} users={users} currentUser={currentUser} onUpdateAttendees={onUpdateAttendees} />
    </article>
  );
}

function App() {
  const [users, setUsers] = useState(() => loadJson(USERS_KEY, []));
  const [sessions, setSessions] = useState(() => loadJson(SESSIONS_KEY, []));
  const [currentUserId, setCurrentUserId] = useState(() => localStorage.getItem(CURRENT_USER_KEY));
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSession, setEditingSession] = useState(null);

  const currentUser = users.find((user) => user.id === currentUserId);
  const upcomingSessions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sessions
      .filter((session) => new Date(`${session.date}T00:00:00`) >= today)
      .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));
  }, [sessions]);

  function persistUsers(nextUsers) {
    setUsers(nextUsers);
    saveJson(USERS_KEY, nextUsers);
  }

  function persistSessions(nextSessions) {
    setSessions(nextSessions);
    saveJson(SESSIONS_KEY, nextSessions);
  }

  function login(name) {
    const existing = users.find((user) => sameName(user.name, name));
    const user = existing ?? { id: makeId('user'), name };
    const nextUsers = existing ? users : [...users, user].sort((a, b) => a.name.localeCompare(b.name));
    persistUsers(nextUsers);
    setCurrentUserId(user.id);
    localStorage.setItem(CURRENT_USER_KEY, user.id);
  }

  function logout() {
    setCurrentUserId(null);
    localStorage.removeItem(CURRENT_USER_KEY);
    setShowCreateForm(false);
    setEditingSession(null);
  }

  function createSession(session) {
    persistSessions([...sessions, { ...session, id: makeId('session'), creatorId: currentUser.id, attendeeIds: [], createdAt: new Date().toISOString() }]);
    setShowCreateForm(false);
  }

  function updateSession(updatedSession) {
    persistSessions(sessions.map((session) => session.id === updatedSession.id ? { ...session, ...updatedSession, attendeeIds: session.attendeeIds, creatorId: session.creatorId } : session));
    setEditingSession(null);
  }

  function deleteSession(sessionId) {
    const session = sessions.find((item) => item.id === sessionId);
    const label = session?.title || 'this pickleball session';
    if (window.confirm(`Delete ${label}? This cannot be undone.`)) {
      persistSessions(sessions.filter((item) => item.id !== sessionId));
    }
  }

  function updateAttendees(sessionId, attendeeIds) {
    persistSessions(sessions.map((session) => session.id === sessionId ? { ...session, attendeeIds: Array.from(new Set(attendeeIds)) } : session));
  }

  if (!currentUser) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <div className='app-shell'>
      <header className='app-header'>
        <div>
          <p className='eyebrow'>Private family planner</p>
          <h1>Family Pickleball Planner</h1>
        </div>
        <div className='user-box'>
          <span>Logged in as <strong>{currentUser.name}</strong></span>
          <button className='secondary-button compact' type='button' onClick={logout}>Logout</button>
        </div>
      </header>
      <main>
        <section className='toolbar'>
          <div>
            <h2>Upcoming sessions</h2>
            <p>{upcomingSessions.length ? `${upcomingSessions.length} session${upcomingSessions.length === 1 ? '' : 's'} ready to plan.` : 'No upcoming sessions yet.'}</p>
          </div>
          <button className='primary-button' type='button' onClick={() => setShowCreateForm((value) => !value)}>{showCreateForm ? 'Close' : 'Create Session'}</button>
        </section>
        {showCreateForm ? (
          <section className='form-panel' aria-label='Create session'>
            <h2>Create Session</h2>
            <SessionForm initialSession={blankSession} onSubmit={createSession} onCancel={() => setShowCreateForm(false)} submitLabel='Create Session' />
          </section>
        ) : null}
        {editingSession ? (
          <section className='form-panel' aria-label='Edit session'>
            <h2>Edit Session</h2>
            <SessionForm initialSession={editingSession} onSubmit={updateSession} onCancel={() => setEditingSession(null)} submitLabel='Save Changes' />
          </section>
        ) : null}
        <section className='session-list' aria-label='Session list'>
          {upcomingSessions.length ? upcomingSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              users={users}
              currentUser={currentUser}
              onUpdateAttendees={updateAttendees}
              onEdit={(item) => {
                setShowCreateForm(false);
                setEditingSession(item);
              }}
              onDelete={deleteSession}
            />
          )) : (
            <div className='empty-state'>
              <h3>No sessions planned</h3>
              <p>Create the first pickleball session and the family can start RSVPing.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
