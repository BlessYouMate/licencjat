import { Link } from "react-router-dom";
import styles from "../styles/HomePage.module.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function HomePage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/`, {
                    method: "GET",
                    credentials: "include",
                });
                if (response.ok) {
                    setIsLoggedIn(true);
                } else {
                    setIsLoggedIn(false);
                    navigate("/login");
                }
            } catch (err) {
                setIsLoggedIn(false);
                console.log(err);
                navigate("/login");
            }
        };

        checkLoginStatus();
    }, [navigate]);

    if (!isLoggedIn) {
        return <div>Loading...</div>;
    }

    const handleLogout = async () => {
        try {
            await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
                method: "POST",
                credentials: "include",
            });

            setIsLoggedIn(false);
            navigate("/login");
        } catch (err) {
            console.log("Logout error: ", err);
        }
    };

    return (
        <>
            <div className={styles.background}></div>
            <div className={styles.container}>
                <div className={styles.nav}>
                    <div className={styles.logo}></div>
                    <h1 className={styles.header}>Króluj nam Chryste!</h1>
                    
                    

                   <nav>
                        <input type="checkbox" id="sidebar_active" className={styles.sidebar_active}></input>
                        <label htmlFor="sidebar_active" className={styles.open_sidebar}>
                        </label>

                        <div className={`${styles.nav_icons}`}>
                            <label htmlFor="sidebar_active"  className={styles.close_sidebar}>
                               
                            </label>
                            <button className={styles.nav_button} onClick={handleLogout}>
                                <img src="/src/assets/profile_icon.png" className={styles.nav_icon} alt="Profile" />
                            </button>
                            <a href="" className={styles.nav_button}>
                                <img src="/src/assets/setting_icon.png" className={styles.nav_icon} alt="Settings" />
                            </a>
                            <button className={styles.nav_button}>
                                <img src="/src/assets/notifications_icon.png" className={styles.nav_icon} alt="Notifications" />
                            </button>
                        </div>
                   </nav>
                    
                </div>
                <div className={styles.main_content}>
                    <div className={styles.cards}>
                        <div className={`${styles.card} ${styles.duty_calendar_card}`}>
                            <h2>Kalendarz i dyżury</h2>
                            <img src="\src\assets\duty.png" className={`${styles.main_icon} ${styles.duty}`} alt="Duty" />
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
            <br /><br /><br /><Link to="login">Login</Link>
        </>
    );
}
