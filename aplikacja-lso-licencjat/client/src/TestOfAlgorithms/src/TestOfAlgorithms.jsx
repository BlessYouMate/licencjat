import { useRef, useState } from "react";
import { fillEvents, fillUsers, fillPreferences } from "./fillDb";
import { analysePreferences } from "./analysePreferences.js";

import styles from "../styles/testOfAlgorithms.module.css";

function TestOfAlgorithms() {
  const numOfWeekEventsRef = useRef(0);
  const numOfSundayEventsRef = useRef(0);
  const numOfUsersRef = useRef(0);
  const dbFilledRef = useRef(false);
  const algorithmRef = useRef("");

  const [isResult, setIsResult] = useState(false);
  const [testResult, setTestResult] = useState("");
  const [testResultTextColor, setTestResultTextColor] = useState("lightgreen");

  const [sumOfMinUsers, setSumOfMinUsers] = useState(0);
  const numOfEventPerUserRef = useRef(0);

  const [eventsConfirmed, setEventsConfirmed] = useState(false);
  const [usersFilledConfirmed, setUsersFilledConfirmed] = useState(false);

  const handleFillEventsButton = async (numOfWeekEvents, numOfSundayEvents) => {
    try {
      const fillResult = await fillEvents(numOfWeekEvents, numOfSundayEvents);
      if (!fillResult.ok) throw new Error("Błąd! Więcej w konsoli");

      dbFilledRef.current = true;
      setEventsConfirmed(true);
      setIsResult(false);
      setTestResult("");
    } catch (error) {
      setTestResultTextColor("red");
      setIsResult(true);
      setTestResult(error.message);
    }
  };

  const handleCalculateUsers = async () => {
    try {
      if (numOfEventPerUserRef.current <= 0) {
        throw new Error("Podaj dodatnią liczbę wydarzeń na użytkownika");
      }
  
      const evRes = await fetch(`${import.meta.env.VITE_API_URL}/getAllEvents`, {
        credentials: "include"
      });
      if (!evRes.ok) throw new Error("Błąd przy pobieraniu eventów");
  
      const { events } = await evRes.json();
      let sumSunday = 0, sumWeek = 0;
      let maxMinUsers = 0;
  
      for (const ev of events) {
        const m = ev.min_users || 0;
        if (ev.weekday === "sunday") sumSunday += m;
        else sumWeek += m;
  
        if (m > maxMinUsers) {
          maxMinUsers = m;
        }
      }
  
      const calculatedSum = Math.max(sumSunday, sumWeek);
      const estimatedUsers = Math.ceil(calculatedSum / numOfEventPerUserRef.current);
      const usersNeeded = Math.max(estimatedUsers, maxMinUsers); 
      
      setSumOfMinUsers(usersNeeded);
      numOfUsersRef.current = usersNeeded;
      setIsResult(false);
      setTestResult("");
    } catch (error) {
      setTestResultTextColor("red");
      setIsResult(true);
      setTestResult(error.message);
    }
  };
  

  const handleFillUsersButton = async () => {
    try {
      if (numOfUsersRef.current < sumOfMinUsers) {
        console.warn("Zbyt mała liczba użytkowników");
        throw new Error("Błąd przy wypełnianiu użytkowników! Więcej w konsoli");
      }

      const fillResult = await fillUsers(numOfUsersRef.current);
      if (!fillResult.ok) throw new Error("Błąd przy wypełnianiu użytkowników! Więcej w konsoli");

      const fillPreferencesResult = await fillPreferences();
      if (!fillPreferencesResult.ok) {
        throw new Error("Błąd przy wypełnianiu preferencji! Więcej w konsoli");
      }

      setUsersFilledConfirmed(true); // pokazujemy wybór algorytmu
    } catch (error) {
      setTestResultTextColor("red");
      setIsResult(true);
      setTestResult(error.message);
    }
  };

  const handleFinalTest = async () => {
    try {
      if (!algorithmRef.current) {
        throw new Error("Wybierz algorytm");
      }
      
      const result = await analysePreferences(algorithmRef.current, numOfEventPerUserRef);
      if (!result.ok) throw new Error("Błąd podczas testowania! Więcej w konsoli");

      setTestResultTextColor("lightgreen");
      setIsResult(true);
      setTestResult("Udało się! Wyniki są w konsoli.");
    } catch (error) {
      setTestResultTextColor("red");
      setIsResult(true);
      setTestResult(error.message);
    }
  };

  return (
    <>
      <div className={styles.background}></div>
      <div className={styles.main}>
        <div className={styles.form}>
          <div className={styles.number_input}>
            <label htmlFor="numOfWeekEvents">Liczba wydarzeń na tygodniu</label>
            <input
              id="numOfWeekEvents"
              type="number"
              min="0"
              onChange={(e) => {
                numOfWeekEventsRef.current = e.target.value;
              }}
            />
            <br />

            <label htmlFor="numOfSundayEvents">Liczba wydarzeń w niedzielę</label>
            <input
              id="numOfSundayEvents"
              type="number"
              min="0"
              onChange={(e) => {
                numOfSundayEventsRef.current = e.target.value;
              }}
            />
            <br />

            {!eventsConfirmed ? (
              <button
                onClick={() =>
                  handleFillEventsButton(
                    numOfWeekEventsRef.current,
                    numOfSundayEventsRef.current
                  )
                }
              >
                Potwierdź
              </button>
            ) : (
              <>
                <label>Na ile wydarzeń ma być zapisany jeden użytkownik?</label>
                <input
                  type="number"
                  min="1"
                  onChange={(e) => numOfEventPerUserRef.current = +e.target.value}
                />
                <button onClick={handleCalculateUsers}>Oblicz potrzebną liczbę użytkowników</button>
              </>
            )}

            

            {sumOfMinUsers > 0 && (
              <>
                <p>
                  Minimalna liczba użytkowników potrzebna do wypełnienia: <b>{sumOfMinUsers}</b>
                </p>

                <label>Liczba użytkowników (≥ {sumOfMinUsers}):</label>
                <input
                  type="number"
                  min={sumOfMinUsers}
                  defaultValue={sumOfMinUsers}
                  onChange={e => numOfUsersRef.current = +e.target.value}
                />
                {!usersFilledConfirmed && (
                  <button onClick={() => handleFillUsersButton(numOfUsersRef.current)}>
                    Potwierdź
                  </button>
                )}
              </>
            )}



            {usersFilledConfirmed && (
              
              <>
              <div className={styles.algorithms_choice_container}>
                <p>Algorytmy: </p>
                <label htmlFor="ilpAlgorithm">ILP</label>
                <input
                  id="ilpAlgorithm"
                  name="algorithm"
                  type="radio"
                  value="ilp"
                  onChange={(e) => {
                    algorithmRef.current = e.target.value;
                  }}
                />

                <label htmlFor="customAlgorithm">Własny</label>
                <input
                  id="customAlgorithm"
                  name="algorithm"
                  type="radio"
                  value="custom"
                  onChange={(e) => {
                    algorithmRef.current = e.target.value;
                  }}
                />
                <br />
                
              </div>
              <button onClick={handleFinalTest}>Wykonaj test</button>
              </>
            )}
          </div>

          
        </div>
        {isResult &&
            <div className={styles.result} style={{ color: testResultTextColor }}>
              {testResult}
            </div>
          }
      </div>
    </>
  );
}

export { TestOfAlgorithms };
