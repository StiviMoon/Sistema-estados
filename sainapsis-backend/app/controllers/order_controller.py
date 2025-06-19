
# File: app/controllers/order_controller.py
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from uuid import UUID
from datetime import datetime

from app.models.schemas import (
    CreateOrderRequest,
    ProcessEventRequest,
    OrderResponse,
    EventResponse,
)
from app.models.domain import OrderState, EventType
from app.services.order_service import order_service
from app.core.database import db
from app.core.exceptions import (
    OrderException,
    OrderNotFound,
    InvalidTransition,
    InvalidOrderData,
)

# Router para órdenes
router = APIRouter(prefix="/orders", tags=["orders"])


async def get_db():
    """Dependency para asegurar conexión a DB"""
    if not db.pool:
        await db.connect()
    return db


@router.post("/", response_model=OrderResponse, status_code=201)
async def create_order(request: CreateOrderRequest, db_conn=Depends(get_db)):
    """
    Crear nueva orden

    - **product_ids**: Lista de IDs de productos
    - **amount**: Monto total de la orden
    - **metadata**: Metadatos adicionales (opcional)
    """
    try:
        order = await order_service.create_order(
            product_ids=request.product_ids,
            amount=request.amount,
            metadata=request.metadata,
        )

        return OrderResponse(
            id=order.id,
            product_ids=order.product_ids,
            amount=order.amount,
            state=order.state,
            metadata=order.metadata,
            created_at=order.created_at,
            updated_at=order.updated_at,
        )

    except InvalidOrderData as e:
        raise HTTPException(status_code=400, detail=e.message)
    except OrderException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/{order_id}/events", response_model=EventResponse)
async def process_event(
    order_id: UUID, request: ProcessEventRequest, db_conn=Depends(get_db)
):
    """
    Procesar evento en una orden

    - **order_id**: ID de la orden
    - **event_type**: Tipo de evento a procesar
    - **metadata**: Metadatos del evento (opcional)
    """
    try:
        old_order = await order_service.get_order(order_id)
        old_state = old_order.state

        updated_order = await order_service.process_event(
            order_id=order_id, event_type=request.event_type, metadata=request.metadata
        )

        return EventResponse(
            order_id=updated_order.id,
            old_state=old_state,
            new_state=updated_order.state,
            event_type=request.event_type,
            processed_at=updated_order.updated_at,
        )

    except OrderNotFound as e:
        raise HTTPException(status_code=404, detail=e.message)
    except InvalidTransition as e:
        raise HTTPException(status_code=400, detail=e.message)
    except OrderException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(order_id: UUID, db_conn=Depends(get_db)):
    """
    Obtener orden por ID

    - **order_id**: ID de la orden
    """
    try:
        order = await order_service.get_order(order_id)

        return OrderResponse(
            id=order.id,
            product_ids=order.product_ids,
            amount=order.amount,
            state=order.state,
            metadata=order.metadata,
            created_at=order.created_at,
            updated_at=order.updated_at,
        )

    except OrderNotFound as e:
        raise HTTPException(status_code=404, detail=e.message)
    except OrderException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/", response_model=List[OrderResponse])
async def get_all_orders(db_conn=Depends(get_db)):
    """
    Obtener todas las órdenes
    """
    try:
        orders = await order_service.get_all_orders()

        return [
            OrderResponse(
                id=order.id,
                product_ids=order.product_ids,
                amount=order.amount,
                state=order.state,
                metadata=order.metadata,
                created_at=order.created_at,
                updated_at=order.updated_at,
            )
            for order in orders
        ]

    except OrderException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{order_id}/allowed-events", response_model=List[str])
async def get_allowed_events(order_id: UUID, db_conn=Depends(get_db)):
    """
    Obtener eventos permitidos para una orden

    - **order_id**: ID de la orden
    """
    try:
        events = await order_service.get_allowed_events(order_id)
        return [event.value for event in events]

    except OrderNotFound as e:
        raise HTTPException(status_code=404, detail=e.message)
    except OrderException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{order_id}/history")
async def get_order_history(order_id: UUID, db_conn=Depends(get_db)):
    """
    Obtener historial de eventos de una orden

    - **order_id**: ID de la orden
    """
    try:
        history = await order_service.get_order_history(order_id)
        return {"order_id": order_id, "events": history, "total_events": len(history)}

    except OrderNotFound as e:
        raise HTTPException(status_code=404, detail=e.message)
    except OrderException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# Health check endpoint
health_router = APIRouter(tags=["health"])


@health_router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        if not db.pool:
            await db.connect()

        # Test DB connection
        result = await db.execute_query("SELECT 1 as status")

        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")
