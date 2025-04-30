import GLPK from 'glpk.js';
import { fetchData, preprocessPreferences, checkMinUsers } from '../schedulerMinReq.js';
import { prepareILPData, buildDecisionVariables, buildILPModel } from './model.js';

// Wspólna funkcja rozwiązująca ILP dla podanych preferencji
const solveILPForPrefs = async (prefs, minUsers, label) => {
  // 1) Walidacja minimalnej liczby użytkowników
  if (!checkMinUsers(prefs, minUsers)) {
    console.warn(`${label}: insufficient users to satisfy minUsers (${minUsers}), skipping.`);
    return [];
  }

  // 2) Przygotowanie danych dla ILP (unikalni użytkownicy i eventy)
  const { uniqueUsers, uniqueEvents } = prepareILPData(prefs);
  // 3) Zmienne decyzyjne
  const decisionVariables = buildDecisionVariables(uniqueUsers, uniqueEvents, prefs);
  console.log(`${label} decision variables:`, decisionVariables);

  // 4) Inicjalizacja solvera
  const glpkInstance = await GLPK();
  // 5) Budowa modelu ILP
  const model = buildILPModel(decisionVariables, uniqueUsers, uniqueEvents, minUsers, glpkInstance);
  console.log(`${label} ILP model:`, model);

  // 6) Rozwiązanie modelu
  const result = await glpkInstance.solve(model, glpkInstance.GLP_MSG_OFF);
  if (!result?.result?.vars) {
    console.error(`${label}: failed to solve ILP!`);
    return [];
  }

  // 7) Parsowanie wyniku: tylko zmienne z wartością 1
  const assignment = [];
  for (let varName in result.result.vars) {
    if (result.result.vars[varName] === 1) {
      const [, userStr, eventStr] = varName.split('_');
      assignment.push({ userId: +userStr, eventId: +eventStr });
    }
  }
  console.log(`${label} assignment:`, assignment);
  return assignment;
};

const analyzePreferenceDrops = (preferences, assignment) => {
  // Grupuj preferencje użytkowników
  const userPrefMap = {};
  preferences.forEach(({ userId, eventId, preference }) => {
    if (!userPrefMap[userId]) {
      userPrefMap[userId] = {};
    }
    userPrefMap[userId][eventId] = preference;
  });

  let usersDropped = 0;
  let totalDropLevels = 0;

  assignment.forEach(({ userId, eventId }) => {
    const assignedPref = userPrefMap[userId]?.[eventId];
    const maxPref = Math.max(...Object.values(userPrefMap[userId] || {}));

    if (assignedPref !== undefined && assignedPref < maxPref) {
      const drop = maxPref - assignedPref;
      usersDropped += 1;
      totalDropLevels += drop;
      console.log(`User ${userId} assigned to preference ${assignedPref}, max was ${maxPref}, dropped ${drop} level(s).`);
    }
  });

  console.warn(`\nTotal users who dropped: ${usersDropped}`);
  console.warn(`Total preference levels dropped: ${totalDropLevels}`);
};


// Główna funkcja uruchamiająca ILP dla niedzielnych i tygodniowych preferencji
const runILPAlgorithm = async (settedMinUsers) => {
  // Pobranie i przetworzenie preferencji
  const preferences = await fetchData();
  const { weeklyPreferences, sundayPreferences } = preprocessPreferences(preferences);
  const minUsers = settedMinUsers;

  // Uruchamiamy dla Sunday i Weekly bez powtarzania kodu
  const sundayAssignment = await solveILPForPrefs(sundayPreferences, minUsers, 'Sunday');
  analyzePreferenceDrops(sundayPreferences, sundayAssignment);
  const weeklyAssignment = await solveILPForPrefs(weeklyPreferences, minUsers, 'Weekly');
  analyzePreferenceDrops(weeklyPreferences, weeklyAssignment);

  // Zwracamy obiekt z dwoma tablicami tak jak oczekiwano
  return {
    sunday: sundayAssignment,
    weekly: weeklyAssignment
  };
};

export { runILPAlgorithm };
