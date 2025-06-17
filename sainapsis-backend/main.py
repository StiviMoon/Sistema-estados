from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.core.database import db
from app.controllers.order_controller import router, health_router
from app.controllers.support_controller import router as support_router  # 🆕 AGREGAR ESTA LÍNEA


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestión del ciclo de vida de la aplicación"""
    # Startup
    print("🚀 Starting Sainapsis Order Management API...")
    await db.connect()
    print("✅ Database connected successfully")

    yield

    # Shutdown
    print("🛑 Shutting down Sainapsis Order Management API...")
    await db.disconnect()
    print("✅ Database disconnected successfully")


# Crear aplicación FastAPI
app = FastAPI(
    title="Sainapsis Order Management API",
    description="State machine-based order processing system with support tickets",  # 🔄 OPCIONAL: Actualizar descripción
    version="1.0.0",
    lifespan=lifespan,
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(health_router)
app.include_router(router)
app.include_router(support_router)  


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Sainapsis Order Management API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health",
        "features": ["Order Management", "Support Tickets", "State Machine"],  
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")