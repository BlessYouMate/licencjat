import GLPK from 'glpk.js';
import { fetchData, preprocessPreferences, checkMinUsers } from '../schedulerMinReq.js';
import { prepareILPData, buildDecisionVariables, buildILPModel } from './model.js';

async function solveILPForPrefs(prefs, minUsersMap, numOfEventPerUser, label) {
  console.group(label, 'ILP solve');

  // 1) dla każdego eventu wyciągamy jego minUsers
  const eventIds = Array.from(new Set(prefs.map(p => p.eventId)));
  // 2) sprawdzamy, czy w ogóle da się spełnić minima:
  for (let ev of eventIds) {
    const havePrefs = prefs.filter(p => p.eventId === +ev).length;
    const wantMin = minUsersMap[ev] ?? 0;
    if (havePrefs < wantMin) {
      console.warn(`${label}: insufficient prefs for event ${ev} (have ${havePrefs}, need ${wantMin}), skipping.`);
      console.groupEnd();
      return [];
    }
  }

  // 3) budujemy ILP
  const { uniqueUsers, uniqueEvents } = prepareILPData(prefs);
  const decisionVariables = buildDecisionVariables(uniqueUsers, uniqueEvents, prefs);
  const glpk = await GLPK();
  //Budowa modelu ILP
  const fullModel = buildILPModel(
    decisionVariables,
    uniqueUsers,
    uniqueEvents,
    minUsersMap,
    numOfEventPerUser,
    glpk
  );
  console.log(label, 'ILP model:', fullModel);

  // 4) solve
  const result = await glpk.solve(fullModel, glpk.GLP_MSG_OFF);
  if (!result?.result?.vars) {
    console.error(`${label}: ILP failed`);
    console.groupEnd();
    return [];
  }

  // 5) parsowanie
  const assignment = [];
  for (let v in result.result.vars) {
    if (result.result.vars[v] === 1) {
      const [, u, e] = v.split('_');
      assignment.push({ userId: +u, eventId: +e });
    }
  }
  console.log(label, 'assignment:', assignment);
  console.groupEnd();
  return assignment;
}

export async function runILPAlgorithm(numOfEventPerUser) {
  const raw = await fetchData();
  const { sundayPreferences, weeklyPreferences } = preprocessPreferences(raw);

  // pobieramy min_users per‐event
  const evRes = await fetch(`${import.meta.env.VITE_API_URL}/getAllEvents`, {
    credentials: 'include'
  });
  if (!evRes.ok) throw new Error('Cannot load events');
  const { events } = await evRes.json();
  const minUsersMap = Object.fromEntries(events.map(e => [e.id, e.min_users]));

  const sunday = await solveILPForPrefs(sundayPreferences, minUsersMap, numOfEventPerUser, 'Sunday');
  const weekly = await solveILPForPrefs(weeklyPreferences, minUsersMap, numOfEventPerUser, 'Weekly');

  return { sunday, weekly };
}
