import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import async_engine, Base, AsyncSessionLocal
from app.db.seed import seed_initial_data

from app.api.auth import router as auth_router
from app.api.incidents import router as incidents_router
from app.api.ingestion import router as ingestion_router
from app.api.timeline import router as timeline_router
from app.api.hypotheses import router as hypotheses_router
from app.api.agent import router as agent_router
from app.api.root_cause import router as root_cause_router
from app.api.mitigations import router as mitigations_router
from app.api.reports import router as reports_router
from app.api.audit import router as audit_router
from app.api.analytics import router as analytics_router
from app.api.settings import router as settings_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("incidentiq.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing IncidentIQ AI Database Schema...")
    try:
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except (AttributeError, TypeError):
        Base.metadata.create_all(bind=async_engine)
    
    logger.info("Seeding Initial SRE Data...")
    async with AsyncSessionLocal() as session:
        await seed_initial_data(session)

    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Global CORS Headers Middleware for Vercel Serverless
@app.middleware("http")
async def add_cors_header(request: Request, call_next):
    if request.method == "OPTIONS":
        response = Response(status_code=200)
    else:
        response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Accept"
    return response

# Include Routers
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["Auth"])
app.include_router(incidents_router, prefix=f"{settings.API_V1_STR}/incidents", tags=["Incidents"])
app.include_router(ingestion_router, prefix=f"{settings.API_V1_STR}/ingestion", tags=["Ingestion"])
app.include_router(timeline_router, prefix=f"{settings.API_V1_STR}/timeline", tags=["Timeline"])
app.include_router(hypotheses_router, prefix=f"{settings.API_V1_STR}/hypotheses", tags=["Hypotheses"])
app.include_router(agent_router, prefix=f"{settings.API_V1_STR}/agent", tags=["AI Agent"])
app.include_router(root_cause_router, prefix=f"{settings.API_V1_STR}/root-cause", tags=["Root Cause"])
app.include_router(mitigations_router, prefix=f"{settings.API_V1_STR}/mitigations", tags=["Mitigations"])
app.include_router(reports_router, prefix=f"{settings.API_V1_STR}/reports", tags=["Reports"])
app.include_router(audit_router, prefix=f"{settings.API_V1_STR}/audit", tags=["Audit Logs"])
app.include_router(analytics_router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Analytics"])
app.include_router(settings_router, prefix=f"{settings.API_V1_STR}/settings", tags=["Settings"])

@app.get("/")
async def root():
    return {
        "status": "ONLINE",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
