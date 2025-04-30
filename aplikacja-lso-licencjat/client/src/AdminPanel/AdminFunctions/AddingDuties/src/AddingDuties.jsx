import { useState } from "react"
import styles from "../styles/AddingDuties.module.css"    

export function AddingDuties(){

    const [title, setTitle] = useState("");
    const [weekday, setWeekday] = useState("monday");
    const [time, setTime] = useState("");

    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        console.log({ title, weekday, time })
        try{
            const response = await fetch(`${import.meta.env.VITE_API_URL}/createEvent`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ title, weekday, time }),
                    credentials: "include",
                }
            );

            const data = await response.json();

            if(!response.ok){
                throw new Error(data.error || "create event error")
            }

            alert("wydarzenie utworzone: ", data)
        }
        catch(err){
            setError(err.message);
        }
    }

    return(
        <>
        <h1>Dodawanie dyżurów</h1>
        <form className={styles.form}>
            <label htmlFor="title">Podaj nazwę:</label>
            <input id="title" type="text" onChange={(e)=>{setTitle(e.target.value)}}></input><br />

            <label htmlFor="weekday">Wybierz dzień tygodnia:</label>
            <select id="weekday" name="weekday" onChange={(e)=>{setWeekday(e.target.value)}}>
                <option value="monday">Poniedziałek</option>
                <option value="tuesday">Wtorek</option>
                <option value="wednesday">Środa</option>
                <option value="thursday">Czwartek</option>
                <option value="friday">Piątek</option>
                <option value="saturday">Sobota</option>
                <option value="sunday">Niedziela</option>
            </select><br />

            <label htmlFor="time">Wybierz godzinę:</label>
            <input id="time" type="time" onChange={(e)=>{setTime(e.target.value)}}></input>
        </form>

        <button className={styles.submit_button} onClick={handleSubmit}>Zatwierdź</button>
        </>
    )
}