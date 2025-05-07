import { fetchData, preprocessPreferences, checkMinUsers } from '../schedulerMinReq.js';

export async function runMyAlgorithm(minUsers) {
  const rawPrefs = await fetchData();
  const { weeklyPreferences, sundayPreferences } = preprocessPreferences(rawPrefs);
  console.warn(weeklyPreferences)

  const sunday = balanceAndLog('Sunday', sundayPreferences, minUsers);
  const weekly = balanceAndLog('Weekly', weeklyPreferences, minUsers);

  return { sunday, weekly };
}

// Balancing with console logging
function balanceAndLog(label, preferences, minUsers) {
  console.group(`${label} balance`);
  const assignmentMap = balance(preferences, minUsers);
  const assignment = finalize(assignmentMap);

  // Verify each event meets minUsers
  const eventCounts = assignment.reduce((acc, { eventId }) => {
    acc[eventId] = (acc[eventId] || 0) + 1;
    return acc;
  }, {});
  Object.entries(eventCounts).forEach(([eventId, count]) => {
    if (count < minUsers) {
      console.error(
        `Event ${eventId} has only ${count} users assigned, below minUsers=${minUsers}`
      );
    }
  });

  console.log(`${label} assignment:`, assignment);
  console.log(
    '❗Users not on highest preference:',
    countNonOptimal(assignment, preferences)
  );
  console.groupEnd();

  return assignment;
}

// Main balancing function
function balance(prefs, minUsers) {
  if (!checkMinUsers(prefs, minUsers)) return {};

  const userPrefs = groupBy(prefs, 'userId', ({eventId, preference}) => ({ eventId, preference }));
  const eventPrefs = groupBy(prefs, 'eventId', ({userId, preference}) => ({ userId, preference }));
  sortGroupPreferences(eventPrefs);

  const { assignment, counts } = greedyAssign(userPrefs);
  return enforceMinUsers(eventPrefs, assignment, counts, minUsers, userPrefs);
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

// Step 2: Enforce minUsers with fallback
function enforceMinUsers(eventPrefs, assignment, counts, minUsers, userPrefs) {
  Object.keys(eventPrefs).forEach(eventId => {
    while ((counts[eventId] || 0) < minUsers) {
      const candidate = findCandidate(eventId, eventPrefs[eventId], assignment, counts, minUsers, userPrefs);
      if (!candidate) {
        console.warn(`Cannot fulfill minimum for event ${eventId}`);
        break;
      }
      reassign(candidate, eventId, assignment, counts);
    }
  });
  return assignment;
}

// Select user best to move
function findCandidate(target, candidates, assignment, counts, minUsers, userPrefs) {
  let best = null;
  for (const { userId, preference } of candidates) {
    const current = assignment[userId];
    if (current === target) continue;
    if ((counts[current] || 0) <= minUsers) continue;

    const maxPref = Math.max(...userPrefs[userId].map(p => p.preference));
    const cost = maxPref - preference;
    if (!best || cost < best.cost) {
      best = { userId, from: current, cost };
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
