#order_service.py
from typing import List, Dict, Any
from uuid import UUID
from datetime import datetime

from app.models.domain import Order, OrderState, EventType
from app.repositories.order_repository import order_repository
from app.services.state_machine import StateMachine
from app.core.exceptions import OrderNotFound, InvalidTransition, InvalidOrderData
from app.repositories.support_repository import support_repository  

class OrderService:
    """Servicio principal para lógica de negocio de órdenes"""

    def __init__(self):
        self.repository = order_repository
        self.support_repository = support_repository 
        self.state_machine = StateMachine()

    async def _apply_business_logic(
        self, order: Order, event_type: EventType, metadata: Dict[str, Any]
    ):
        """Aplicar reglas de negocio específicas"""

        # REGLA 1: paymentFailed con monto > 1000 USD
        if event_type == EventType.PAYMENT_FAILED and order.amount > 1000:
           
            ticket = await self.support_repository.create_support_ticket(
                order_id=order.id,
                reason=f"High amount payment failure: ${order.amount}",
                amount=order.amount,
                metadata={
                    "event_type": event_type.value,
                    "original_metadata": metadata,
                    "auto_created": True,
                    "created_by": "order_service",
                    "priority": "high" if order.amount > 2000 else "medium"
                },
            )
            print(
                f"🎫 Support ticket created: {ticket.id} for high-value payment failure: Order {order.id}"
            )
    
    async def create_order(
        self, product_ids: List[str], amount: float, metadata: Dict[str, Any] = None
    ) -> Order:
        """Crear nueva orden"""
        # Validaciones de negocio
        if not product_ids:
            raise InvalidOrderData("Product IDs cannot be empty")

        if amount <= 0:
            raise InvalidOrderData("Amount must be greater than 0")

        # Crear orden con estado inicial PENDING
        metadata = metadata or {}
        metadata["created_by"] = "order_service"
        metadata["initial_state"] = OrderState.PENDING.value

        order = await self.repository.create_order(product_ids, amount, metadata)

        # Log evento de creación
        await self.repository.log_event(
            order_id=order.id,
            event_type=EventType.ORDER_CANCELLED,  # Usamos uno existente para el log
            old_state=OrderState.PENDING,
            new_state=OrderState.PENDING,
            metadata={"action": "order_created"},
        )

        return order

    async def process_event(
        self, order_id: UUID, event_type: EventType, metadata: Dict[str, Any] = None
    ) -> Order:
        """Procesar evento en una orden - CORE DEL SISTEMA"""
        # 1. Obtener orden actual
        order = await self.repository.get_order_by_id(order_id)
        if not order:
            raise OrderNotFound(str(order_id))

        # 2. Validar transición usando máquina de estados
        old_state = order.state
        try:
            new_state = self.state_machine.get_next_state(old_state, event_type)
        except InvalidTransition as e:
            raise e

        # 3. Aplicar lógica de negocio específica ANTES de cambiar estado
        await self._apply_business_logic(order, event_type, metadata or {})

        # 4. Actualizar estado en base de datos
        updated_metadata = order.metadata.copy()
        if metadata:
            updated_metadata.update(metadata)

        updated_metadata["last_event"] = event_type.value
        updated_metadata["last_transition"] = f"{old_state.value} -> {new_state.value}"
        updated_metadata["processed_at"] = datetime.utcnow().isoformat()

        updated_order = await self.repository.update_order_state(
            order_id, new_state, updated_metadata
        )

        # 5. Log del evento
        await self.repository.log_event(
            order_id=order_id,
            event_type=event_type,
            old_state=old_state,
            new_state=new_state,
            metadata=metadata or {},
        )

        return updated_order

    async def _apply_business_logic(
        self, order: Order, event_type: EventType, metadata: Dict[str, Any]
    ):
        """Aplicar reglas de negocio específicas"""

        # REGLA 1: paymentFailed con monto > 1000 USD
        if event_type == EventType.PAYMENT_FAILED and order.amount > 1000:
            await self.repository.create_support_ticket(
                order_id=order.id,
                reason=f"High amount payment failure: ${order.amount}",
                amount=order.amount,
                metadata={
                    "event_type": event_type.value,
                    "original_metadata": metadata,
                    "auto_created": True,
                },
            )
            print(
                f"🎫 Support ticket created for high-value payment failure: Order {order.id}"
            )

        # REGLA 2: Aquí se pueden agregar más reglas de negocio fácilmente
        # if event_type == EventType.DELIVERY_ISSUE:
        #     await self._handle_delivery_issue(order, metadata)

    async def get_order(self, order_id: UUID) -> Order:
        """Obtener orden por ID"""
        order = await self.repository.get_order_by_id(order_id)
        if not order:
            raise OrderNotFound(str(order_id))
        return order

    async def get_all_orders(self) -> List[Order]:
        """Obtener todas las órdenes"""
        return await self.repository.get_all_orders()

    async def get_allowed_events(self, order_id: UUID) -> List[EventType]:
        """Obtener eventos permitidos para una orden"""
        order = await self.repository.get_order_by_id(order_id)
        if not order:
            raise OrderNotFound(str(order_id))

        return self.state_machine.get_allowed_events(order.state)

    async def get_order_history(self, order_id: UUID) -> List[Dict[str, Any]]:
        """Obtener historial de eventos de una orden"""
        # Verificar que la orden existe
        order = await self.repository.get_order_by_id(order_id)
        if not order:
            raise OrderNotFound(str(order_id))

        # Obtener eventos del log
        try:
            query = """
                SELECT event_type, old_state, new_state, metadata, created_at
                FROM order_events 
                WHERE order_id = $1 
                ORDER BY created_at ASC
            """
            from app.core.database import db

            result = await db.execute_query(query, order_id)

            return [
                {
                    "event_type": row["event_type"],
                    "old_state": row["old_state"],
                    "new_state": row["new_state"],
                    "metadata": row["metadata"],
                    "created_at": row["created_at"],
                }
                for row in result
            ]
        except Exception as e:
            print(f"Warning: Could not fetch order history: {e}")
            return []


# Instancia global
order_service = OrderService()
