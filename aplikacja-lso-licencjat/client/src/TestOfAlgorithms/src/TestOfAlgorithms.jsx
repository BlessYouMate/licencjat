import { useRef, useState } from "react"
import { fillDb } from "./fillDb";
import { analysePreferences } from "./analysePreferences.js";

import styles from "../styles/testOfAlgorithms.module.css"



function TestOfAlgorithsm() {

  const numOfWeekEventsRef = useRef(0);
  const numOfSundayEventsRef = useRef(0);
  const numOfUsersRef = useRef(0);
  const minUsers = useRef(0);
  const algorithmRef = useRef("");

  const [isResult, setIsResult] = useState(false)
  const [testResult, setTestResult] = useState("")
  const [testResultTextColor, setTestResultTextColor] = useState("lightgreen")

  const handleTestButton = async (
    numOfWeekEvents,
    numOfSundayEvents,
    numOfUsers,
    minUsers,
    algorithm
  ) => {
    try {
      console.log(numOfWeekEvents, numOfSundayEvents, numOfUsers, minUsers, algorithm);
  
      // Validation check
      if (numOfWeekEvents * minUsers > numOfUsers || numOfSundayEvents * minUsers > numOfUsers) {
        console.log("za mało użytkowników albo za dużo eventów");
        throw new Error("Błąd! Więcej w konsoli");
      }
  
      // Call fillDb and handle error if any
      const fillResult = await fillDb(numOfWeekEvents, numOfSundayEvents, numOfUsers);
      if (!fillResult.ok) {
        throw new Error("Błąd! Więcej w konsoli");
      }
  
      // Call analysePreferences and handle error if any
      const analyseResult = await analysePreferences(algorithm, minUsers);
      if (!analyseResult.ok) {
        throw new Error("Błąd! Więcej w konsoli");
      }
  
      // If everything went well
      setTestResultTextColor("lightgreen");
      setIsResult(true);
      setTestResult("Udało się! Wyniki są w konsoli");
  
    } catch (error) {
      // Catch all errors and display them
      setTestResultTextColor("red");
      setIsResult(true);
      setTestResult(error.message);
    }
  };
  

  return (
    <>
    <div className={styles.background}>

    </div>
    <div className={styles.main}>

      <div className={styles.form}>
        <div className={styles.number_input}>
          <label htmlFor="numOfWeekEvents">Ilość wydarzeń na tygodniu</label>
          <input
            id="numOfWeekEvents"
            type="number"
            min="0"
            onChange={(e) => {
              numOfWeekEventsRef.current = e.target.value;
            }}
          />
          <br />

          <label htmlFor="numOfSundayEvents">Ilość wydarzeń w niedzielę</label>
          <input
            id="numOfSundayEvents"
            type="number"
            min="0"
            onChange={(e) => {
              numOfSundayEventsRef.current = e.target.value;
            }}
          />
          <br />

          <label htmlFor="numOfUsers">Ilość użytkowników</label>
          <input
            id="numOfUsers"
            type="number"
            min="1"
            onChange={(e) => {
              numOfUsersRef.current = e.target.value;
            }}
          />
          <br />

          <label htmlFor="minUsers">Minimum na wydarzenie</label>
          <input
            id="minUsers"
            type="number"
            min="1"
            onChange={(e) => {
              minUsers.current = e.target.value;
            }}
          />
        </div>
        
        <br />
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

        <button
          onClick={() =>
            handleTestButton(
              numOfWeekEventsRef.current,
              numOfSundayEventsRef.current,
              numOfUsersRef.current,
              minUsers.current,
              algorithmRef.current
            )
          }
        >
          Test
        </button>
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

export { TestOfAlgorithsm };
