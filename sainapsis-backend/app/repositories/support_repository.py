# app/repositories/support_repository.py

"""
 El SupportRepository es responsable de todas las operaciones de base de datos relacionadas con tickets de soporte. 
 Sigue el patrón Repository para aislar la lógica de acceso a datos.
"""


import json
from typing import List, Dict, Any, Optional
from uuid import UUID, uuid4
from datetime import datetime

from app.models.domain import SupportTicket
from app.core.database import db
from app.core.exceptions import DatabaseError


class SupportRepository:
    """Repository para manejo de tickets de soporte"""

    async def create_support_ticket(
        self, order_id: UUID, reason: str, amount: float, metadata: dict
    ) -> SupportTicket:
        """Crear ticket de soporte"""
        try:
            ticket_id = uuid4()
            
            # Convertir metadata a JSON string
            metadata_json = json.dumps(metadata) if metadata else "{}"

            query = """
                INSERT INTO support_tickets (id, order_id, reason, amount, metadata)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, order_id, reason, amount, status, metadata, created_at
            """

            result = await db.execute_query(
                query, ticket_id, order_id, reason, amount, metadata_json
            )

            if not result:
                raise DatabaseError("Failed to create support ticket")

            row = result[0]
            return SupportTicket(
                id=row["id"],
                order_id=row["order_id"],
                reason=row["reason"],
                amount=float(row["amount"]),
                status=row["status"],
                metadata=(
                    row["metadata"]
                    if isinstance(row["metadata"], dict)
                    else json.loads(row["metadata"])
                ),
                created_at=row["created_at"],
            )

        except Exception as e:
            if isinstance(e, DatabaseError):
                raise
            raise DatabaseError(f"Error creating support ticket: {str(e)}")

    async def get_all_tickets(self) -> List[SupportTicket]:
        """Obtener todos los tickets"""
        try:
            query = """
                SELECT id, order_id, reason, amount, status, metadata, created_at
                FROM support_tickets 
                ORDER BY created_at DESC
            """
            
            result = await db.execute_query(query)
            
            return [
                SupportTicket(
                    id=row["id"],
                    order_id=row["order_id"],
                    reason=row["reason"],
                    amount=float(row["amount"]),
                    status=row["status"],
                    metadata=(
                        row["metadata"]
                        if isinstance(row["metadata"], dict)
                        else json.loads(row["metadata"])
                    ),
                    created_at=row["created_at"],
                )
                for row in result
            ]

        except Exception as e:
            raise DatabaseError(f"Error fetching tickets: {str(e)}")

    async def get_ticket_by_id(self, ticket_id: UUID) -> Optional[SupportTicket]:
        """Obtener ticket por ID"""
        try:
            query = """
                SELECT id, order_id, reason, amount, status, metadata, created_at
                FROM support_tickets 
                WHERE id = $1
            """
            
            result = await db.execute_query(query, ticket_id)
            
            if not result:
                return None
                
            row = result[0]
            return SupportTicket(
                id=row["id"],
                order_id=row["order_id"],
                reason=row["reason"],
                amount=float(row["amount"]),
                status=row["status"],
                metadata=(
                    row["metadata"]
                    if isinstance(row["metadata"], dict)
                    else json.loads(row["metadata"])
                ),
                created_at=row["created_at"],
            )

        except Exception as e:
            raise DatabaseError(f"Error fetching ticket {ticket_id}: {str(e)}")

    async def get_tickets_by_order_id(self, order_id: UUID) -> List[SupportTicket]:
        """Obtener tickets por order_id"""
        try:
            query = """
                SELECT id, order_id, reason, amount, status, metadata, created_at
                FROM support_tickets 
                WHERE order_id = $1
                ORDER BY created_at DESC
            """
            
            result = await db.execute_query(query, order_id)
            
            return [
                SupportTicket(
                    id=row["id"],
                    order_id=row["order_id"],
                    reason=row["reason"],
                    amount=float(row["amount"]),
                    status=row["status"],
                    metadata=(
                        row["metadata"]
                        if isinstance(row["metadata"], dict)
                        else json.loads(row["metadata"])
                    ),
                    created_at=row["created_at"],
                )
                for row in result
            ]

        except Exception as e:
            raise DatabaseError(f"Error fetching tickets for order {order_id}: {str(e)}")

    async def update_ticket_status(
        self, 
        ticket_id: UUID, 
        new_status: str, 
        metadata: Dict[str, Any]
    ) -> SupportTicket:
        """Actualizar estado del ticket"""
        try:
            # Convertir metadata a JSON string
            metadata_json = json.dumps(metadata) if metadata else "{}"
            
            query = """
                UPDATE support_tickets 
                SET status = $1, metadata = $2
                WHERE id = $3
                RETURNING id, order_id, reason, amount, status, metadata, created_at
            """
            
            result = await db.execute_query(query, new_status, metadata_json, ticket_id)
            
            if not result:
                raise DatabaseError(f"Failed to update ticket {ticket_id}")
                
            row = result[0]
            return SupportTicket(
                id=row["id"],
                order_id=row["order_id"],
                reason=row["reason"],
                amount=float(row["amount"]),
                status=row["status"],
                metadata=(
                    row["metadata"]
                    if isinstance(row["metadata"], dict)
                    else json.loads(row["metadata"])
                ),
                created_at=row["created_at"],
            )

        except Exception as e:
            if isinstance(e, DatabaseError):
                raise
            raise DatabaseError(f"Error updating ticket {ticket_id}: {str(e)}")


# Instancia global
support_repository = SupportRepository()