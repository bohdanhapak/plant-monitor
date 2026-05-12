const API = "";

async function fetchState() {
    const response = await fetch(`${API}/api/state`);
    const data = await response.json();

    document.getElementById("air_humidity").innerText = data.air_humidity;
    document.getElementById("water").innerText = data.water;
    document.getElementById("soil").innerText = data.soil;

    document.getElementById("relay").innerText = data.relay ? "ON" : "OFF";
    document.getElementById("led").innerText = data.led ? "ON" : "OFF";
    document.getElementById("buzzer").innerText = data.buzzer ? "ON" : "OFF";
    document.getElementById("auto").innerText = data.auto_mode ? "ON" : "OFF";

    updateBar("humidityBar", data.air_humidity, 100);
    updateBar("waterBar", data.water, 1023);
    updateBar("soilBar", data.soil, 1023);
}

function updateBar(id, value, max) {
    const percent = Math.min((value / max) * 100, 100);
    document.getElementById(id).style.width = `${percent}%`;
}

async function toggleAuto() {
    const state = await fetch(`${API}/api/state`);
    const data = await state.json();

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
    const state = await fetch(`${API}/api/state`);
    const data = await state.json();

    await fetch(`${API}/api/control`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({[name]: !data[name]})
    });

    fetchState();
}

setInterval(fetchState, 2000);
fetchState();