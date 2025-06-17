# Agregar esto a tu app/models/domain.py

from enum import Enum
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID
from typing import List, Dict, Any


class OrderState(str, Enum):
    PENDING = "pending"
    ON_HOLD = "on_hold"
    PENDING_PAYMENT = "pending_payment"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    RETURNING = "returning"
    RETURNED = "returned"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class EventType(str, Enum):
    PENDING_BIOMETRICAL_VERIFICATION = "pendingBiometricalVerification"
    NO_VERIFICATION_NEEDED = "noVerificationNeeded"
    PAYMENT_FAILED = "paymentFailed"
    ORDER_CANCELLED = "orderCancelled"
    BIOMETRICAL_VERIFICATION_SUCCESSFUL = "biometricalVerificationSuccessful"
    VERIFICATION_FAILED = "verificationFailed"
    ORDER_CANCELLED_BY_USER = "orderCancelledByUser"
    PAYMENT_SUCCESSFUL = "paymentSuccessful"
    PREPARING_SHIPMENT = "preparingShipment"
    ITEM_DISPATCHED = "itemDispatched"
    ITEM_RECEIVED_BY_CUSTOMER = "itemReceivedByCustomer"
    DELIVERY_ISSUE = "deliveryIssue"
    RETURN_INITIATED_BY_CUSTOMER = "returnInitiatedByCustomer"
    ITEM_RECEIVED_BACK = "itemReceivedBack"
    REFUND_PROCESSED = "refundProcessed"


@dataclass
class Order:
    id: UUID
    product_ids: List[str]
    amount: float
    state: OrderState
    metadata: Dict[str, Any]
    created_at: datetime
    updated_at: datetime


@dataclass
class SupportTicket:
    """Entidad de ticket de soporte"""
    id: UUID
    order_id: UUID
    reason: str
    amount: float
    status: str
    metadata: Dict[str, Any]
    created_at: datetime
    
