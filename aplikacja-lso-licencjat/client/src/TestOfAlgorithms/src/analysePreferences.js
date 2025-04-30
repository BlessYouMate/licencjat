import { runILPAlgorithm } from "../../../../server/services/ILP/algorithm";
import { runMyAlgorithm } from "../../../../server/services/myAlgorithm/algorithm";

/**
 * analyseAssignment:
 *   - Przeprowadza analizę jakości przypisań użytkowników do wydarzeń.
 *   - Dla każdego przypisania oblicza tzw. "gap" (różnicę między
 *     maksymalną preferencją a faktycznym przydziałem).
 *   - Następnie grupuje i wypisuje liczbę użytkowników, którzy zostali
 *     przypisani idealnie (gap=0), lub ile poziomów poniżej swojego top
 *     choice (gap=1,2,…).
 *
 * @param {Array<{userId: number, eventId: number}>} assignmentPart
 *   Tablica z przydziałami: każdy element to obiekt {userId, eventId}.
 * @param {string} label
 *   Etykieta do logów (np. "Sunday" lub "Weekly").
 * @param {Object.<string, Object.<number,number>>} prefMap
 *   Dwupoziomowa mapa preferencji:
 *     prefMap[userId][eventId] === wartość preference (1–5).
 * @param {Object.<string,number>} maxPrefMap
 *   Mapa max preferencji każdego usera:
 *     maxPrefMap[userId] === największa z jego wszystkich preferencji.
 */
const analyseAssignment = (assignmentPart, label, prefMap, maxPrefMap) => {
  // 1) Inicjalizujemy pusty obiekt liczników: gap → count
  //    np. counters[0] będzie liczyć assignmenty idealne,
  //    counters[1] – assignmenty 1 poziom poniżej, itp.
  const counters = {};

  // 2) Iterujemy po każdym przypisaniu { userId, eventId }
  assignmentPart.forEach(({ userId, eventId }) => {
    // 2a) Pobieramy maksymalną preferencję danego usera (mp):
    //     jeśli userId nie istnieje w mapie, przyjmujemy 0
    const mp = maxPrefMap[userId] || 0;

    // 2b) Pobieramy faktyczną prefencję dla eventId:
    //     prefMap[userId]?.[eventId] używa optional chaining,
    //     więc jeśli prefMap[userId] nie istnieje, nie zbijemy błędu,
    //     tylko dostaniemy undefined → ||0 → 0.
    const got = prefMap[userId]?.[eventId] || 0;

    // 2c) Obliczamy gap = ile poziomów preferencji w dół się znalazł:
    //     0 = top-choice, 1 = drugi wybór, itd.
    const gap = mp - got;

    // 2d) Inkrementujemy licznik dla tego gap:
    //     - Za pierwszym razem counters[gap] jest undefined,
    //       więc (undefined || 0) daje 0, +1 → 1.
    //     - Przy kolejnych trafieniach counters[gap] ma np. 1,
    //       więc (1 || 0) → 1, +1 → 2 itd.
    //     Dzięki temu nigdy nie robimy undefined + 1 = NaN.
    counters[gap] = (counters[gap] || 0) + 1;
  });

  // 3) Grupowanie logów: otwieramy konsolową grupę z etykietą
  console.group(`${label} assignment quality report`);

  // 4) Bierzemy klucze licznika (to stringi "0","1","2",…),
  //    mapujemy na liczby, sortujemy rosnąco i wyświetlamy:
  Object.keys(counters)
    .map(Number)               // konwersja ["0","1"] → [0,1]
    .sort((a, b) => a - b)     // sort rosnąco
    .forEach((gap) => {
      // Jeśli gap===0, to idealne przypisania
      if (gap === 0) {
        console.log(`✅ Top‐choice assignments: ${counters[gap]}`);
      } else {
        // W przeciwnym razie informacja o spadku o 'gap' poziomów
        console.log(
          `🔁 Assignments ${gap} preference‐levels down: ${counters[gap]}`
        );
      }
    });

  // 5) Zamykamy grupę logów
  console.groupEnd();
};


// Główna funkcja
async function analysePreferences(algorithm, minUsers) {
  const result = { ok: true, errorMessage: "" };

  // 1) Fetch all preferences
  let prefs = [];
  try {
    const prefsRes = await fetch(`${import.meta.env.VITE_API_URL}/getAllUsersPreferences`, {
      credentials: "include",
    });
    const json = await prefsRes.json();
    prefs = Array.isArray(json.preferences) ? json.preferences : Object.values(json); // upewnienie się że pracujemy na tablicy
  } catch (err) {
    console.error("Could not fetch preferences:", err);
    return; // nie ma sensu dalej analizować bez preferencji
  }

  // 2) Run the assignment algorithm
  let assignment = null;
  try {
    assignment = algorithm === "ilp"
      ? await runILPAlgorithm(minUsers)
      : await runMyAlgorithm(minUsers);
  } catch (err) {
    console.error("Algorithm error:", err);
    return; // nie ma sensu dalej analizować bez assignmentu
  }

  // 3) Przygotuj mapy preferencji

  // prefMap: userId → { eventId → preference }
  // zaczynamy od pustego obiektu
  const prefMap = prefs.reduce((m, { userId, eventId, preference }) => {
    // jeśli to pierwszy zapis dla danego userId, utwórz nową "podmapę"
    if (!m[userId]) {
      m[userId] = {};      // teraz m wygląda np. { '1210': {} }
    }
    // wpisujemy w tej podmapie: dla eventId = preference
    // np. m['1210'][655] = 5
    m[userId][eventId] = preference;
    return m;              // zwracamy akumulator do kolejnej iteracji
  }, {});                  // {} jest wartością początkową m

  /* 
    Po tej redukcji prefMap ma strukturę:
    {
      '1210': { 655: 5, 656: 3, 658: 4, … },
      '1211': { 655: 4, 657: 2, … },
      …
    }
    — klucze to STRINGI (bo klucze obiektu w JS są zawsze stringami),
      wartości to obiekty eventId→preference.
  */


  // maxPrefMap: userId → highestPreference
  // wyciągamy wpisy z prefMap jako tablicę [userId, eventsObj]
  const maxPrefMap = Object.fromEntries(
    Object
      .entries(prefMap)            // → [ ['1210', {655:5,…}], ['1211', {655:4,…}], … ]
      .map(([userId, events]) => {
        // Object.values(events) → np. [5,3,4,…]
        // Math.max(...values) → 5 (największa preferencja tego usera)
        const highest = Math.max(...Object.values(events));
        return [userId, highest];  // → ['1210', 5]
      })
  );
  /*
    After fromEntries, maxPrefMap = {
      '1210': 5,
      '1211': 4,
      …
    }
    — klucze: userId (stringi), wartości: maksymalne preference (liczby).
  */


  // 4) Analizuj przypisania
  try {
    analyseAssignment(assignment.sunday, "Sunday", prefMap, maxPrefMap);
    analyseAssignment(assignment.weekly, "Weekly", prefMap, maxPrefMap);
  } catch (err) {
    console.error("Error analyzing assignments:", err);
    result.ok = false;
    result.errorMessage = "Error analyzing assignments: " + err.message;
  }

  return result;
}

export { analysePreferences };
