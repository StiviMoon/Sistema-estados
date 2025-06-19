#  app/models/schemas.py

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from .domain import OrderState, EventType


class CreateOrderRequest(BaseModel):
    product_ids: List[str] = Field(min_items=1)
    amount: float = Field(gt=0)
    metadata: Optional[Dict[str, Any]] = {}


class ProcessEventRequest(BaseModel):
    event_type: EventType
    metadata: Optional[Dict[str, Any]] = {}


class OrderResponse(BaseModel):
    id: UUID
    product_ids: List[str]
    amount: float
    state: OrderState
    metadata: Dict[str, Any]
    created_at: datetime
    updated_at: datetime


class EventResponse(BaseModel):
    order_id: UUID
    old_state: OrderState
    new_state: OrderState
    event_type: EventType
    processed_at: datetime


class SupportTicketResponse(BaseModel):
    """Respuesta de ticket de soporte"""
    id: UUID
    order_id: UUID
    reason: str
    amount: float
    status: str
    metadata: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


class UpdateTicketStatusRequest(BaseModel):
    """Request para actualizar estado del ticket"""
    status: str = Field(..., description="Nuevo estado del ticket")
    metadata: Optional[Dict[str, Any]] = Field(
        default=None, 
        description="Metadata adicional"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "status": "resolved",
                "metadata": {
                    "resolved_by": "support_agent_1",
                    "resolution_notes": "Payment issue resolved with customer",
                    "resolution_time": "2025-06-12T15:30:00Z"
                }
            }
        }