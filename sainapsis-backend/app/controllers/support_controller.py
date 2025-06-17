# app/controllers/support_controller.py
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from uuid import UUID

from app.services.support_service import support_service
from app.models.schemas import SupportTicketResponse, UpdateTicketStatusRequest
from app.core.exceptions import TicketNotFound
from app.core.database import db

router = APIRouter(prefix="/support", tags=["Support Tickets"])


async def get_db():
    """Dependency para asegurar conexión a DB"""
    if not db.pool:
        await db.connect()
    return db


@router.get("/tickets", response_model=List[SupportTicketResponse])
async def get_all_tickets(db_conn=Depends(get_db)):
    """Obtener todos los tickets de soporte"""
    try:
        tickets = await support_service.get_all_tickets()
        return tickets
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tickets: {str(e)}")


@router.get("/tickets/{ticket_id}", response_model=SupportTicketResponse)
async def get_ticket(ticket_id: UUID, db_conn=Depends(get_db)):
    """Obtener ticket específico por ID"""
    try:
        ticket = await support_service.get_ticket_by_id(ticket_id)
        return ticket
    except TicketNotFound as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching ticket: {str(e)}")


@router.get("/orders/{order_id}/tickets", response_model=List[SupportTicketResponse])
async def get_tickets_by_order(order_id: UUID, db_conn=Depends(get_db)):
    """Obtener todos los tickets asociados a una orden"""
    try:
        tickets = await support_service.get_tickets_by_order_id(order_id)
        return tickets
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tickets for order: {str(e)}")


@router.patch("/tickets/{ticket_id}/status")
async def update_ticket_status(
    ticket_id: UUID, 
    request: UpdateTicketStatusRequest, 
    db_conn=Depends(get_db)
):
    """Actualizar estado del ticket (open/in_progress/resolved/closed)"""
    try:
        ticket = await support_service.update_ticket_status(
            ticket_id, 
            request.status, 
            request.metadata
        )
        return {
            "message": "Ticket status updated successfully",
            "ticket_id": ticket_id,
            "new_status": request.status,
            "updated_ticket": ticket
        }
    except TicketNotFound as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating ticket: {str(e)}")


@router.get("/tickets/stats/summary")
async def get_tickets_summary(db_conn=Depends(get_db)):
    """Obtener resumen estadístico de tickets"""
    try:
        stats = await support_service.get_tickets_summary()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching ticket stats: {str(e)}")


# Endpoint simple para testing
@router.get("/test")
async def test_support_endpoints():
    """Endpoint de prueba para verificar que funciona"""
    return {
        "message": "Support endpoints are working!",
        "available_endpoints": [
            "GET /support/tickets",
            "GET /support/tickets/{ticket_id}",
            "GET /support/orders/{order_id}/tickets",
            "PATCH /support/tickets/{ticket_id}/status",
            "GET /support/tickets/stats/summary"
        ]
    }