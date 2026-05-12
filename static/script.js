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

        document.getElementById("mainStatus").innerText = data.relay ? "ACTIVE" : "NORMAL";

        updateBar("tempBar", data.temperature, 50);
        updateBar("humidityBar", data.humidity, 100);
        updateBar("waterBar", data.water, 1023);
        updateBar("soilBar", data.soil, 1023);

    } catch (error) {
        console.error("Failed to fetch state:", error);
    }
}

function updateBar(id, value, max) {
    const percent = Math.min((value / max) * 100, 100);
    document.getElementById(id).style.width = `${percent}%`;
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