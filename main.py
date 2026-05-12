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


@app.get("/")
def frontend():
    return FileResponse("static/index.html")


@app.post("/api/sensors")
def sensors(data: SensorData):
    state["air_humidity"] = data.air_humidity
    state["water"] = data.water
    state["soil"] = data.soil

    if state["auto_mode"]:
        state["relay"] = data.soil < THRESHOLD_SOIL
        state["buzzer"] = data.water < THRESHOLD_WATER
        state["led"] = data.air_humidity < THRESHOLD_AIR_HUMIDITY

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

    if not state["auto_mode"]:
        if data.relay is not None:
            state["relay"] = data.relay

        if data.led is not None:
            state["led"] = data.led

        if data.buzzer is not None:
            state["buzzer"] = data.buzzer

    return state