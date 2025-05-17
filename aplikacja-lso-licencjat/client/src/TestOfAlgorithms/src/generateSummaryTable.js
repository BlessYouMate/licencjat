function generateSummaryTable(byUserAssignments, prefMap, label, executionTimeMs) {
  let totalUsers = 0;
  const suboptimalCounts = {};
  let totalPreferenceSum = 0;
  let totalAssignedEvents = 0;

  for (const [userIdStr, evList] of Object.entries(byUserAssignments)) {
    const userId = Number(userIdStr);
    const userPrefs = prefMap[userId] || {};

    const assignedPrefs = evList.map(eid => userPrefs[eid] ?? 0);
    const sortedPrefs = Object.values(userPrefs).sort((a, b) => b - a);
    const idealPrefs = sortedPrefs.slice(0, evList.length);

    let mismatches = 0;
    for (let i = 0; i < evList.length; i++) {
      const got = assignedPrefs[i] ?? 0;
      const top = idealPrefs[i] ?? 0;
      if (got < top) mismatches++;
    }

    suboptimalCounts[mismatches] = (suboptimalCounts[mismatches] || 0) + 1;

    totalUsers++;
    totalPreferenceSum += assignedPrefs.reduce((a, b) => a + b, 0);
    totalAssignedEvents += evList.length;
  }

  const avgPreference = (totalAssignedEvents > 0)
    ? (totalPreferenceSum / totalAssignedEvents).toFixed(2)
    : "-";

  // Budujemy dynamiczną listę wskaźników dla suboptymalnych
  const suboptimalRows = Object.keys(suboptimalCounts)
    .map(Number)
    .sort((a, b) => a - b)
    .map(k => ({
      "Wskaźnik": k === 0
        ? "Z idealnym przypisaniem"
        : `Z ${k} suboptymalnym${k > 1 ? 'i' : ''}`,
      "Wartość": suboptimalCounts[k]
    }));

  // Składanie całej tabeli
  const summary = [
    { "Wskaźnik": "Liczba użytkowników", "Wartość": totalUsers },
    ...suboptimalRows,
    { "Wskaźnik": "Suma preferencji przypisań", "Wartość": totalPreferenceSum },
    { "Wskaźnik": "Średnia preferencja przypisań", "Wartość": avgPreference },
    { "Wskaźnik": "Czas wykonania (ms)", "Wartość": executionTimeMs?.toFixed(2) ?? "-" }
  ];

  console.log(`📋 Podsumowanie (${label}):`);
  console.table(summary);
}

export { generateSummaryTable };
