import { Link } from "react-router-dom"
import styles from "../styles/HomePage.module.css"

export function HomePage(){
    return (
        <>
        <div className={styles.background}></div>
        <div className={styles.container}>
            <div className={styles.nav}>
                <div className={styles.logo}></div>
                <h1 className={styles.header}>Króluj nam Chryste!</h1>
                <div className={styles.nav_icons}>
                    <img src="\src\assets\profile_icon.png" className={styles.nav_icon} alt="Profile" />
                    <img src="src\assets\setting_icon.png" className={styles.nav_icon} alt="Settings" />
                    <img src="src\assets\notifications_icon.png" className={styles.nav_icon} alt="Notifications" />
                </div>
            </div>
            <div className={styles.main_content}> 
                <div className={styles.cards}>
                    <div className={`${styles.card} ${styles.duty_calendar_card}`}>
                        <h2>Kalendarz i dyżury</h2>
                        <img src="\src\assets\duty.png" className={`${styles.main_icon} ${styles.duty}`}  alt="Duty" />

                    </div>
                    <div className={`${styles.card} ${styles.attendance_card}`}>
                        <h2>Obecność i ranking</h2>
                        <img src="\src\assets\podium.png" className={`${styles.main_icon} ${styles.podium}`} alt="Podium" />
                    </div>
                    <div className={`${styles.card} ${styles.liturgical_calendar_card}`}>
                        <h2>Kalendarz liturgiczny</h2>
                        <img src="\src\assets\calendar.png" className={`${styles.main_icon} ${styles.calendar}`} alt="Calendar" />
                    </div>
                    <div className={`${styles.card} ${styles.bulletin_board_card}`}>
                        <h2>Tablica ogłoszeń</h2>
                        <img src="\src\assets\news.png" className={`${styles.main_icon} ${styles.news}`} alt="News" />
                    </div>
                </div>
            </div>
        </div>
        








        <br/><br/><br/><Link to="login">Login</Link>
        </>
    )
}