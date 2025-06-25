from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
from uuid import UUID

from app.services.order_service import order_service
from app.models.domain import EventType
from app.core.database import db

router = APIRouter(prefix="/reviews", tags=["Order Reviews"])

@router.get("/pending")
async def get_orders_pending_review():
    """Obtener órdenes pendientes de revisión"""
    orders = await order_service.get_all_orders()
    return [
        order for order in orders 
        if order.state == "reviewing"
    ]

@router.post("/{order_id}/approve")
async def approve_review(order_id: UUID, notes: Dict[str, Any] = None):
    """Aprobar revisión de una orden"""
    try:
        metadata = notes or {}
        metadata["reviewed_by"] = "manager"  # En producción, obtener del JWT
        metadata["review_action"] = "approved"
        
        order = await order_service.process_event(
            order_id=order_id,
            event_type=EventType.REVIEW_APPROVED,
            metadata=metadata
        )
        
        return {
            "message": "Order review approved",
            "order_id": order_id,
            "new_state": order.state
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{order_id}/reject")
async def reject_review(order_id: UUID, reason: Dict[str, str]):
    """Rechazar revisión de una orden"""
    try:
        metadata = {
            "reviewed_by": "manager",
            "review_action": "rejected",
            "rejection_reason": reason.get("reason", "No reason provided")
        }
        
        order = await order_service.process_event(
            order_id=order_id,
            event_type=EventType.REVIEW_REJECTED,
            metadata=metadata
        )
        
        return {
            "message": "Order review rejected",
            "order_id": order_id,
            "new_state": order.state
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))