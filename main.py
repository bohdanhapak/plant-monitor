import time

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from state import (
    state,
    THRESHOLD_AIR_HUMIDITY,
    THRESHOLD_WATER
)

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")


class SensorData(BaseModel):
    air_humidity: float
    water: int
    soil: int | None = None
    motion: bool | int | None = None


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

    if state["buzzer"]:
        health -= 10

    return max(0, health)


def run_automation():
    events = []

    if state["auto_mode"]:
        now = time.time()

        if now < state["manual_override_until"]:
            state["system_health"] = calculate_health()
            state["last_event"] = "MANUAL OVERRIDE ACTIVE"
            return

        if state["water"] < THRESHOLD_WATER:
            state["relay"] = True
            events.append("WATER LOW -> RELAY ON")
        else:
            state["relay"] = False

        if state["air_humidity"] < THRESHOLD_AIR_HUMIDITY:
            state["led"] = True
            events.append("AIR HUMIDITY LOW -> LED ON")
        else:
            state["led"] = False

        if state["motion"]:
            state["buzzer"] = True
            state["led"] = True
            events.append("MOTION DETECTED -> ALARM ON")
        else:
            state["buzzer"] = False

    state["system_health"] = calculate_health()
    state["last_event"] = " | ".join(events) if events else "ALL READINGS NOMINAL"


@app.get("/")
def frontend():
    return FileResponse("static/index.html")


@app.post("/api/sensors")
def sensors(data: SensorData):
    state["air_humidity"] = data.air_humidity
    state["water"] = data.water

    if data.soil is not None:
        state["soil"] = data.soil
        if data.motion is None:
            state["motion"] = 1 if data.soil == 1 else 0

    if data.motion is not None:
        state["motion"] = 1 if bool(data.motion) else 0

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

    if data.relay is not None:
        state["relay"] = data.relay
        state["manual_override_until"] = time.time() + 5
        state["last_event"] = "MANUAL RELAY OVERRIDE 5 SEC"

    if data.led is not None:
        state["led"] = data.led
        state["manual_override_until"] = time.time() + 5
        state["last_event"] = "MANUAL LED OVERRIDE 5 SEC"

    if data.buzzer is not None:
        state["buzzer"] = data.buzzer
        state["manual_override_until"] = time.time() + 5
        state["last_event"] = "MANUAL BUZZER OVERRIDE 5 SEC"

    state["system_health"] = calculate_health()

    return state
