
# File: app/repositories/order_repository.py

"""
    El OrderRepository es el repository más importante del sistema. 
    Maneja todas las operaciones de base de datos para órdenes, eventos y la creación de tickets de soporte.
"""

import json
from typing import Optional, List
from uuid import UUID, uuid4
from datetime import datetime

from app.models.domain import Order, OrderState, EventType
from app.core.database import db
from app.core.exceptions import OrderNotFound, DatabaseError


class OrderRepository:
    """Repository para manejo de órdenes en base de datos"""

    async def create_order(
        self, product_ids: List[str], amount: float, metadata: dict
    ) -> Order:
        """Crear nueva orden"""
        try:
            order_id = uuid4()

            query = """
                INSERT INTO orders (id, product_ids, amount, metadata)
                VALUES ($1, $2, $3, $4)
                RETURNING id, product_ids, amount, state, metadata, created_at, updated_at
            """

            # Convertir metadata a JSON string
            metadata_json = json.dumps(metadata) if metadata else "{}"

            result = await db.execute_query(
                query, order_id, product_ids, amount, metadata_json
            )

            if not result:
                raise DatabaseError("Failed to create order")

            row = result[0]
            return Order(
                id=row["id"],
                product_ids=row["product_ids"],
                amount=float(row["amount"]),
                state=OrderState(row["state"]),
                metadata=(
                    row["metadata"]
                    if isinstance(row["metadata"], dict)
                    else json.loads(row["metadata"])
                ),
                created_at=row["created_at"],
                updated_at=row["updated_at"],
            )

        except Exception as e:
            if isinstance(e, DatabaseError):
                raise
            raise DatabaseError(f"Error creating order: {str(e)}")

    async def get_order_by_id(self, order_id: UUID) -> Optional[Order]:
        """Obtener orden por ID"""
        try:
            query = "SELECT * FROM orders WHERE id = $1"
            result = await db.execute_query(query, order_id)

            if not result:
                return None

            row = result[0]
            return Order(
                id=row["id"],
                product_ids=row["product_ids"],
                amount=float(row["amount"]),
                state=OrderState(row["state"]),
                metadata=(
                    row["metadata"]
                    if isinstance(row["metadata"], dict)
                    else json.loads(row["metadata"])
                ),
                created_at=row["created_at"],
                updated_at=row["updated_at"],
            )

        except Exception as e:
            raise DatabaseError(f"Error fetching order {order_id}: {str(e)}")

    async def update_order_state(
        self, order_id: UUID, new_state: OrderState, metadata: dict
    ) -> Order:
        """Actualizar estado de orden"""
        try:
            # Convertir metadata a JSON string
            metadata_json = json.dumps(metadata) if metadata else "{}"

            query = """
                UPDATE orders 
                SET state = $2, metadata = $3, updated_at = NOW()
                WHERE id = $1
                RETURNING id, product_ids, amount, state, metadata, created_at, updated_at
            """

            result = await db.execute_query(
                query, order_id, new_state.value, metadata_json
            )

            if not result:
                raise OrderNotFound(str(order_id))

            row = result[0]
            return Order(
                id=row["id"],
                product_ids=row["product_ids"],
                amount=float(row["amount"]),
                state=OrderState(row["state"]),
                metadata=(
                    row["metadata"]
                    if isinstance(row["metadata"], dict)
                    else json.loads(row["metadata"])
                ),
                created_at=row["created_at"],
                updated_at=row["updated_at"],
            )

        except OrderNotFound:
            raise
        except Exception as e:
            raise DatabaseError(f"Error updating order {order_id}: {str(e)}")

    async def get_all_orders(self) -> List[Order]:
        """Obtener todas las órdenes"""
        try:
            query = "SELECT * FROM orders ORDER BY created_at DESC"
            result = await db.execute_query(query)

            orders = []
            for row in result:
                orders.append(
                    Order(
                        id=row["id"],
                        product_ids=row["product_ids"],
                        amount=float(row["amount"]),
                        state=OrderState(row["state"]),
                        metadata=(
                            row["metadata"]
                            if isinstance(row["metadata"], dict)
                            else json.loads(row["metadata"])
                        ),
                        created_at=row["created_at"],
                        updated_at=row["updated_at"],
                    )
                )

            return orders

        except Exception as e:
            raise DatabaseError(f"Error fetching orders: {str(e)}")

    async def log_event(
        self,
        order_id: UUID,
        event_type: EventType,
        old_state: OrderState,
        new_state: OrderState,
        metadata: dict,
    ):
        """Registrar evento en log"""
        try:
            # Convertir metadata a JSON string
            metadata_json = json.dumps(metadata) if metadata else "{}"

            query = """
                INSERT INTO order_events (order_id, event_type, old_state, new_state, metadata)
                VALUES ($1, $2, $3, $4, $5)
            """

            await db.execute_command(
                query,
                order_id,
                event_type.value,
                old_state.value,
                new_state.value,
                metadata_json,
            )

        except Exception as e:
            # Log error but don't fail the main operation
            print(f"Warning: Failed to log event: {e}")

    async def create_support_ticket(
        self, order_id: UUID, reason: str, amount: float, metadata: dict
    ):
        """Crear ticket de soporte"""
        try:
            # Convertir metadata a JSON string
            metadata_json = json.dumps(metadata) if metadata else "{}"

            query = """
                INSERT INTO support_tickets (order_id, reason, amount, metadata)
                VALUES ($1, $2, $3, $4)
                RETURNING id
            """

            result = await db.execute_query(
                query, order_id, reason, amount, metadata_json
            )

            if result:
                print(f"✅ Support ticket created for order {order_id}: {reason}")
                return result[0]["id"]

        except Exception as e:
            print(f"❌ Failed to create support ticket: {e}")
            # Don't raise - support ticket creation shouldn't fail the main operation


# Instancia global
order_repository = OrderRepository()
