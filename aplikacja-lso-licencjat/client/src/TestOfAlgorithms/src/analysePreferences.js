import { generateSummaryTable } from "./generateSummaryTable";


async function callILP(minUsers) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/algorithms/run-ilp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ minUsers }),
    credentials: 'include',
  });
  const json = await res.json();
  console.log("ILP result:", json);
  return json; 
}


async function callCustom(minUsers) {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/algorithms/run-custom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ minUsers }),
    credentials: 'include',
  });
  const json = await res.json();
  console.log("Custom result:", json);
  return json; 
}


/**
 * analyseAssignment:
 *   - assignmentPart: [{ userId, eventId }, …] — n eventów na usera
 *   - prefMap: { userId: { eventId: pref, … }, … }
 */
function analyseAssignment(assignmentPart, label, prefMap, executionTimeMs) {
  // 1) Grupujemy przypisania po userze
  const byUser = assignmentPart.reduce((acc, { userId, eventId }) => {
    (acc[userId] ||= []).push(eventId);
    return acc;
  }, {});

  // 2) Zlicznik + szczegóły użytkowników z błędami
  const counters = {};
  const detailed = [];

  for (const [uStr, evList] of Object.entries(byUser)) {
    const userId = Number(uStr);
    const userPrefs = prefMap[userId] || {};

    const gotPrefs = evList
      .map(eid => ({
        eventId: eid,
        preference: userPrefs[eid] ?? 0
      }))
      .sort((a, b) => b.preference - a.preference);

    const topPrefs = Object.entries(userPrefs)
      .sort(([, aPref], [, bPref]) => bPref - aPref)
      .slice(0, evList.length)
      .map(([eventId, preference]) => ({
        eventId: Number(eventId),
        preference
      }));

    let mismatches = 0;
    for (let i = 0; i < evList.length; i++) {
      const got = gotPrefs[i]?.preference ?? 0;
      const top = topPrefs[i]?.preference ?? 0;
      if (got < top) mismatches++;
    }

    counters[mismatches] = (counters[mismatches] || 0) + 1;

    if (mismatches > 0) {
      detailed.push({ userId, gotPrefs, topPrefs, mismatches });
    }
  }

  // 3) Raport ogólny
  console.group(`${label} assignment quality`);
  Object.keys(counters)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach(k => {
      if (k === 0) {
        console.log(`✅ Perfect (all n events optimal): ${counters[k]} users`);
      } else {
        console.log(`🔁 ${counters[k]} users have ${k} suboptimal assignments`);
      }
    });

  // 4) Szczegóły dla użytkowników z błędami
  if (detailed.length > 0) {
    console.groupCollapsed("🔍 Details for suboptimal users");
    for (const { userId, gotPrefs, topPrefs, mismatches } of detailed) {
      console.group(`User ${userId} — ${mismatches} suboptimal`);
      console.log("🟩 Got:", gotPrefs);
      console.log("🟦 Best possible:", topPrefs);
      console.groupEnd();
    }
    console.groupEnd();
  }

  generateSummaryTable(byUser, prefMap, label, executionTimeMs);


  console.groupEnd();
}

// Główna funkcja
async function analysePreferences(algorithm, numOfEventPerUser) {
  const result = { ok: true, errorMessage: "" };

// 1) Pobierz wszystkie preferencje
  let prefs = [];
  try {
    const prefsRes = await fetch(
      `${import.meta.env.VITE_API_URL}/getAllUsersPreferences`,
      { credentials: "include" }
    );
    const json = await prefsRes.json();
    prefs = Array.isArray(json.preferences)
      ? json.preferences
      : Object.values(json);
  } catch (err) {
    console.error("Could not fetch preferences:", err);
    return;
  }

// 2) Uruchom algorytmy przypisujące i zmierz czas ich wykonania
  const assignments = {};
  let ilpExecutionTime = null;
  let customExecutionTime = null;
  try {
    

    if (algorithm === "ilp" || algorithm === "both") {
      const t0 = performance.now();
      assignments.ilp = await callILP(numOfEventPerUser);
      const t1 = performance.now();
      ilpExecutionTime = t1 - t0;
      console.log(`⏱ ILP algorithm execution time: ${ilpExecutionTime.toFixed(3)} ms`);
    }

    if (algorithm === "custom" || algorithm === "both") {
      const t0 = performance.now();
      assignments.custom = await callCustom(numOfEventPerUser);
      const t1 = performance.now();
      customExecutionTime = t1 - t0;
      console.log(`⏱ Custom algorithm execution time: ${customExecutionTime.toFixed(3)} ms`);
    }

  } catch (err) {
    console.error("Algorithm error:", err);
    return;
  }

// 3) Przygotuj mapę preferencji: userId → { eventId → preferencja }
  const prefMap = prefs.reduce((m, { userId, eventId, preference }) => {
    if (!m[userId]) m[userId] = {};
    m[userId][eventId] = preference;
    return m;
  }, {});

// 4) Przeanalizuj przypisania dla każdego algorytmu
  try {
    if (assignments.ilp) {
      console.group("📊 ILP ALGORITHM ANALYSIS");
      const { sunday: ilpSunday, weekly: ilpWeekly } = assignments.ilp.result || {};
      if (Array.isArray(ilpSunday)) {
        analyseAssignment(ilpSunday, "Sunday", prefMap, ilpExecutionTime);
      }
      if (Array.isArray(ilpWeekly)) {
        analyseAssignment(ilpWeekly, "Weekly", prefMap, ilpExecutionTime);
      }


      console.groupEnd();
    }
    if (assignments.custom) {
      console.group("🧠 CUSTOM ALGORITHM ANALYSIS");
      const { sunday: customSunday, weekly: customWeekly } = assignments.custom.result || {};
      if (Array.isArray(customSunday)) {
        analyseAssignment(customSunday, "Sunday", prefMap, customExecutionTime);
      }
      if (Array.isArray(customWeekly)) {
        analyseAssignment(customWeekly, "Weekly", prefMap, customExecutionTime);
      }

      console.groupEnd();
    }
  } catch (err) {
    console.error("Error analyzing assignments:", err);
    result.ok = false;
    result.errorMessage = "Error analyzing assignments: " + err.message;
  }

  return result;
}

export { analysePreferences };
