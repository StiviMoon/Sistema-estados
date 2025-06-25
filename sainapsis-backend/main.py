from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from datetime import datetime

from app.core.database import db
from app.controllers.order_controller import router, health_router
from app.controllers.support_controller import router as support_router 
from app.controllers.review_controller import router as review_router


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
    description="State machine-based order processing system with support tickets",  
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

# Registrar routers básicos
app.include_router(health_router)
app.include_router(router)
app.include_router(support_router)  
app.include_router(review_router)

# Importar y configurar business rules
print("\n📦 Loading Business Rules System...")
business_rules_available = False

try:
    # Primero intentar importar el módulo business_rules
    from app.business_rules import BUSINESS_RULES_INITIALIZED
    print(f"   ✅ Business rules module loaded: INITIALIZED = {BUSINESS_RULES_INITIALIZED}")
    
    # Luego intentar importar el enhanced controller
    try:
        from app.controllers.enhanced_order_controller import enhanced_router
        print("   ✅ Enhanced controller imported successfully")
        
        if BUSINESS_RULES_INITIALIZED:
            app.include_router(enhanced_router)
            print("   ✅ Enhanced endpoints registered at /api/v2/orders")
            business_rules_available = True
            
            # Mostrar información adicional
            try:
                from app.business_rules import get_rule_info
                rules = get_rule_info()
                print(f"   📊 Active rules: {len(rules)}")
            except:
                pass
        else:
            print("   ⚠️ Business rules not initialized")
            
    except ImportError as e:
        print(f"   ❌ Failed to import enhanced controller: {e}")
        print(f"      Check if app/controllers/enhanced_order_controller.py exists")
        
except ImportError as e:
    print(f"   ❌ Failed to import business rules: {e}")
    print("   📝 Make sure app/business_rules/__init__.py exists")
except Exception as e:
    print(f"   ❌ Unexpected error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()

print(f"   📊 Business rules status: {'ACTIVE' if business_rules_available else 'NOT AVAILABLE'}")
print("")

# Variable para review controller (ya estaba en tu código)
review_controller_available = True  # Ya incluiste el router arriba

@app.get("/")
async def root():
    """Root endpoint with system information"""
    return {
        "message": "Sainapsis Order Management System",
        "version": "1.0.0",
        "features": {
            "original_api": True,
            "business_rules": business_rules_available,
            "enhanced_endpoints": business_rules_available,
            "review_system": review_controller_available
        },
        "endpoints": {
            # Endpoints originales (siempre disponibles)
            "health": "/health",
            "docs": "/docs", 
            "original_orders": "/orders",
            "support": "/support",
            
            # Endpoints condicionales
            **({"reviews": "/reviews"} if review_controller_available else {}),
            **({"enhanced_orders": "/api/v2/orders"} if business_rules_available else {}),
        },
        "business_rules_info": {
            "available": business_rules_available,
            "main_feature": "Orders ≤ $20 do not require verification" if business_rules_available else "Not available",
            "admin_endpoint": "/api/v2/orders/admin/business-rules" if business_rules_available else None,
            "test_endpoint": "/api/v2/orders/test/small-order-rule" if business_rules_available else None
        }
    }

@app.get("/system-status")
async def system_status():
    """Endpoint para verificar el estado del sistema completo"""
    try:
        # Verificar conexión a base de datos
        if not db.pool:
            await db.connect()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    # Verificar business rules de forma más robusta
    business_rules_status = "not available"
    try:
        # Re-intentar importación para estado actual
        from app.business_rules import BUSINESS_RULES_INITIALIZED, get_rule_info
        if BUSINESS_RULES_INITIALIZED:
            rules_count = len(get_rule_info())
            business_rules_status = f"active ({rules_count} rules)"
        else:
            business_rules_status = "module loaded but not initialized"
    except ImportError:
        business_rules_status = "module not found"
    except Exception as e:
        business_rules_status = f"error: {str(e)}"
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "components": {
            "database": db_status,
            "original_api": "active",
            "business_rules": business_rules_status,
            "review_system": "active" if review_controller_available else "not available"
        },
        "health_status": "healthy" if db_status == "connected" else "degraded",
        "debug": {
            "business_rules_available_flag": business_rules_available
        }
    }

# Debug endpoint para verificar rutas registradas
@app.get("/debug/routes")
async def debug_routes():
    """Endpoint de debug para ver todas las rutas registradas"""
    routes = []
    for route in app.routes:
        if hasattr(route, 'path') and hasattr(route, 'methods'):
            routes.append({
                "path": route.path,
                "methods": list(route.methods) if route.methods else [],
                "name": route.name if hasattr(route, 'name') else None
            })
    
    # Agrupar por prefijo
    v1_routes = [r for r in routes if not r['path'].startswith('/api/v2')]
    v2_routes = [r for r in routes if r['path'].startswith('/api/v2')]
    
    return {
        "total_routes": len(routes),
        "original_api_routes": len(v1_routes),
        "business_rules_api_routes": len(v2_routes),
        "routes_by_prefix": {
            "original": v1_routes[:10],  # Primeras 10 para no saturar
            "v2_business_rules": v2_routes[:10]
        },
        "business_rules_enabled": business_rules_available
    }


if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 STARTING SAINAPSIS ORDER MANAGEMENT SYSTEM")
    print("="*60)
    print(f"📊 Business Rules: {'ENABLED' if business_rules_available else 'DISABLED'}")
    print(f"📍 API Docs: http://localhost:8000/docs")
    if business_rules_available:
        print(f"🎯 Test endpoint: http://localhost:8000/api/v2/orders/test/small-order-rule")
    print("="*60 + "\n")
    
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")