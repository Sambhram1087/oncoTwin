import json
from fastapi import WebSocket


class ConnectionManager:
    """Keeps track of websocket clients subscribed to a given job_id."""

    def __init__(self) -> None:
        self.active: dict[int, list[WebSocket]] = {}

    async def connect(self, job_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active.setdefault(job_id, []).append(websocket)

    def disconnect(self, job_id: int, websocket: WebSocket) -> None:
        if job_id in self.active and websocket in self.active[job_id]:
            self.active[job_id].remove(websocket)
            if not self.active[job_id]:
                del self.active[job_id]

    async def broadcast(self, job_id: int, message: dict) -> None:
        for ws in list(self.active.get(job_id, [])):
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                self.disconnect(job_id, ws)


manager = ConnectionManager()
