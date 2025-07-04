import { fetchData, preprocessPreferences, checkMinUsers } from '../schedulerMinReq.js';

import db from "../../config/db.js"

export async function runMyAlgorithm(numOfEventsPerUserInput) {
  // 1) Rzutujemy parametr do liczby
  const numOfEventsPerUser = Number(numOfEventsPerUserInput) || 1;

  // 2) Ładujemy preference
  const rawPrefs = await fetchData();
  const { weeklyPreferences, sundayPreferences } = preprocessPreferences(rawPrefs);

  // 3) Ładujemy min_users z bazy
  const { rows: events } = await db.query("SELECT * FROM events;");
  const minUsersMap = Object.fromEntries(events.map(e => [Number(e.id), Number(e.min_users)]));

  // 4) Balansujemy i poprawiamy lokalnie
  const sunday = balanceAndImprove('Sunday', sundayPreferences, minUsersMap, numOfEventsPerUser);
  const weekly = balanceAndImprove('Weekly', weeklyPreferences, minUsersMap, numOfEventsPerUser);

  return { sunday, weekly };
}

function balanceAndImprove(label, prefs, minUsersMap, numOfEventsPerUser) {
  console.group(`${label} balance`);
  // 1) greedy + enforce minima
  const { assignment, counts, userPrefs, eventPrefs } =
    initialBalance(prefs, minUsersMap, numOfEventsPerUser);

    const result1 = finalize(assignment);
  console.log(`${label} final assignment:`, result1);
  // 2) lokalne przeszukiwanie 2-opt
  doTwoOptSwap(assignment, counts, userPrefs, minUsersMap);

  // 3) finalizacja
  const result = finalize(assignment);
  console.log(`${label} final assignment:`, result);
  console.groupEnd();
  return result;
}

// 1) wstępne przypisanie
function initialBalance(prefs, minUsersMap, numOfEventsPerUser) {
  // walidacja
  if (!checkMinUsers(prefs, Object.values(minUsersMap))) return { assignment: {}, counts: {}, userPrefs:{}, eventPrefs:{} };

  const userPrefs  = groupBy(prefs, 'userId', ({ eventId, preference }) => ({
    eventId: Number(eventId), preference
  }));
  const eventPrefs = groupBy(prefs, 'eventId', ({ userId, preference }) => ({
    userId: Number(userId), preference
  }));

  sortGroupPreferences(eventPrefs);

  // greedy + enforce
  const { assignment, counts } = greedyAssign(userPrefs, numOfEventsPerUser);
  enforceMinUsers(eventPrefs, assignment, counts, minUsersMap, userPrefs);

  return { assignment, counts, userPrefs, eventPrefs };
}

// 2) 2-opt: dla każdej pary użytkowników próbujemy swap ich przydziałów
function doTwoOptSwap(assignment, counts, userPrefs, minUsersMap) {
  let improved = true;
  while (improved) {
    improved = false;
    const users = Object.keys(assignment).map(u=>Number(u));
    for (let i = 0; i < users.length && !improved; i++) {
      for (let j = i+1; j < users.length && !improved; j++) {
        const u1 = users[i], u2 = users[j];
        const evList1 = assignment[u1];
        const evList2 = assignment[u2];

        // próbujemy swap każdego ev1 z ev2
        for (let a = 0; a < evList1.length && !improved; a++) {
          for (let b = 0; b < evList2.length && !improved; b++) {
            const e1 = evList1[a], e2 = evList2[b];
            if (e1 == null || e2 == null) continue;
            if (e1 === e2) continue;

            // oblicz zysk z swapu
            const p1before = userPrefs[u1].find(p=>p.eventId===e1)?.preference||0;
            const p2before = userPrefs[u2].find(p=>p.eventId===e2)?.preference||0;
            const p1after  = userPrefs[u1].find(p=>p.eventId===e2)?.preference||0;
            const p2after  = userPrefs[u2].find(p=>p.eventId===e1)?.preference||0;
            const delta = (p1after + p2after) - (p1before + p2before);
            if (delta <= 0) continue;  // tylko poprawiające

            // wykonaj swap
            evList1[a] = e2;
            evList2[b] = e1;
            counts[e1]--; counts[e2]--;
            counts[e2]++; counts[e1]++;
            improved = true;
          }
        }
      }
    }
  }
}

function greedyAssign(userPrefs, numOfEventsPerUser) {
  const assignment = {}, counts = {};
  for (const [userIdStr, prefs] of Object.entries(userPrefs)) {
    const userId = Number(userIdStr);
    const top = [...prefs].sort((a,b)=>b.preference-a.preference)
                        .slice(0,numOfEventsPerUser)
                        .map(p=>p.eventId);
    while (top.length < numOfEventsPerUser) top.push(null);
    assignment[userId] = top;
    top.forEach(eid=>{ if(eid!=null) counts[eid]=(counts[eid]||0)+1 });
  }
  return { assignment, counts };
}

function enforceMinUsers(eventPrefs, assignment, counts, minUsersMap, userPrefs) {
  for (const evStr of Object.keys(eventPrefs)) {
    const evId = Number(evStr), req = minUsersMap[evId]||0;
    while ((counts[evId]||0) < req) {
      const cand = findCandidate(
                                  evId, 
                                  eventPrefs[evStr], 
                                  assignment, 
                                  counts,
                                  minUsersMap, 
                                  userPrefs
                                );
      if (!cand) break;
      const { userId, from, to } = cand;
      const arr = assignment[userId];
      const idx = arr.indexOf(from);
      arr[idx] = to;
      counts[to] = (counts[to]||0)+1;
      counts[from]--;
    }
  }
}

function findCandidate(
  targetEv, 
  candidates,
  assignment, 
  counts, 
  minUsersMap, 
  userPrefs) {
  let best = null;
  for (const { userId } of candidates) {
    const fromList = assignment[userId]||[];
    if (fromList.includes(targetEv)) continue;
    for (const fromEv of fromList) {
      if (fromEv==null) continue;
      if ((counts[fromEv]||0) > (minUsersMap[fromEv]||0)) {
        const fromPref = userPrefs[userId].find(p => p.eventId === fromEv)?.preference || 0;
        const targetPref = userPrefs[userId].find(p => p.eventId === targetEv)?.preference || 0;
        const cost = fromPref - targetPref;
        if (!best || cost < best.cost) best = { userId, from: fromEv, to: targetEv, cost };
        break;
      }
    }
  }
  return best;
}

function groupBy(arr, key, mapFn) {
  return arr.reduce((acc, item) => {
    const k = item[key];
    (acc[k] ||= []).push(mapFn(item));
    return acc;
  }, {});
}

function sortGroupPreferences(eventPrefs) {
  Object.values(eventPrefs).forEach(list=>list.sort((a,b)=>b.preference-a.preference));
}

function finalize(raw) {
  const out = [];
  for (const [uStr, evList] of Object.entries(raw)) {
    const uid = Number(uStr);
    if (!Array.isArray(evList)) continue;
    evList.forEach(eid => {
      if (eid != null) out.push({ userId: uid, eventId: Number(eid) });
    });
  }
  return out;
}
