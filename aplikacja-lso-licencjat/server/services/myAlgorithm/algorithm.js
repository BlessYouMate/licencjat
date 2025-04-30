import { fetchData, preprocessPreferences, checkMinUsers } from '../schedulerMinReq.js';

/**
 * balance:
 *   Główna funkcja przypisania użytkowników do eventów na podstawie preferencji.
 *   Wykonuje dwa etapy:
 *     1) "Greedy": każdy user ląduje na evencie o najwyższej swojej preferencji.
 *     2) "Balansowanie": przenoszenie użytkowników z eventów z nadwyżką do tych z niedoborem,
 *        minimalizując spadek ich satysfakcji.
 *
 *  Struktury danych:
 *
 *    prefs = [
 *      {userId: 101, eventId: 201, preference: 5},
 *      {userId: 101, eventId: 202, preference: 3},
 *      {userId: 102, eventId: 201, preference: 4},
 *      ...
 *    ]
 *
 *    users = [101, 102, ...]
 *    events = [201, 202, ...]
 *
 *    prefMap = {
 *      101: {201:5, 202:3, ...},
 *      102: {201:4, ...},
 *      ...
 *    }
 *
 *    assignmentMap = {101:201, 102:201, ...}
 *    counts = {201:2, 202:0, ...}
 */
const balance = (prefs, minUsers) => {
  // 0) Walidacja: sprawdzamy, czy każde event może osiągnąć minUsers
  if (!checkMinUsers(prefs, minUsers)) return [];

  let movedUsers = 0;
  // 1) Wyciągamy unikalnych użytkowników i eventy
  //    users = [101,102,...], events = [201,202,...]
  const users = Array.from(new Set(prefs.map(p => p.userId)));
  const events = Array.from(new Set(prefs.map(p => p.eventId)));

  // 2) Budujemy prefMap: userId -> (eventId -> preference)
  //    prefMap[101] = {201:5,202:3,...}
  // tworzymy mape prefrencji dla każdego użytkownika do której możemy się dostać w czasie O(1)
  // prefMap[user][event] = preference
  const prefMap = {};
  prefs.forEach(({ userId, eventId, preference }) => {
    prefMap[userId] = prefMap[userId] || {};
    prefMap[userId][eventId] = preference;
  });

  // 3) "Greedy" assignment: początkowe przypisania
  //    Dla każdego user sortujemy kopię events malejąco według jego preferencji
  //    assignmentMap[101] = 201 (najwyższa pref dla usera 101)
  // dla każdego użytkownika sortujemy eventy malejąco tak by w sorted event z największym priorytetem był w indeksie 0 
  const assignmentMap = {};
  users.forEach(u => {
    const sorted = events
      .slice() // tworzy kopie aby events nie było modyfikowane ( events.slice() = copy => copy.sort() )
      .sort((a, b) => (prefMap[u][b] || 0) - (prefMap[u][a] || 0)); // sort malejąco po prefMap[u]
    assignmentMap[u] = sorted[0];
  });

  // 4) Budujemy counts: eventId -> liczba przypisanych userów
  //    counts = {201:2,202:0,...}
  const counts = events.reduce((acc, e) => {
    acc[e] = 0;
    return acc; // zwracamy obiekt gdzie dla każdego eventu mamy licznik ustawiony na 0 czyli: {id: 0, id: 0 ...}
  }, {});
  Object.values(assignmentMap).forEach(e => counts[e]++); // dla każdej wartości w assigmentMap (czyli eventów) 
                                                          // zmieniamy licznik w counts o 1. Zostajemy z liczbą danych eventów w counts

  // 5) Balansowanie: przenosimy userów aż każdy event ma >= minUsers                                                        
  const MAX_PREF = Math.max(...prefs.map(p => p.preference)); // największa ustawiona preferencja w danych

  while (true) {
    // 5.1) Wybieramy eventy poniżej minimum
    const shortEvents = events.filter(e => counts[e] < minUsers); // filtrowane są eventy które mają mniej niż wymagane minimum
    if (shortEvents.length === 0) break;
    const E_short = shortEvents[0];

    let moved = false;
    // 5.2) Próbujemy kogoś przenieść minimalizując gap
    for (let pref = MAX_PREF - 1; pref >= 1 && !moved; pref--) {
      const richEvents = events
        .filter(e => counts[e] > minUsers)
        .sort((a, b) => counts[b] - counts[a]); // sortowanie malejące

      for (const E_rich of richEvents) {
        const candidate = users.find(u =>
          assignmentMap[u] === E_rich && (prefMap[u][E_rich] || 0) === pref // rozważany jest event który ma nadmiar
                                                                            // sprawdzane jest czy user jest w tym evencie
                                                                            // jeśli jest to sprawdzamy czy jego preferencja dla E_rich == pref
        );
        if (candidate !== undefined) { // kandydat znaleziony, przenosimy
          counts[E_rich]--;
          assignmentMap[candidate] = E_short;
          counts[E_short]++;
          moved = true;
          movedUsers++;
          const newPref = prefMap[candidate][E_short] || 0;
          console.warn(`Moved user ${candidate} from ${E_rich} (pref ${pref}) → ${E_short} (pref ${newPref})`);

          break;
        }
      }
    }

    // 5.3) Fallback: jeśli nie znaleziono idealnego kandydata, zabieramy
    //        najgorszego z najbardziej przepełnionego eventu
    if (!moved) {
      // wybierz event z największą nadwyżką
      let randomFallback = false
      const richEvents = events
        .filter(e => counts[e] > minUsers)
        .sort((a, b) => counts[b] - counts[a]);
      if (richEvents.length) {
        const E_rich = richEvents[0];
        // kandydaci: wszyscy użytkownicy przypisani do E_rich
        const candidates = users.filter(u => assignmentMap[u] === E_rich);
        // wybierz spośród nich tego o NAJNŻSZEJ preferencji dla E_rich
        let worstPref = Infinity, candidate;
        for (let u of candidates) {
          const p = prefMap[u][E_rich] || 0;
          if (p < worstPref) {
            worstPref = p;
            candidate = u;
          }
        }
        // jeśli dalej undefined (co jest mało prawdopodobne), wyrzuć losowo
        if (candidate === undefined && candidates.length) {
          candidate = candidates[Math.floor(Math.random() * candidates.length)];
          randomFallback = true
        }
        else{
          randomFallback = false
        }
        // przenieś
        counts[E_rich]--;
        assignmentMap[candidate] = E_short;
        counts[E_short]++;
        moved = true;
        movedUsers++;
        const newPref = prefMap[candidate][E_short] || 0;
        console.warn(`Fallback moved user ${candidate} from ${E_rich} (pref ${worstPref}) → ${E_short} (pref ${newPref}).`,
           `Fallback type: ${randomFallback ? "random fallback" : "normal fallback"}`);

      }
    }

    // 5.4) Jeśli nadal nic nie przeniesiono, kończymy pętlę
    if (!moved) {
      console.warn(`Brak eventów z nadwyżką, nie przeniesiono nikogo do ${E_short}. Kończę.`);
      break;
    }
  }

  // konwersja na tablicę
  const assignment = Object.entries(assignmentMap).map(
    ([userId, eventId]) => ({ userId: +userId, eventId }) // + konwertuje string na liczbe (klucze są string zawsze)
  );

  console.warn("Przeniesiono:", movedUsers, "użytkowników")
  return assignment;
};

// 6) Konwersja mapy na tablicę {userId, eventId}
const runMyAlgorithm = async (settedMinUsers) => {
  const preferences = await fetchData();
  const { weeklyPreferences, sundayPreferences } = preprocessPreferences(preferences);

  console.group(`Sunday balance`);
  const sundayAssignment = balance(sundayPreferences, settedMinUsers); // przypisanie dla niedzieli
  console.log("Sunday assignment:", sundayAssignment);
  console.groupEnd();

  console.group(`Weekly balance`);
  const weeklyAssignment = balance(weeklyPreferences, settedMinUsers); // przypisanie dla tygodnia
  console.log("Weekly assignment:", weeklyAssignment);
  console.groupEnd();
  return {
    sunday: sundayAssignment,
    weekly: weeklyAssignment
  };
};

export { runMyAlgorithm };
