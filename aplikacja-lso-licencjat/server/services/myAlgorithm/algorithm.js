import { fetchData, preprocessPreferences, checkMinUsers } from '../schedulerMinReq.js';

export async function runMyAlgorithm(minUsers) {
  const rawPrefs = await fetchData();
  const { weeklyPreferences, sundayPreferences } = preprocessPreferences(rawPrefs);
  console.warn(weeklyPreferences)

  // 2) Pobierz wszystkie events, wraz z min_users
  const evRes = await fetch(`${import.meta.env.VITE_API_URL}/getAllEvents`, {
    credentials: 'include'
  });
  if (!evRes.ok) throw new Error("Could not fetch events");
  const { events } = await evRes.json();
  // Zbuduj mapę eventId → min_users
  const minUsersMap = Object.fromEntries(events.map(e => [e.id, e.min_users]));

  // 3) Balansuj obu grup
  const sunday = balanceAndLog('Sunday', sundayPreferences, minUsersMap);
  const weekly = balanceAndLog('Weekly', weeklyPreferences, minUsersMap);

  return { sunday, weekly };
}

// Balancing with console logging
function balanceAndLog(label, preferences, minUsersMap) {
  console.group(`${label} balance`);
  const assignmentMap = balance(preferences, minUsersMap);
  const assignment = finalize(assignmentMap);

  // 4) Sprawdź każdy event pod kątem jego własnego minUsers
  const counts = assignment.reduce((acc, {eventId}) => {
    acc[eventId] = (acc[eventId]||0) + 1;
    return acc;
  }, {});
  for (let [ev, cnt] of Object.entries(counts)) {
    const req = minUsersMap[+ev] ?? 0;
    if (cnt < req) {
      console.error(`Event ${ev} has ${cnt} users, needs ${req}`);
    }
  }

  console.log(`${label} assignment:`, assignment);
  console.log(
    '❗Users not on highest preference:',
    countNonOptimal(assignment, preferences)
  );
  console.groupEnd();

  return assignment;
}

// balance bierze teraz mapę progów
function balance(prefs, minUsersMap) {
  // jeśli któryś event nie ma szansy osiągnąć swojego progu, od razu przerwij
  if (!checkMinUsers(prefs, Object.values(minUsersMap))) return {};

  // 1) grupowania
  const userPrefs  = groupBy(prefs, 'userId', ({eventId,preference}) => ({eventId,preference}));
  const eventPrefs = groupBy(prefs, 'eventId', ({userId,preference}) => ({userId,preference}));
  sortGroupPreferences(eventPrefs);

  // 2) greedy
  const {assignment, counts} = greedyAssign(userPrefs);

  // 3) wymuś spełnianie progów per-event
  return enforceMinUsers(eventPrefs, assignment, counts, minUsersMap, userPrefs);

}


// Step 1: Greedy assignment
function greedyAssign(userPrefs) {
  const assignment = {};
  const counts = {};

  const users = Object.entries(userPrefs)
    .map(([userId, list]) => {
      const sorted = [...list].sort((a,b) => b.preference - a.preference);
      return { userId, topEvent: sorted[0].eventId };
    });

  // Assign each user to topEvent, count
  users.forEach(({ userId, topEvent }) => {
    assignment[userId] = topEvent;
    counts[topEvent] = (counts[topEvent] || 0) + 1;
  });

  return { assignment, counts };
}

// enforceMinUsers bierze mapę progów zamiast pojedynczej liczby
function enforceMinUsers(eventPrefs, assignment, counts, minUsersMap, userPrefs) {
  for (let ev of Object.keys(eventPrefs)) {
    const req = minUsersMap[+ev]||0;
    while ((counts[ev]||0) < req) {
      const candidate = findCandidate(ev, eventPrefs[ev], assignment, counts, minUsersMap, userPrefs);
      if (!candidate) {
        console.warn(`Cannot fulfill minimum for event ${ev}`);
        break;
      }
      reassign(candidate, ev, assignment, counts);
    }
  }
}

// findCandidate uwzględnia teraz mapę progów (by nie ruszać eventów, które są na styk)
function findCandidate(target, candidates, assignment, counts, minUsersMap, userPrefs) {
  let best = null;
  for (const { userId, preference } of candidates) {
    const from = assignment[userId];
    if (from === target) continue;
    // nie ruszaj eventów, które już są na lub poniżej swojego progu
    if ((counts[from]||0) <= (minUsersMap[+from]||0)) continue;

    const maxPref = Math.max(...userPrefs[userId].map(p=>p.preference));
    const cost = maxPref - preference;
    if (!best || cost < best.cost) {
      best = { userId, from, cost };
    }
  }
  return best;
}

// Perform reassignment and update counts
function reassign({ userId, from }, to, assignment, counts) {
  assignment[userId] = to;
  counts[to] = (counts[to] || 0) + 1;
  counts[from]--;
}

// Helpers
function groupBy(arr, key, mapper) {
  return arr.reduce((acc, item) => {
    const k = item[key];
    if (!acc[k]) acc[k] = [];
    acc[k].push(mapper ? mapper(item) : item);
    return acc;
  }, {});
}

function sortGroupPreferences(eventPrefs) {
  Object.values(eventPrefs).forEach(list => {
    list.sort((a,b) => b.preference - a.preference);
  });
}

function countNonOptimal(assignments, prefs) {
  const maxMap = {};
  prefs.forEach(({ userId, preference }) => {
    maxMap[userId] = Math.max(maxMap[userId] || 0, preference);
  });

  const prefMap = groupBy(prefs, 'userId', ({eventId, preference}) => ({ eventId, preference }));
  return assignments.filter(({ userId, eventId }) => {
    const userEvents = prefMap[userId] || [];
    const assignedPref = (userEvents.find(e => e.eventId === eventId)?.preference) || 0;
    return assignedPref < maxMap[userId];
  }).length;
}

function finalize(raw) {
  return Object.entries(raw).map(([userId, eventId]) => ({
    userId: +userId,
    eventId: +eventId
  }));
}
