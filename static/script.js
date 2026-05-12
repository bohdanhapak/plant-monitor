const API = "";

async function fetchState() {
    try {
        const response = await fetch(`${API}/api/state`);
        const data = await response.json();

        document.getElementById("temperature").innerText = data.temperature;
        document.getElementById("humidity").innerText = data.humidity;
        document.getElementById("water").innerText = data.water;
        document.getElementById("soil").innerText = data.soil;
        document.getElementById("relay").innerText = data.relay ? "ON" : "OFF";
        document.getElementById("auto").innerText = data.auto_mode ? "ON" : "OFF";
    } catch (error) {
        console.error("Failed to fetch state:", error);
    }
}

async function toggleRelay() {
    const response = await fetch(`${API}/api/state`);
    const data = await response.json();

    await fetch(`${API}/api/control`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            relay: !data.relay
        })
    });

    fetchState();
}

async function toggleAuto() {
    const response = await fetch(`${API}/api/state`);
    const data = await response.json();

    await fetch(`${API}/api/control`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            auto_mode: !data.auto_mode
        })
    });

    fetchState();
}

setInterval(fetchState, 2000);
fetchState();