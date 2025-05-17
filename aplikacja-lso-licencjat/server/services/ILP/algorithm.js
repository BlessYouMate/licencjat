import GLPK from 'glpk.js';
import { fetchData, preprocessPreferences, checkMinUsers } from '../schedulerMinReq.js';
import { prepareILPData, buildDecisionVariables, buildILPModel } from './model.js';

import db from "../../config/db.js"

async function solveILPForPrefs(prefs, minUsersMap, numOfEventsPerUser, label) {
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
  console.warn(decisionVariables)
  const glpk = await GLPK();
  //Budowa modelu ILP
  const fullModel = buildILPModel(
    decisionVariables,
    uniqueUsers,
    uniqueEvents,
    minUsersMap,
    numOfEventsPerUser,
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

export async function runILPAlgorithm(numOfEventsPerUser) {
  const raw = await fetchData();
  const { sundayPreferences, weeklyPreferences } = preprocessPreferences(raw);

  // pobieramy min_users per‐event
  const { rows: events } = await db.query("SELECT * FROM events;");
  const minUsersMap = Object.fromEntries(events.map(e => [e.id, e.min_users]));


  const sunday = await solveILPForPrefs(sundayPreferences, minUsersMap, numOfEventsPerUser, 'Sunday');
  const weekly = await solveILPForPrefs(weeklyPreferences, minUsersMap, numOfEventsPerUser, 'Weekly');

  return { sunday, weekly };
}
