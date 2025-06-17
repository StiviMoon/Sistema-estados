# app/services/support_service.py
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime

from app.models.domain import SupportTicket
from app.repositories.support_repository import support_repository
from app.core.exceptions import TicketNotFound


class SupportService:
    """Servicio para gestión de tickets de soporte"""

    def __init__(self):
        self.repository = support_repository

    async def get_all_tickets(self) -> List[SupportTicket]:
        """Obtener todos los tickets"""
        return await self.repository.get_all_tickets()

    async def get_ticket_by_id(self, ticket_id: UUID) -> SupportTicket:
        """Obtener ticket por ID"""
        ticket = await self.repository.get_ticket_by_id(ticket_id)
        if not ticket:
            raise TicketNotFound(str(ticket_id))
        return ticket

    async def get_tickets_by_order_id(self, order_id: UUID) -> List[SupportTicket]:
        """Obtener tickets asociados a una orden"""
        return await self.repository.get_tickets_by_order_id(order_id)

    async def update_ticket_status(
        self, 
        ticket_id: UUID, 
        new_status: str, 
        metadata: Optional[Dict[str, Any]] = None
    ) -> SupportTicket:
        """Actualizar estado del ticket"""
        # Verificar que el ticket existe
        ticket = await self.repository.get_ticket_by_id(ticket_id)
        if not ticket:
            raise TicketNotFound(str(ticket_id))

        # Preparar metadata actualizada
        updated_metadata = ticket.metadata.copy()
        if metadata:
            updated_metadata.update(metadata)
        
        updated_metadata["status_updated_at"] = datetime.utcnow().isoformat()
        updated_metadata["previous_status"] = ticket.status

        # Actualizar en base de datos
        return await self.repository.update_ticket_status(
            ticket_id, 
            new_status, 
            updated_metadata
        )

    async def get_tickets_summary(self) -> Dict[str, Any]:
        """Obtener resumen estadístico de tickets"""
        try:
            from app.core.database import db
            
            # Query simple para estadísticas básicas
            query = """
                SELECT 
                    status,
                    COUNT(*) as count,
                    AVG(amount) as avg_amount
                FROM support_tickets 
                GROUP BY status
                ORDER BY count DESC
            """
            
            result = await db.execute_query(query)
            
            # Procesar resultados
            stats_by_status = {}
            total_tickets = 0
            
            for row in result:
                status = row["status"]
                count = row["count"]
                stats_by_status[status] = {
                    "count": count,
                    "avg_amount": float(row["avg_amount"]) if row["avg_amount"] else 0,
                }
                total_tickets += count

            return {
                "total_tickets": total_tickets,
                "by_status": stats_by_status,
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Error generating ticket summary: {e}")
            return {
                "total_tickets": 0,
                "by_status": {},
                "error": str(e),
                "generated_at": datetime.utcnow().isoformat()
            }


# Instancia global
support_service = SupportService()