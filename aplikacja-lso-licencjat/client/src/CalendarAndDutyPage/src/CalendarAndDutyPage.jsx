import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import plLocale from '@fullcalendar/core/locales/pl'; // Dodanie lokalizacji PL

import styles from "../styles/CalendarAndDutyPage.module.css"
import "../styles/calendar.css"
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';


export function CalendarAndDutyPage(){
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    const navigate = useNavigate();

    

    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/getUserInfo`, {
                    method: "GET",
                    credentials: "include",
                });
                
                if (response.ok) {
                    const data = await response.json();

                    setIsLoggedIn(true);
                    setIsAdmin(data.isadmin); 
                } else {
                    setIsLoggedIn(false);
                    navigate("/login");
                }
            } catch (err) {
                console.log("User info error:", err);
                setIsLoggedIn(false);
                navigate("/login");
            }
        };
    
        checkLoginStatus();
    }, [navigate]);
    



    const [calendarView, setCalendarView] = useState(window.innerWidth < 768 ? 'timeGridDay' : 'timeGridWeek');
    const [calendarToolbar, setCalendarToolbar] = useState({});
    const [calendarKey, setCalendarKey] = useState(true); // Key forcing re-render

    useEffect(() => {
        const updateView = () => {
            if (window.innerWidth < 768) { 
                setCalendarView('timeGridDay');
                setCalendarToolbar({ left: 'prev,next today', center: 'title', right: '' });
            } else {
                setCalendarView('timeGridWeek');
                setCalendarToolbar({ left: 'prev,next today', center: 'title', right: 'timeGridWeek,timeGridDay' });
            }
            setCalendarKey(prevKey => !prevKey); // Forcing re-render
        };

        updateView(); // Setting initial view
        window.addEventListener('resize', updateView); 

        return () => window.removeEventListener('resize', updateView);
    }, []);


    if (!isLoggedIn) {
        return <div>Loading...</div>;
    }
    
    return(
        <>
        <div className={styles.main_container}>
            <input type="checkbox" id="sidebar_active" className={styles.sidebar_active}></input>
            <label htmlFor="sidebar_active" className={styles.open_sidebar}></label>

            <div className={styles.header}>
                <button className={styles.home_button}>
                    <img src='/calendar_and_duty_assets/home.png' className={styles.home_icon} onClick={ ()=>{navigate("/")}}></img>
                </button>
                <div className={styles.upcoming_bar}>
                    <div className={`${styles.upcomin_duty, styles.upcoming_item}`}>
                        Najbliższy dyżur: 25 Marca 2025
                    </div>
                    <div className={`${styles.upcoming_assisting, styles.upcoming_item}`}>
                        Najbliższa asystya:  25 Marca 2025
                    </div>
                    <div className={`${styles.upcomin_holiday, styles.upcoming_item}`}>
                        Najbliższe święto:  25 Marca 2025 Wielki Piątek
                    </div>
                </div>
               
                {isAdmin && (
                    <button className={styles.admin_button_header} onClick={()=>{navigate("/admin_panel")}}>
                        <img src='/calendar_and_duty_assets/crown.png' className={styles.admin_icon} alt="Admin Panel" />
                    </button>
                )}

                
                
            </div>
            
            <hr className={styles.line}></hr>
            
            <div className={styles.side_bar}>
                <div className={styles.close_and_admin}>
                    <label htmlFor="sidebar_active"  className={styles.close_sidebar}>   
                    </label>
                    {isAdmin && (
                        <button className={styles.admin_button_sidebar} onClick={()=>{navigate("/admin_panel")}}>
                            <img src='/calendar_and_duty_assets/crown.png' className={styles.admin_icon} alt="Admin Panel" />
                        </button>
                    )}

                </div>
                

                <div className={styles.nav_buttons}>
                    <button className={styles.nav_button}>
                        <img src="/homepage_assets/profile_icon.png" className={styles.nav_icon} id={styles.profile_btn} alt="Profile" />
                    </button>
                    <button className={styles.nav_button}>
                        <img src="/homepage_assets/setting_icon.png" className={styles.nav_icon} id={styles.settings_btn} alt="Settings" />
                    </button>
                    <button className={styles.nav_button}>
                        <img src="/homepage_assets/notifications_icon.png" className={styles.nav_icon} id={styles.notifications_btn} alt="Notifications" />
                    </button>
                </div>

                <button className={styles.change_duty_button} onClick={()=>{navigate("/change_duty")}}>
                    Zmiana dyżuru
                </button>
            
                <div className={styles.upcoming_assists}>
                    <h3>Nadchodzące asysty</h3>
                    <div className={styles.most_recent_assists}>
                        <button className={styles.upcoming_assist}>
                            6 Maj 2025<br />
                            Wielki Piątek

                        </button>
                        <button className={styles.upcoming_assist}>
                            6 Maj 2025<br />
                            Wielki Piątek

                        </button>
                        <button className={styles.upcoming_assist}>
                            6 Maj 2025<br />
                            Wielki Piątek

                        </button>
                    </div>
                    
                    <button className={styles.all_assists_button}>
                        Wszystkie asysty
                    </button>
                </div>
            </div>
            
            <div className={styles.calendar_container}>

                <FullCalendar 
                    key={calendarKey}
                    height="80vh"
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView={calendarView}
                    headerToolbar={calendarToolbar}

                    titleFormat={{
                        year: 'numeric',
                        month: "long",
                        day: "numeric"
                    }}

                    events={[
                        
                    ]}

                    editable={true}
                    selectable={true}
                    locale={plLocale}
                
                />
                
            </div>
        </div>
        
         


         
         
        </>
    )
}