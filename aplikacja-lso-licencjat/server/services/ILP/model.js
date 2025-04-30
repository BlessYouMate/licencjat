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
const buildILPModel = (decisionVariables, uniqueUsers, uniqueEvents, minUsers, glpkInstance) => {
    // 1. Funkcja celu: Maksymalizacja sumy wag preferencji (czyli: przypisać użytkowników jak najlepiej według ich preferencji)
    const objectiveVars = decisionVariables.map(v => ({
        name: v.name, // Nazwa zmiennej, np. "x_1_2"
        coef: v.coef  // Wartość preferencji (do maksymalizacji)
    }));

    /* Przykład struktury objectiveVars:
    [
        { name: 'x_1_1', coef: 4 },
        { name: 'x_1_2', coef: 2 },
        { name: 'x_2_1', coef: 5 },
        ...
    ]
    */

    // 2. Ograniczenia dla użytkowników:
    // Każdy użytkownik musi być przypisany do dokładnie JEDNEGO wydarzenia (nie więcej, nie mniej)
    const userConstraints = uniqueUsers.map(user => {
        const userVars = decisionVariables
            .filter(v => v.user === user) // Filtrujemy zmienne związane z użytkownikiem
            .map(v => ({ name: v.name, coef: 1 })); // Wszystkie zmienne użytkownika mają współczynnik 1 w ograniczeniu

        return {
            name: `user_${user}`, // Nazwa ograniczenia np. "user_1"
            vars: userVars,       // Lista zmiennych związanych z użytkownikiem
            bnds: { type: glpkInstance.GLP_FX, lb: 1, ub: 1 } // Musi być dokładnie jedna zmienna ustawiona na 1 (glp fixed, lower bound, upper bound)
        };
    });

    /* Przykład struktury pojedynczego ograniczenia użytkownika:
    {
        name: 'user_1',
        vars: [
            { name: 'x_1_1', coef: 1 },
            { name: 'x_1_2', coef: 1 },
            { name: 'x_1_3', coef: 1 }
        ],
        bnds: { type: GLP_FX, lb: 1, ub: 1 }
    }
    */

    // 3. Ograniczenia dla wydarzeń:
    // Każde wydarzenie musi mieć przypisanych CO NAJMNIEJ `minUsers` użytkowników
    const eventConstraints = uniqueEvents.map(event => {
        const eventVars = decisionVariables
            .filter(v => v.event === event) // Filtrujemy zmienne związane z wydarzeniem
            .map(v => ({ name: v.name, coef: 1 }));

        return {
            name: `event_${event}`, // Nazwa ograniczenia np. "event_2"
            vars: eventVars,        // Lista zmiennych związanych z wydarzeniem
            bnds: { type: glpkInstance.GLP_LO, lb: minUsers } // Suma zmiennych >= minUsers
        };
    });

    /* Przykład struktury pojedynczego ograniczenia wydarzenia:
    {
        name: 'event_2',
        vars: [
            { name: 'x_1_2', coef: 1 },
            { name: 'x_2_2', coef: 1 },
            { name: 'x_3_2', coef: 1 }
        ],
        bnds: { type: GLP_LO, lb: 2 }
    }
    */

    // Kompletna definicja modelu ILP, który przekażemy solverowi GLPK
    const model = {
        name: "AssignmentModel", // Nazwa modelu
        objective: {
            direction: glpkInstance.GLP_MAX, // Maksymalizacja (może być GLP_MIN gdybyśmy minimalizowali)
            name: "obj",                     // Nazwa funkcji celu
            vars: objectiveVars              // Lista zmiennych z wagami
        },
        subjectTo: [
            ...userConstraints, // Lista ograniczeń użytkowników
            ...eventConstraints // Lista ograniczeń wydarzeń
        ],
        binaries: decisionVariables.map(v => v.name) // Wszystkie zmienne są binarne (0 lub 1) — nie mogą być np. 0.5
    };

    return model; // Zwracamy kompletny model

    /* Przykład finalnej struktury modelu:
    {
        name: "AssignmentModel",
        objective: {
            direction: GLP_MAX,
            name: "obj",
            vars: [
                { name: 'x_1_1', coef: 4 },
                { name: 'x_1_2', coef: 2 },
                ...
            ]
        },
        subjectTo: [
            { name: 'user_1', vars: [...], bnds: {...} },
            { name: 'user_2', vars: [...], bnds: {...} },
            { name: 'event_1', vars: [...], bnds: {...} },
            ...
        ],
        binaries: ['x_1_1', 'x_1_2', 'x_2_1', ...]
    }
    */
};


export { prepareILPData, buildDecisionVariables, buildILPModel };
