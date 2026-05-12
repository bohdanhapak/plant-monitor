state = {
    "air_humidity": 0,
    "water": 0,
    "soil": 0,

    "relay": False,
    "led": False,
    "buzzer": False,

    "auto_mode": True,
    "system_health": 100,
    "last_event": "SYSTEM STARTED"
}

THRESHOLD_AIR_HUMIDITY = 40
THRESHOLD_WATER = 300
THRESHOLD_SOIL = 300