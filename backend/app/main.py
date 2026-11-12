import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.api import (
    auth, agents, security, approvals, provenance,
    policies, incidents, analytics, audit, reports,
    rag, simulator, orchestrator_api, notifications
)
from app.websocket.manager import ws_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("veritrust")

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VeriTrust Cognitive Shield API",
    description="A Human-in-the-Loop Cognitive Shield & Provenance Interface for High-Stakes Agentic Workflows",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(agents.router, prefix=settings.API_V1_STR)
app.include_router(security.router, prefix=settings.API_V1_STR)
app.include_router(approvals.router, prefix=settings.API_V1_STR)
app.include_router(provenance.router, prefix=settings.API_V1_STR)
app.include_router(policies.router, prefix=settings.API_V1_STR)
app.include_router(incidents.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(rag.router, prefix=settings.API_V1_STR)
app.include_router(simulator.router, prefix=settings.API_V1_STR)
app.include_router(orchestrator_api.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)

@app.websocket("/api/ws/monitoring")
async def websocket_monitoring_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send initial connection handshake
        await websocket.send_json({
            "event": "CONNECTED",
            "message": "Connected to VeriTrust Cognitive Shield Live Telemetry Stream"
        })
        while True:
            # Keep-alive receive
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "engine": "Cognitive Shield Guardian Active"
    }

