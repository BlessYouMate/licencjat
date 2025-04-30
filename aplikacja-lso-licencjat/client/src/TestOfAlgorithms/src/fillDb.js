async function fillDb(numOfSundayEvents, numOfWeekEvents, numOfUsers) {
    // Create a response object to track the success or failure of the process
    let result = { ok: true, errorMessage: "" };
  
    // fill events
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/fillEvents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numOfSundayEvents, numOfWeekEvents }),
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        result.ok = false;
        result.errorMessage = data.error || "fill events error";
        throw new Error(result.errorMessage); // Propagate the error
      }
    } catch (err) {
      result.ok = false;
      result.errorMessage = err.message || "Unknown error in fill events";
      console.log(err);
    }
  
    // fill users
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/fillUsers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numOfUsers }),
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        result.ok = false;
        result.errorMessage = data.error || "fill users error";
        throw new Error(result.errorMessage); // Propagate the error
      }
    } catch (err) {
      result.ok = false;
      result.errorMessage = err.message || "Unknown error in fill users";
      console.log(err);
    }
  
    // fill preferences
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/fillPreferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        result.ok = false;
        result.errorMessage = data.error || "fill preferences error";
        throw new Error(result.errorMessage); // Propagate the error
      }
    } catch (err) {
      result.ok = false;
      result.errorMessage = err.message || "Unknown error in fill preferences";
      console.log(err);
    }
  
    return result; // Return the result object
  }
  
  export { fillDb };
  