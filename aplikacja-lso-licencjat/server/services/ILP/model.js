// Funkcja do przygotowania danych wejściowych dla modelu ILP
const prepareILPData = (preferences) => {
    // Wyodrębniamy unikalnych użytkowników z listy preferencji
    const uniqueUsers = Array.from(new Set(preferences.map(p => p.userId)));
    // Wyodrębniamy unikalne wydarzenia z listy preferencji
    const uniqueEvents = Array.from(new Set(preferences.map(p => p.eventId)));

    console.log("Unikalni użytkownicy:", uniqueUsers);
    console.log("Unikalne wydarzenia:", uniqueEvents);

    // Zwracamy unikalnych użytkowników i wydarzenia do dalszego przetwarzania
    return { uniqueUsers, uniqueEvents };
};

// Funkcja budująca zmienne decyzyjne dla modelu ILP
const buildDecisionVariables = (uniqueUsers, uniqueEvents, preferences) => {
    const variables = [];

    uniqueUsers.forEach(user => {
        uniqueEvents.forEach(event => {
            // Szukamy preferencji danego użytkownika dla danego eventu
            const entry = preferences.find(p => p.userId === user && p.eventId === event);
            // Jeśli użytkownik podał preferencję dla eventu, pobieramy wartość, inaczej 0
            const coef = entry ? entry.preference : 0;

            // Tworzymy zmienną decyzyjną x_user_event
            variables.push({
                name: `x_${user}_${event}`, // Nazwa zmiennej w solverze
                user,                      // ID użytkownika
                event,                     // ID wydarzenia
                coef                        // Waga preferencji (do maksymalizacji)
            });
        });
    });

    return variables; // Zwracamy wszystkie zmienne decyzyjne

    /* Przykład struktury zwracanych danych:
    [
        { name: 'x_1_1', user: 1, event: 1, coef: 4 },
        { name: 'x_1_2', user: 1, event: 2, coef: 2 },
        { name: 'x_2_1', user: 2, event: 1, coef: 5 },
        { name: 'x_2_2', user: 2, event: 2, coef: 1 },
        ...
    ]
    Każdy wpis oznacza możliwe przypisanie użytkownika do eventu wraz z oceną preferencji.
    */
};

// Funkcja budująca kompletny model ILP do rozwiązania
// buildILPModel teraz przyjmuje minUsersMap zamiast jednej liczby
const buildILPModel = (
    decisionVariables,
    uniqueUsers,
    uniqueEvents,
    minUsersMap,     // mapa: eventId → minUsers
    numOfEventPerUser,
    glpkInstance
  ) => {
    const objectiveVars = decisionVariables.map(v => ({
      name: v.name,
      coef: v.coef
    }));
  
    const userConstraints = uniqueUsers.map(u => {
      const vars = decisionVariables
        .filter(v => v.user === u)
        .map(v => ({ name: v.name, coef: 1 }));
      return {
        name: `user_${u}`,
        vars,
        bnds: { type: glpkInstance.GLP_FX, lb: numOfEventPerUser, ub: numOfEventPerUser }
      };
    });
  
    // ** tutaj używamy dla każdego eventu jego własnego progu **
    const eventConstraints = uniqueEvents.map(eid => {
      const vars = decisionVariables
        .filter(v => v.event === eid)
        .map(v => ({ name: v.name, coef: 1 }));
      return {
        name: `event_${eid}`,
        vars,
        bnds: { type: glpkInstance.GLP_LO, lb: minUsersMap[eid] || 0 }
      };
    });
  
    const model = {
        name: "AssignmentModel",
        objective: {
          direction: glpkInstance.GLP_MAX,
          name: "obj",
          vars: objectiveVars
        },
        subjectTo: [
          ...userConstraints,
          ...eventConstraints
        ],
        binaries: decisionVariables.map(v => v.name)
      }; 

    return model
  };
  


export { prepareILPData, buildDecisionVariables, buildILPModel };
