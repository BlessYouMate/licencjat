import { useState, useEffect } from "react";
import styles from "../styles/ChangeDutyForm.module.css"

export function ChangeDutyForm() {

    const [events, setEvents] = useState([]);
    const [error, setError] = useState("");
    const [userPreferences, setUserPreferences] = useState([])

    useEffect(() => {
        const getAllEvents = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/getAllEvents`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Events fetch error");
                }

                setEvents(data.events); 
            } catch (err) {
                setError(err.message); 
            }
        };

        getAllEvents();
    }, []); 

    const setEventPreference = async (e, eventId) => {
        const preference = parseInt(e.target.value); 
    
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/getUserInfo`, {
                method: "GET",
                credentials: "include",
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch user ID");
            }
    
            const newPreference = { userId: data.userId, eventId, preference };
    
            setUserPreferences((prevPreferences) => {
                const existingIndex = prevPreferences.findIndex(pref => pref.eventId === eventId);
    
                if (existingIndex !== -1) {
                    const updatedPreferences = [...prevPreferences];
                    updatedPreferences[existingIndex] = newPreference;
                    return updatedPreferences;
                } else {
                    return [...prevPreferences, newPreference];
                }
            });
    
            console.log("Updated preferences:", newPreference);
        } catch (err) {
            console.error("Error fetching user ID:", err.message);
        }
    }
    
    const ShowUserPreferences = () => {
        console.log("all preferences", userPreferences)
    }

    const handleSubmitPreferences = async () => {
        try {
            for (const { userId, eventId, preference } of userPreferences) {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/setUserPreferences`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ userId, eventId, preference }),
                    credentials: "include",
                });
    
                const data = await response.json();
    
                if (!response.ok) {
                    throw new Error(data.error || "User preferences error");
                }
    
                console.log('Preferences for', userId, 'saved successfully');
            }
        } catch (err) {
            setError(err.message);
        }
    };
    
    
    

    return (
        <>
            <h1>Zmiana dyżuru</h1>
            <ul className={styles.list}>
                {events.length === 0 ? (
                    <li>Brak wydarzeń do wyświetlenia.</li>
                ) : (
                    events.map(event => (
                        <li key={event.id} onChange={(e)=>{setEventPreference(e, event.id)}}>
                            <p className={styles.event}>
                                {event.title} - {event.weekday} - {event.time}
                            </p>
                            
                            <div className={styles.event_preferences}>
                                <label>
                                    <input
                                        type="radio"
                                        name={`event-${event.id}`}
                                        value="5"
                                    />
                                    Bardzo chcę
                                </label>

                                <label>
                                    <input
                                        type="radio"
                                        name={`event-${event.id}`}
                                        value="4"
                                    />
                                    Chcę
                                </label>

                                <label>
                                    <input
                                        type="radio"
                                        name={`event-${event.id}`}
                                        value="3"
                                    />
                                    Trochę chcę
                                </label>

                                <label>
                                    <input
                                        type="radio"
                                        name={`event-${event.id}`}
                                        value="2"
                                    />
                                    Niezbyt chcę
                                </label>

                                <label>
                                    <input
                                        type="radio"
                                        name={`event-${event.id}`}
                                        value="1"
                                    />
                                    Nie chcę
                                </label>

                                <br />
                               
                                <br />
                            </div>
                        </li>
                    ))
                )}
            </ul>

            <button className={styles.submit_button} onClick={handleSubmitPreferences}>Zatwierdź</button>
        </>
    );
}
