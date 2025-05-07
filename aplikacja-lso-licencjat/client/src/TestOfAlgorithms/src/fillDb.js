async function fillEvents(numOfSundayEvents, numOfWeekEvents) {
  let result = { ok: true, errorMessage: "" };

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
      throw new Error(result.errorMessage);
    }
  } catch (err) {
    result.ok = false;
    result.errorMessage = err.message || "Unknown error in fill events";
    console.log(err);
  }

  return result;
}

async function fillUsers(numOfUsers) {
  let result = { ok: true, errorMessage: "" };

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
      throw new Error(result.errorMessage);
    }
  } catch (err) {
    result.ok = false;
    result.errorMessage = err.message || "Unknown error in fill users";
    console.log(err);
  }

  return result;
}

async function fillPreferences() {
  let result = { ok: true, errorMessage: "" };

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
      throw new Error(result.errorMessage);
    }
  } catch (err) {
    result.ok = false;
    result.errorMessage = err.message || "Unknown error in fill preferences";
    console.log(err);
  }

  return result;
}

export { fillEvents, fillUsers, fillPreferences };
