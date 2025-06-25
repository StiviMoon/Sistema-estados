# app/controllers/enhanced_order_controller.py


from fastapi import APIRouter, HTTPException, Depends, Header, Query
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

# Importaciones del sistema existente
from app.models.schemas import CreateOrderRequest, ProcessEventRequest
from app.models.domain import EventType
from app.services.order_service import order_service
from app.core.database import db
from app.core.exceptions import (
    OrderNotFound,
    InvalidTransition,
    InvalidOrderData,
)

# Importaciones del sistema de business rules
from app.business_rules import get_sainapsis_order_adapter, get_rule_info


# Router para endpoints mejorados
enhanced_router = APIRouter(
    prefix="/api/v2/orders", 
    tags=["Enhanced Orders with Business Rules"]
)


# ============================================================================
# MODELOS PYDANTIC (Field se usa aquí)
# ============================================================================

class EnhancedCreateOrderRequest(BaseModel):
    """Request mejorado para crear órdenes"""
    product_ids: List[str] = Field(..., min_length=1)
    amount: float = Field(..., gt=0)
    metadata: Optional[Dict[str, Any]] = Field(default=None)
    country_code: Optional[str] = Field(default=None, pattern="^[A-Z]{2}$")


class EnhancedOrderResponse(BaseModel):
    """Response con contexto de business rules"""
    order: Dict[str, Any]
    allowed_events: List[str]
    business_context: Dict[str, Any]
    applied_rules: List[str]
    requires_manual_review: bool
    flagged_for_review: bool
    rule_summary: Dict[str, Any]


class BusinessRulesInfoResponse(BaseModel):
    """Información sobre reglas de negocio"""
    rules: List[Dict[str, Any]]
    total_count: int
    by_type: Dict[str, int]
    system_status: str


# ============================================================================
# DEPENDENCIAS
# ============================================================================

async def get_db():
    """Dependency para conexión a DB"""
    if not db.pool:
        await db.connect()
    return db


def get_user_context(
    country_code: Optional[str] = Header(default=None, alias="X-Country-Code"),
    user_id: Optional[str] = Header(default=None, alias="X-User-ID"),
    ip_country: Optional[str] = Header(default=None, alias="X-IP-Country"),
    user_agent: Optional[str] = Header(default=None, alias="User-Agent")
) -> Dict[str, Any]:
    """Extrae contexto del usuario desde headers HTTP"""
    context = {}
    
    if country_code:
        context["country_code"] = country_code.upper()
    if user_id:
        context["user_id"] = user_id
    if ip_country:
        context["ip_country"] = ip_country.upper()
    if user_agent:
        context["user_agent"] = user_agent
        
    return context


# ============================================================================
# ENDPOINTS PRINCIPALES
# ============================================================================

@enhanced_router.post("/", response_model=EnhancedOrderResponse, status_code=201)
async def create_enhanced_order(
    request: EnhancedCreateOrderRequest,
    user_context: Dict[str, Any] = Depends(get_user_context),
    db_conn=Depends(get_db)
):
    """
    🚀 Crear orden con business rules aplicadas
    
    - Aplica validaciones de business rules
    - Enriquece datos según el contexto
    - Filtra eventos automáticamente
    """
    try:
        adapter = get_sainapsis_order_adapter()
        
        # Agregar country_code al contexto si viene en el request
        if request.country_code:
            user_context["country_code"] = request.country_code
        
        # Preparar metadata
        metadata = request.metadata or {}
        if user_context.get("country_code"):
            metadata["country_code"] = user_context["country_code"]
        
        # Validar con business rules
        validation_result = await adapter.validate_order_before_creation(
            product_ids=request.product_ids,
            amount=request.amount,
            metadata=metadata,
            user_context=user_context
        )
        
        if not validation_result["validation_passed"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Validation failed: {validation_result.get('validation_error', 'Unknown error')}"
            )
        
        # Crear orden usando el servicio original
        order = await order_service.create_order(
            product_ids=request.product_ids,
            amount=request.amount,
            metadata=metadata,
        )
        
        # Obtener orden con contexto de business rules
        order_with_context = await adapter.get_order_with_business_context(
            order.id, user_context
        )
        
        return EnhancedOrderResponse(**order_with_context)
        
    except InvalidOrderData as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating order: {str(e)}")


@enhanced_router.get("/{order_id}", response_model=EnhancedOrderResponse)
async def get_enhanced_order(
    order_id: UUID,
    user_context: Dict[str, Any] = Depends(get_user_context),
    db_conn=Depends(get_db)
):
    """📊 Obtener orden con contexto de business rules"""
    try:
        adapter = get_sainapsis_order_adapter()
        order_with_context = await adapter.get_order_with_business_context(
            order_id, user_context
        )
        return EnhancedOrderResponse(**order_with_context)
        
    except OrderNotFound:
        raise HTTPException(status_code=404, detail="Order not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@enhanced_router.get("/{order_id}/allowed-events-filtered")
async def get_filtered_allowed_events(
    order_id: UUID,
    user_context: Dict[str, Any] = Depends(get_user_context),
    db_conn=Depends(get_db)
):
    """
    🎯 ENDPOINT CLAVE: Eventos filtrados por business rules
    
    Para órdenes ≤ $20: NO incluye 'pendingBiometricalVerification'
    """
    try:
        adapter = get_sainapsis_order_adapter()
        
        # Obtener orden y eventos base
        order = await order_service.get_order(order_id)
        base_events = await order_service.get_allowed_events(order_id)
        
        # Aplicar filtros
        filtered_events = await adapter.get_filtered_allowed_events(order_id, user_context)
        
        # Calcular diferencias
        removed_events = [e for e in base_events if e not in filtered_events]
        
        return {
            "order_id": str(order_id),
            "order_amount": order.amount,
            "order_state": order.state.value,
            "base_events": [event.value for event in base_events],
            "filtered_events": [event.value for event in filtered_events],
            "events_removed": [event.value for event in removed_events],
            "events_removed_count": len(removed_events),
            "small_order_rule_applied": (
                order.amount <= 20 and 
                EventType.PENDING_BIOMETRICAL_VERIFICATION in base_events and
                EventType.PENDING_BIOMETRICAL_VERIFICATION not in filtered_events
            ),
            "threshold": 20.0
        }
        
    except OrderNotFound:
        raise HTTPException(status_code=404, detail="Order not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@enhanced_router.post("/{order_id}/events-enhanced")
async def process_event_enhanced(
    order_id: UUID,
    request: ProcessEventRequest,
    user_context: Dict[str, Any] = Depends(get_user_context),
    db_conn=Depends(get_db)
):
    """⚡ Procesar evento con business rules"""
    try:
        adapter = get_sainapsis_order_adapter()
        
        result = await adapter.process_event_with_business_rules(
            order_id=order_id,
            event_type=request.event_type,
            metadata=request.metadata,
            user_context=user_context
        )
        
        order = result["updated_order"]
        
        return {
            "order_id": str(order.id),
            "new_state": order.state.value,
            "event_type": request.event_type.value,
            "processed_at": order.updated_at.isoformat(),
            "business_rules_applied": result["business_rules_applied"],
            "allowed_events": [e.value for e in result["filtered_events"]]
        }
        
    except OrderNotFound:
        raise HTTPException(status_code=404, detail="Order not found")
    except InvalidTransition as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# ============================================================================
# ENDPOINTS DE ADMINISTRACIÓN
# ============================================================================

@enhanced_router.get("/admin/business-rules", response_model=BusinessRulesInfoResponse)
async def get_business_rules_info():
    """📋 Información sobre reglas registradas"""
    try:
        rules_info = get_rule_info()
        
        by_type = {}
        for rule in rules_info:
            rule_type = rule["type"]
            by_type[rule_type] = by_type.get(rule_type, 0) + 1
        
        return BusinessRulesInfoResponse(
            rules=rules_info,
            total_count=len(rules_info),
            by_type=by_type,
            system_status="active"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@enhanced_router.post("/admin/rules/{rule_id}/toggle")
async def toggle_business_rule(
    rule_id: str, 
    enable: bool = Query(default=True, description="Enable or disable the rule")
):
    """🔧 Habilitar/deshabilitar una regla"""
    try:
        from app.business_rules import enable_rule, disable_rule
        
        if enable:
            success = enable_rule(rule_id)
            action = "enabled"
        else:
            success = disable_rule(rule_id)
            action = "disabled"
        
        if success:
            return {
                "message": f"Rule {rule_id} {action} successfully",
                "rule_id": rule_id,
                "enabled": enable
            }
        else:
            raise HTTPException(status_code=404, detail=f"Rule {rule_id} not found")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@enhanced_router.post("/admin/small-order-threshold")
async def update_small_order_threshold(
    new_threshold: float = Query(..., gt=0, le=1000, description="New threshold amount")
):
    """
    💰 Actualizar threshold de órdenes pequeñas
    
    Cambia el límite de $20 a otro valor
    """
    try:
        from app.business_rules import change_small_order_threshold
        
        success = change_small_order_threshold(new_threshold)
        
        if success:
            return {
                "message": f"Small order threshold updated to ${new_threshold}",
                "old_threshold": 20.0,
                "new_threshold": new_threshold,
                "effect": f"Orders ${new_threshold} or less will not require verification"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to update threshold")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


# ============================================================================
# ENDPOINTS DE TESTING Y DEBUG
# ============================================================================

@enhanced_router.get("/test/small-order-rule")
async def test_small_order_rule():
    """🧪 Test de la regla de órdenes pequeñas"""
    try:
        test_results = []
        test_amounts = [5.0, 15.0, 20.0, 25.0, 100.0]
        
        # Importar lo necesario para el test
        from app.models.domain import Order, OrderState
        from app.business_rules.base import RuleContext
        from app.business_rules import get_business_rule_evaluator
        
        for amount in test_amounts:
            # Crear orden temporal
            temp_order = Order(
                id=None,
                product_ids=["TEST"],
                amount=amount,
                state=OrderState.PENDING,
                metadata={},
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            # Eventos base
            base_events = [
                EventType.NO_VERIFICATION_NEEDED,
                EventType.PENDING_BIOMETRICAL_VERIFICATION,
                EventType.ORDER_CANCELLED_BY_USER
            ]
            
            # Aplicar filtros
            context = RuleContext(order=temp_order)
            evaluator = get_business_rule_evaluator()
            filtered_events = evaluator.filter_available_events(base_events, context)
            
            verification_removed = (
                EventType.PENDING_BIOMETRICAL_VERIFICATION not in filtered_events
            )
            
            test_results.append({
                "amount": amount,
                "verification_removed": verification_removed,
                "rule_should_apply": amount <= 20,
                "test_passed": (amount <= 20) == verification_removed
            })
        
        all_passed = all(r["test_passed"] for r in test_results)
        
        return {
            "test_name": "Small Order Rule Test",
            "all_tests_passed": all_passed,
            "test_results": test_results,
            "threshold": 20.0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test error: {str(e)}")


@enhanced_router.post("/{order_id}/simulate-rules")
async def simulate_business_rules(
    order_id: UUID,
    user_context: Dict[str, Any] = Depends(get_user_context),
    db_conn=Depends(get_db)
):
    """🧪 Simular aplicación de reglas sin ejecutarlas"""
    try:
        adapter = get_sainapsis_order_adapter()
        simulation = await adapter.simulate_rules_for_order(order_id, user_context)
        
        return {
            **simulation,
            "simulation_timestamp": datetime.utcnow().isoformat()
        }
    except OrderNotFound:
        raise HTTPException(status_code=404, detail="Order not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@enhanced_router.get("/{order_id}/business-preview")
async def get_business_rules_preview(
    order_id: UUID,
    user_context: Dict[str, Any] = Depends(get_user_context),
    db_conn=Depends(get_db)
):
    """🔍 Preview de reglas aplicables a una orden"""
    try:
        adapter = get_sainapsis_order_adapter()
        order = await order_service.get_order(order_id)
        
        # Obtener eventos filtrados
        base_events = await order_service.get_allowed_events(order_id)
        filtered_events = await adapter.get_filtered_allowed_events(order_id, user_context)
        
        # Mensajes de preview
        preview_messages = []
        
        if order.amount <= 20:
            preview_messages.append(f"💡 Small order (${order.amount}): No verification required")
        
        if order.amount > 1000:
            preview_messages.append("⚠️ High value order: Support ticket on payment failure")
        
        if order.amount > 5000:
            preview_messages.append("🔍 Ultra high value: Manual review required")
        
        return {
            "order_id": str(order_id),
            "order_amount": order.amount,
            "order_state": order.state.value,
            "preview_messages": preview_messages,
            "events_comparison": {
                "base_events": [e.value for e in base_events],
                "filtered_events": [e.value for e in filtered_events],
                "removed": [e.value for e in base_events if e not in filtered_events]
            }
        }
        
    except OrderNotFound:
        raise HTTPException(status_code=404, detail="Order not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")