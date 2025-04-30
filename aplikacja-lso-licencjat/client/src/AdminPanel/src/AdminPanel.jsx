import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { runILPAlgorithm } from '../../../../server/services/ILP/algorithm.js';
import { runMyAlgorithm } from '../../../../server/services/myAlgorithm/algorithm.js';

import styles from "../styles/AdminPanel.module.css"

export function AdminPanel(){
    const navigate = useNavigate();

    const minUsersRef = useRef(1);

    return(
        <>
        <div className={styles.main}>
            <button className={styles.add_duties_button} onClick={()=>{navigate("/adding_duties")}}>
                Ręczne dodawanie wydarzeń
            </button>

            <label htmlFor='minUsers' style={{fontSize: "2rem", margin: "20px 20px 0px 20px"}}>Minimalna ilość użytkowników na wydarzenie: </label>
            <input type='number' min="1" style={{fontSize: "2rem", maxWidth: "250px", margin: "0px 20px 0px 20px"}} onChange={(e) => {minUsersRef.current = e.target.value} }></input>

            <button className={styles.update_schedule_button} onClick={()=>{runILPAlgorithm(minUsersRef.current)}}>
                ILP algorytm
            </button>

            <button className={styles.update_schedule_button} onClick={()=>{runMyAlgorithm(minUsersRef.current)}}>
                Autorski algorytm
            </button>

            <button className={styles.test_of_algorithms_button} onClick={()=>{navigate("/test_of_algorithms")}}>
                Testowanie
            </button>
        </div>
        
        
        </>
    )
}