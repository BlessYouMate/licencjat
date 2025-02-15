import { useNavigate } from "react-router-dom";
import styles from "../styles/LoginPage.module.css"



export function LoginPage(){
    const navigate = useNavigate();

    return(
        <>
        <div className={styles.container}>
            <div className={styles.background}></div>
            <div className={styles.login_box}>
                <h1>Logowanie</h1>
                <div className={styles.login_content}>
                    <div className={styles.login_inputs}>
                        <form method="post" className={styles.login_form}>
                            <label htmlFor="login">Login</label><br />
                            <input type="text" id="login" name="login"></input><br />
                            <label htmlFor="password">Hasło</label><br />
                            <input type="password" id="password" name="password"></input><br />  

                            <button className={styles.login_sumbit_btn} type="submit"
                            onClick={(e)=>{
                                e.preventDefault();
                                navigate("/")
                            }}>
                                Zaloguj</button>  
                        </form>
                    <div className={styles.login_help_txt}>
                            <a href="">Nie masz konta? Sprawdź jak je uzyskać</a><br />
                            <a href="">Nie możesz się zalogować?</a>
                    </div>
                    </div>
                </div>
                
            </div>
        </div>
        </>
    )
}