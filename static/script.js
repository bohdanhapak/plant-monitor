const API = "";

async function fetchState() {
    try {
        const response = await fetch(`${API}/api/state`);
        const data = await response.json();

        document.getElementById("air_humidity").innerText = data.air_humidity;
        document.getElementById("water").innerText = data.water;
        document.getElementById("soil").innerText = data.soil;

        document.getElementById("auto").innerText = data.auto_mode ? "ON" : "OFF";

        setActuator("relay", data.relay);
        setActuator("led", data.led);
        setActuator("buzzer", data.buzzer);

        updateBar("humidityBar", data.air_humidity, 100);
        updateBar("waterBar", data.water, 1023);
        updateBar("soilBar", data.soil, 1023);

        updateMainStatus(data);

    } catch (error) {
        console.error("Failed to fetch state:", error);
    }
}

function updateMainStatus(data) {
    const status = document.getElementById("mainStatus");

    if (data.buzzer) {
        status.innerText = "ALERT";
        status.style.color = "#ff2020";
    } else if (data.relay || data.led) {
        status.innerText = "ACTIVE";
        status.style.color = "#ffbf00";
    } else {
        status.innerText = "NOMINAL";
        status.style.color = "#39ff14";
    }
}

function setActuator(id, value) {
    const el = document.getElementById(id);
    el.innerText = value ? "ON" : "OFF";
    el.classList.remove("on", "off");
    el.classList.add(value ? "on" : "off");
}

function updateBar(id, value, max) {
    const el = document.getElementById(id);
    if (!el) return;

    const percent = Math.min((value / max) * 100, 100);
    el.style.width = `${percent}%`;
}

async function toggleAuto() {
    const response = await fetch(`${API}/api/state`);
    const data = await response.json();

    await fetch(`${API}/api/control`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({auto_mode: !data.auto_mode})
    });

    fetchState();
}

async function toggleRelay() {
    await toggleActuator("relay");
}

async function toggleLed() {
    await toggleActuator("led");
}

async function toggleBuzzer() {
    await toggleActuator("buzzer");
}

async function toggleActuator(name) {
    const response = await fetch(`${API}/api/state`);
    const data = await response.json();

    await fetch(`${API}/api/control`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({[name]: !data[name]})
    });

    fetchState();
}

async function forcePoll() {
    await fetchState();
}

setInterval(fetchState, 2000);
fetchState();