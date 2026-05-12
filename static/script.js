const API = "";

let packetCounter = 0;

async function fetchState() {
    try {
        const response = await fetch(`${API}/api/state`);
        const data = await response.json();

        packetCounter++;

        const now = new Date().toLocaleTimeString();

        document.getElementById("packetCounter").innerText = String(packetCounter).padStart(4, "0");
        document.getElementById("clock").innerText = now;
        document.getElementById("lastPoll").innerText = now;

        document.getElementById("air_humidity").innerText = data.air_humidity;
        document.getElementById("water").innerText = data.water;
        document.getElementById("motion").innerText = data.soil ? "MOVING" : "CLEAR";

        document.getElementById("auto").innerText = data.auto_mode ? "ON" : "OFF";
        document.getElementById("systemHealth").innerText = data.system_health;

        setActuator("relay", "relayText", data.relay);
        setActuator("led", "ledText", data.led);
        setActuator("buzzer", "buzzerText", data.buzzer);

        updateBar("humidityBar", data.air_humidity, 100);
        updateBar("waterBar", data.water, 300);
        updateBar("motionBar", data.soil ? 1 : 0, 1);

        updateMainStatus(data);
        updateHorrorMode(data);
        updateFooter(data);
        addLog("INFO", data.last_event);

    } catch (error) {
        console.error("Failed to fetch state:", error);
        addLog("ERR", "BACKEND CONNECTION LOST");
    }
}

function updateMainStatus(data) {
    const status = document.getElementById("mainStatus");

    if (data.buzzer) {
        status.innerText = "ALERT";
        status.style.color = "#ff2020";
        status.style.borderColor = "#ff2020";
    } else if (data.relay || data.led) {
        status.innerText = "ACTIVE";
        status.style.color = "#ffbf00";
        status.style.borderColor = "#ffbf00";
    } else {
        status.innerText = "NOMINAL";
        status.style.color = "#39ff14";
        status.style.borderColor = "#39ff14";
    }
}

function setActuator(id, textId, value) {
    const el = document.getElementById(id);
    const text = document.getElementById(textId);

    el.innerText = value ? "ON" : "OFF";
    el.classList.remove("on", "off");
    el.classList.add(value ? "on" : "off");

    text.innerText = value ? "[ ACTIVE ]" : "[ INACTIVE ]";
}

function updateBar(id, value, max) {
    const el = document.getElementById(id);
    if (!el) return;

    const percent = Math.min((value / max) * 100, 100);
    el.style.width = `${percent}%`;
}

function updateHorrorMode(data) {
    const overlay = document.getElementById("alarmOverlay");
    const noSignal = document.getElementById("noSignal");

    if (data.buzzer) {
        overlay.classList.add("active");
        noSignal.classList.add("active");
    } else {
        overlay.classList.remove("active");
        noSignal.classList.remove("active");
    }
}

function updateFooter(data) {
    const footer = document.getElementById("footerMessage");

    if (data.buzzer) {
        footer.innerText = "> WARNING: WATER LEVEL BELOW THRESHOLD. BUZZER ACTIVE.";
    } else if (data.relay) {
        footer.innerText = "> MOTION DETECTED. RELAY ACTIVATED.";
    } else if (data.led) {
        footer.innerText = "> AIR HUMIDITY LOW. LED INDICATOR ACTIVE.";
    } else {
        footer.innerText = "> SENSOR DATA UPDATED. ALL READINGS NOMINAL.";
    }
}

async function toggleAuto() {
    const response = await fetch(`${API}/api/state`);
    const data = await response.json();

    await fetch(`${API}/api/control`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({auto_mode: !data.auto_mode})
    });

    addLog("INFO", "AUTO MODE TOGGLED");
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

    if (data.auto_mode) {
        addLog("WARN", "DISABLE AUTO MODE BEFORE MANUAL CONTROL");
        return;
    }

    await fetch(`${API}/api/control`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({[name]: !data[name]})
    });

    addLog("INFO", `${name.toUpperCase()} TOGGLE REQUEST SENT`);
    fetchState();
}

async function forcePoll() {
    addLog("INFO", "FORCE SENSOR POLL EXECUTED");
    await fetchState();
}

function addLog(type, message) {
    const log = document.getElementById("logLines");
    const time = new Date().toLocaleTimeString();

    const last = log.lastElementChild;
    if (last && last.innerText.includes(message)) {
        return;
    }

    const line = document.createElement("p");
    line.innerHTML = `<span>${type}</span> ${time} // ${message}`;

    log.appendChild(line);

    const items = log.querySelectorAll("p");
    if (items.length > 10) {
        items[0].remove();
    }
}

setInterval(fetchState, 2000);
fetchState();
