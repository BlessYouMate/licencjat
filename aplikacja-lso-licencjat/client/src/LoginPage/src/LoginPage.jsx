import { useNavigate } from "react-router-dom";
import styles from "../styles/LoginPage.module.css"
import { useState } from "react";



export function LoginPage(){
    const navigate = useNavigate();

    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e) =>{
        e.preventDefault();
        try{
            const response = await fetch(`${import.meta.env.VITE_API_URL}/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ login, password }),
                    credentials: "include",
                }
            );

            const data = await response.json();

            if(!response.ok){
                throw new Error(data.error || "login error")
            }

            navigate("/")
        }
        catch(err){
            setError(err.message);
        }
    }

    return(
        <>
        <div className={styles.container}>
            <div className={styles.background}></div>
            <div className={styles.login_box}>
                <h1>Logowanie</h1>
                <div className={styles.login_content}>
                    <div className={styles.login_inputs}>
                        <form method="post" className={styles.login_form} onSubmit={ handleLogin }>
                            <label htmlFor="login">
                                Login
                            </label><br />
                            <input 
                                type="text" 
                                id="login" 
                                name="login" 
                                value={login} 
                                onChange={(e) => {setLogin(e.target.value)}}>
                            </input><br />
                            <label htmlFor="password">Hasło</label><br />
                            <input 
                                type="password" 
                                id="password" 
                                name="password" 
                                value={password} 
                                onChange={(e) => {setPassword(e.target.value)}}
                            ></input><br />  

                            <button className={styles.login_sumbit_btn} type="submit">
                                Zaloguj
                            </button>  
                            
                        </form>
                        
                        
                    <div className={styles.login_help_txt}>
                            <p className={styles.error}>{error || "\u00A0"}</p>
                            <a href="">Nie masz konta? Sprawdź jak je uzyskać</a>
                            <a href="">Nie możesz się zalogować?</a>
                    </div>
                    </div>
                </div>
                
            </div>
        </div>
        </>
    )
}