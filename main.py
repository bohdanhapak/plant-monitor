from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from state import state, THRESHOLD_SOIL, THRESHOLD_WATER

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")


class SensorData(BaseModel):
    temperature: float
    humidity: float
    water: int
    soil: int


class ControlData(BaseModel):
    relay: bool | None = None
    auto_mode: bool | None = None


@app.get("/")
def frontend():
    return FileResponse("static/index.html")


@app.post("/api/sensors")
def sensors(data: SensorData):
    state["temperature"] = data.temperature
    state["humidity"] = data.humidity
    state["water"] = data.water
    state["soil"] = data.soil

    if state["auto_mode"]:
        if data.water < THRESHOLD_WATER or data.soil < THRESHOLD_SOIL:
            state["relay"] = True
        else:
            state["relay"] = False

    return {
        "success": True,
        "relay": state["relay"],
        "auto_mode": state["auto_mode"]
    }


@app.get("/api/state")
def get_state():
    return state


@app.post("/api/control")
def control(data: ControlData):
    if data.auto_mode is not None:
        state["auto_mode"] = data.auto_mode

    if data.relay is not None:
        state["relay"] = data.relay

    return state