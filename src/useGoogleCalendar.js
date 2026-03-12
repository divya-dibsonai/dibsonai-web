// src/useGoogleCalendar.js
// ─────────────────────────────────────────────────────────
// Custom React hook that handles:
//   1. Google sign-in via Firebase
//   2. Fetching events from Google Calendar API
//   3. Returning formatted events for the dashboard
// ─────────────────────────────────────────────────────────

import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

export function useGoogleCalendar() {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [connected, setConnected] = useState(false);

  // ── Sign in with Google and fetch calendar ──
  const connectCalendar = async () => {
    try {
      setLoading(true);
      setError(null);

      // Opens Google sign-in popup
      const result = await signInWithPopup(auth, googleProvider);

      // Get OAuth access token (needed to call Calendar API)
      const accessToken = result._tokenResponse.oauthAccessToken;

      await fetchEvents(accessToken);
      setConnected(true);

    } catch (err) {
      console.error('Calendar connection error:', err);
      setError('Could not connect to Google Calendar. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch upcoming events from Google Calendar API ──
// ── Fetch upcoming events from ALL Google Calendars ──
const fetchEvents = async (accessToken) => {
  const now      = new Date();
  const twoMonth = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  now.setHours(0, 0, 0, 0);
  twoMonth.setHours(23, 59, 59, 999);

  const timeMin = now.toISOString();
  const timeMax = twoMonth.toISOString();

  // Get list of ALL your calendars
  const calListRes = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const calList = await calListRes.json();

  // Fetch events from every calendar in parallel
  const allEvents = await Promise.all(
    (calList.items || []).map(async (cal) => {
      const url = [
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events`,
        `?timeMin=${encodeURIComponent(timeMin)}`,
        `&timeMax=${encodeURIComponent(timeMax)}`,
        '&singleEvents=true',
        '&orderBy=startTime',
        '&maxResults=50',
      ].join('');

      try {
        const res  = await fetch(url, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await res.json();
        return (data.items || []).map(event => ({
          id:       event.id,
          title:    event.summary        || 'Untitled Session',
          start:    event.start.dateTime || event.start.date,
          end:      event.end.dateTime   || event.end.date,
          meetLink: event.hangoutLink    || null,
          desc:     event.description    || '',
          calendar: cal.summary,
          color:    cal.backgroundColor  || getEventColor(event.summary),
        }));
      } catch { return []; }
    })
  );

  // Flatten and sort by start time
  const flat = allEvents
    .flat()
    .sort((a, b) => new Date(a.start) - new Date(b.start));

  setEvents(flat);
};

  // ── Auto-assign colours based on student name in event title ──
  const COLORS = ['#0ABFBC','#FF6B9D','#FF6B35','#7B5EA7','#4CAF82','#FFD93D'];
  const colorMap = {};
  let colorIdx = 0;
  const getEventColor = (title = '') => {
    const key = title.split(' ')[0].toLowerCase();
    if (!colorMap[key]) { colorMap[key] = COLORS[colorIdx++ % COLORS.length]; }
    return colorMap[key];
  };

  // ── Group events by calendar day (YYYY-MM-DD key) ──
  const eventsByDay = events.reduce((acc, event) => {
    const day = event.start.slice(0, 10);
    if (!acc[day]) acc[day] = [];
    acc[day].push(event);
    return acc;
  }, {});

  // ── Helper: format a date string nicely ──
  const formatTime = (iso) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  };

  return {
    events,           // Array of all upcoming events
    eventsByDay,      // Events grouped by YYYY-MM-DD
    loading,          // true while fetching
    error,            // error message string or null
    connected,        // true after successful sign-in
    connectCalendar,  // call this to trigger Google sign-in
    formatTime,       // utility to format ISO time strings
  };
}
