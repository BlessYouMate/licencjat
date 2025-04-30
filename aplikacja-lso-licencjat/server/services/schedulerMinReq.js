const fetchData = async () => {
    try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/getAllUsersPreferences`, {
            method: "GET",
            credentials: "include",
        });
        if (!response.ok) {
            throw new Error("Błąd podczas pobierania danych");
        }

        const data = await response.json();
        const preferencesArray = data.preferences;

        console.log("Pobrane dane:", preferencesArray);

        return preferencesArray; 
    } catch (error) {
        console.error("Błąd pobierania danych:", error);
        return [];
    }
};

const preprocessPreferences = (preferences) => {
    const weeklyPreferences = [];
    const sundayPreferences = [];

    // Przypisanie użytkowników do odpowiednich tablic (tydzień/niedziela)
    preferences.forEach((pref) => {
        if (pref.isSunday) {
            sundayPreferences.push(pref);
        } else {
            weeklyPreferences.push(pref);
        }
    });

    // Zwróć dane z podziałem na wydarzenia tygodniowe i niedzielne
    return { weeklyPreferences, sundayPreferences };
};

const checkMinUsers = (preferences, minUsers) => {
    // Grupowanie po eventId (żeby zobaczyć, ile mamy wydarzeń)
    const uniqueEventIds = new Set(preferences.map(p => p.eventId));
    const eventCount = uniqueEventIds.size;
    // Obliczamy minimalną liczbę użytkowników
    const requiredUsers = eventCount * minUsers;

    // Liczba unikalnych użytkowników – używamy Set, aby pozbyć się duplikatów
    const uniqueUsers = new Set(preferences.map(p => p.userId));
    const availableUsers = uniqueUsers.size;

    console.log(`Liczba wydarzeń: ${eventCount}`);
    console.log(`Liczba unikalnych użytkowników: ${availableUsers}`);
    console.log(`Wymaganych użytkowników: ${requiredUsers}`);

    // Sprawdzamy, czy mamy wystarczającą liczbę użytkowników
    if (availableUsers < requiredUsers) {
        console.log(`Brakuje użytkowników! Potrzebujemy co najmniej ${requiredUsers} użytkowników, a mamy tylko ${availableUsers}. Można też zmniejszyć ilość wydarzeń.`);
        return false;
    }

    return true;
};

export {fetchData, preprocessPreferences, checkMinUsers}