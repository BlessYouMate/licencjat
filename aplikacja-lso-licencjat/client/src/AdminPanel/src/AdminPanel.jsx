import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';

import styles from "../styles/AdminPanel.module.css"

export function AdminPanel(){
    const navigate = useNavigate();

    const minUsersRef = useRef(1);

    async function callILP(minUsers) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/algorithms/run-ilp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minUsers }),
        credentials: 'include',
    });
    const json = await res.json();
    console.log("ILP result:", json);
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
}


    return(
        <>
        <div className={styles.main}>
            <button className={styles.add_duties_button} onClick={()=>{navigate("/adding_duties")}}>
                Ręczne dodawanie wydarzeń
            </button>

            <button className={styles.update_schedule_button} onClick={()=>{callILP(minUsersRef.current)}}>
                ILP algorytm
            </button>

            <button className={styles.update_schedule_button} onClick={()=>{callCustom(minUsersRef.current)}}>
                Autorski algorytm
            </button>

            <button className={styles.test_of_algorithms_button} onClick={()=>{navigate("/test_of_algorithms")}}>
                Testowanie
            </button>
        </div>
        
        
        </>
    )
}