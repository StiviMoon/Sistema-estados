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
