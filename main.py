from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from state import (
    state,
    THRESHOLD_AIR_HUMIDITY,
    THRESHOLD_WATER,
    THRESHOLD_SOIL
)

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")


class SensorData(BaseModel):
    air_humidity: float
    water: int
    soil: int


class ControlData(BaseModel):
    relay: bool | None = None
    led: bool | None = None
    buzzer: bool | None = None
    auto_mode: bool | None = None


def calculate_health():
    health = 100

    if state["air_humidity"] < THRESHOLD_AIR_HUMIDITY:
        health -= 20

    if state["water"] < THRESHOLD_WATER:
        health -= 30

    if state["soil"] < THRESHOLD_SOIL:
        health -= 30

    if state["buzzer"]:
        health -= 10

    return max(0, health)


def run_automation():
    events = []

    if state["auto_mode"]:
        if state["soil"] < THRESHOLD_SOIL:
            state["relay"] = True
            events.append("SOIL LOW -> RELAY ON")
        else:
            state["relay"] = False

        if state["air_humidity"] < THRESHOLD_AIR_HUMIDITY:
            state["led"] = True
            events.append("AIR HUMIDITY LOW -> LED ON")
        else:
            state["led"] = False

        if state["water"] < THRESHOLD_WATER:
            state["buzzer"] = True
            events.append("WATER LOW -> BUZZER ON")
        else:
            state["buzzer"] = False

    state["system_health"] = calculate_health()

    if events:
        state["last_event"] = " | ".join(events)
    else:
        state["last_event"] = "ALL READINGS NOMINAL"


@app.get("/")
def frontend():
    return FileResponse("static/index.html")


@app.post("/api/sensors")
def sensors(data: SensorData):
    state["air_humidity"] = data.air_humidity
    state["water"] = data.water
    state["soil"] = data.soil

    run_automation()

    return {
        "success": True,
        "state": state
    }


@app.get("/api/state")
def get_state():
    return state


@app.post("/api/control")
def control(data: ControlData):
    if data.auto_mode is not None:
        state["auto_mode"] = data.auto_mode
        state["last_event"] = "AUTO MODE CHANGED"

    if not state["auto_mode"]:
        if data.relay is not None:
            state["relay"] = data.relay
            state["last_event"] = "MANUAL RELAY CONTROL"

        if data.led is not None:
            state["led"] = data.led
            state["last_event"] = "MANUAL LED CONTROL"

        if data.buzzer is not None:
            state["buzzer"] = data.buzzer
            state["last_event"] = "MANUAL BUZZER CONTROL"

    state["system_health"] = calculate_health()

    return state