import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import plLocale from '@fullcalendar/core/locales/pl'; // Dodanie lokalizacji PL

import styles from "../styles/CalendarAndDutyPage.module.css"
import "../styles/calendar.css"



export function CalendarAndDutyPage(){

    const handleDateClick = (info) => {
        alert(`Kliknięto na datę: ${info.dateStr}`);
    };

    
    return(
        <>
        <div className={styles.main_container}>
            <div className={styles.header}>
                <button className={styles.home_button}>
                    <img src='/calendar_and_duty_assets/home.png' className={styles.home_icon}></img>
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
                <button className={styles.admin_button}>
                    <img src='/calendar_and_duty_assets/crown.png' className={styles.admin_icon}></img>
                </button>
                
                
            </div>
            
            <hr className={styles.line}></hr>
            
            <div className={styles.side_bar}>
                <div className={styles.nav_buttons}>
                    <button className={styles.nav_button}>
                        <img src="/homepage_assets/profile_icon.png" className={styles.nav_icon} alt="Profile" />
                    </button>
                    <button className={styles.nav_button}>
                        <img src="/homepage_assets/setting_icon.png" className={styles.nav_icon} alt="Settings" />
                    </button>
                    <button className={styles.nav_button}>
                        <img src="/homepage_assets/notifications_icon.png" className={styles.nav_icon} alt="Notifications" />
                    </button>
                </div>

                <button className={styles.change_duty_button}>
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
                height="80vh"
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView='timeGridWeek'
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'timeGridWeek,timeGridDay'
                }}

                titleFormat={{
                    year: 'numeric',
                    month: "long",
                    day: "numeric"
                }}

                events={[
                    { id: '1', title: 'Msza św. poranna', start: '2025-03-14T08:00:00', end: '2025-03-14T09:00:00' },
                ]}
                dateClick={handleDateClick}
                editable={true}
                selectable={true}
                locale={plLocale}
                
                />
                
            </div>
        </div>
        
         


         
         
        </>
    )
}