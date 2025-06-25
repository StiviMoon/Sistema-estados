# app/business_rules/adapters/order_adapter.py

"""
Adaptador que integra el motor de reglas de negocio con tu OrderService existente.
CREAR ESTE ARCHIVO NUEVO - NO MODIFICAR ARCHIVOS EXISTENTES
"""

from typing import List, Dict, Any, Optional
from uuid import UUID

from app.business_rules.base import RuleContext
from app.business_rules.engine import business_rule_evaluator
from app.models.domain import Order, EventType, OrderState
from app.services.order_service import order_service


class SainapsisOrderAdapter:
    """
    Adaptador que conecta las business rules con tu sistema existente
    sin modificar tu código actual
    """
    
    def __init__(self):
        self.rule_evaluator = business_rule_evaluator
        self.original_service = order_service
    
    async def get_filtered_allowed_events(
        self, 
        order_id: UUID, 
        user_context: Optional[Dict[str, Any]] = None
    ) -> List[EventType]:
        """
        🎯 FUNCIÓN PRINCIPAL que resuelve tu problema de los $20
        
        Obtiene eventos permitidos aplicando filtros de business rules
        sobre los eventos base de tu sistema existente
        """
        # 1. Obtener eventos base usando TU servicio original
        base_events = await self.original_service.get_allowed_events(order_id)
        
        # 2. Obtener orden para contexto
        order = await self.original_service.get_order(order_id)
        
        # 3. Crear contexto para reglas
        context = RuleContext(
            order=order,
            user_context=user_context or {}
        )
        
        # 4. Aplicar filtros de business rules
        filtered_events = self.rule_evaluator.filter_available_events(base_events, context)
        
        # 5. Log para debugging
        removed_events = [e for e in base_events if e not in filtered_events]
        if removed_events:
            print(f"🔧 Events removed by rules: {[e.value for e in removed_events]}")
        
        return filtered_events
    
    async def enrich_order_data(
        self, 
        order: Order, 
        user_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Enriquece datos de una orden usando business rules
        """
        context = RuleContext(
            order=order,
            user_context=user_context or {}
        )
        
        return self.rule_evaluator.enrich_order_data(context)
    
    async def validate_order_before_creation(
        self,
        product_ids: List[str],
        amount: float,
        metadata: Dict[str, Any],
        user_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Valida la creación de una orden usando business rules
        Retorna información sobre qué reglas se aplicarían
        """
        # Crear orden temporal para validación
        from datetime import datetime
        temp_order = Order(
            id=None,
            product_ids=product_ids,
            amount=amount,
            state=OrderState.PENDING,
            metadata=metadata,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        context = RuleContext(
            order=temp_order,
            user_context=user_context or {}
        )
        
        # Validar con reglas
        try:
            self.rule_evaluator.validate_context(context)
            validation_passed = True
            validation_error = None
        except Exception as e:
            validation_passed = False
            validation_error = str(e)
        
        # Obtener enriquecimientos que se aplicarían
        enrichments = self.rule_evaluator.enrich_order_data(context)
        
        # Simular qué reglas de negocio se ejecutarían
        business_simulation = self.rule_evaluator.evaluate_business_logic(context)
        
        return {
            "validation_passed": validation_passed,
            "validation_error": validation_error,
            "enrichments": enrichments,
            "business_rules_preview": business_simulation,
            "would_create_tickets": len(business_simulation.get("support_tickets", [])),
            "preview_actions": business_simulation.get("actions", [])
        }
    
    async def process_event_with_business_rules(
        self,
        order_id: UUID,
        event_type: EventType,
        metadata: Optional[Dict[str, Any]] = None,
        user_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Procesa un evento aplicando business rules ANTES del procesamiento
        """
        # 1. Obtener orden actual
        order = await self.original_service.get_order(order_id)
        
        # 2. Crear contexto para reglas PRE-procesamiento
        context = RuleContext(
            order=order,
            event_type=event_type,
            metadata=metadata,
            user_context=user_context
        )
        
        # 3. Evaluar reglas de negocio ANTES del procesamiento
        business_results = self.rule_evaluator.evaluate_business_logic(context)
        
        # 4. Procesar evento usando TU servicio original
        updated_order = await self.original_service.process_event(
            order_id=order_id,
            event_type=event_type,
            metadata=metadata
        )
        
        # 5. Crear tickets de soporte según las reglas
        tickets_created = []
        for ticket_data in business_results.get("support_tickets", []):
            try:
                from app.repositories.support_repository import support_repository
                ticket = await support_repository.create_support_ticket(
                    order_id=order.id,
                    reason=ticket_data["reason"],
                    amount=ticket_data["amount"],
                    metadata=ticket_data["metadata"]
                )
                tickets_created.append(ticket.id)
                print(f"🎫 Support ticket created by business rule: {ticket.id}")
            except Exception as e:
                print(f"❌ Failed to create support ticket: {e}")
        
        # 6. Obtener contexto POST-procesamiento
        post_context = RuleContext(
            order=updated_order,
            user_context=user_context
        )
        
        # 7. Obtener eventos permitidos filtrados
        filtered_events = await self.get_filtered_allowed_events(order_id, user_context)
        
        # 8. Enriquecer datos
        enriched_data = self.rule_evaluator.enrich_order_data(post_context)
        
        return {
            "updated_order": updated_order,
            "business_rules_applied": business_results.get("executed_rules", []),
            "actions_executed": business_results.get("actions", []),
            "tickets_created": tickets_created,
            "filtered_events": filtered_events,
            "enriched_data": enriched_data
        }
    
    async def get_order_with_business_context(
        self,
        order_id: UUID,
        user_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Obtiene una orden enriquecida con todo el contexto de business rules
        """
        # 1. Obtener orden usando TU servicio original
        order = await self.original_service.get_order(order_id)
        
        # 2. Obtener eventos filtrados
        filtered_events = await self.get_filtered_allowed_events(order_id, user_context)
        
        # 3. Enriquecer datos
        enriched_data = await self.enrich_order_data(order, user_context)
        
        # 4. Crear contexto para obtener reglas aplicables
        context = RuleContext(
            order=order,
            user_context=user_context or {}
        )
        
        applicable_rules = self.rule_evaluator.registry.get_applicable_rules(context)
        
        return {
            "order": {
                "id": str(order.id),
                "product_ids": order.product_ids,
                "amount": order.amount,
                "state": order.state.value,
                "metadata": order.metadata,
                "created_at": order.created_at.isoformat(),
                "updated_at": order.updated_at.isoformat()
            },
            "allowed_events": [event.value for event in filtered_events],
            "business_context": enriched_data,
            "applied_rules": [rule.rule_id for rule in applicable_rules],
            "requires_manual_review": enriched_data.get("requires_manual_review", False),
            "flagged_for_review": enriched_data.get("flagged_for_review", False),
            "rule_summary": {
                "total_applicable_rules": len(applicable_rules),
                "events_filtered": len(await self.original_service.get_allowed_events(order_id)) - len(filtered_events),
                "enrichments_applied": len(enriched_data)
            }
        }
    
    async def simulate_rules_for_order(
        self,
        order_id: UUID,
        user_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Simula la aplicación de reglas sin ejecutarlas realmente
        Útil para testing y preview
        """
        order = await self.original_service.get_order(order_id)
        
        context = RuleContext(
            order=order,
            user_context=user_context or {}
        )
        
        # Simular evaluación completa
        simulation_results = self.rule_evaluator.evaluate_all_rules(context)
        
        # Obtener información de reglas aplicables
        applicable_rules = self.rule_evaluator.registry.get_applicable_rules(context)
        
        return {
            "order_id": str(order_id),
            "order_amount": order.amount,
            "order_state": order.state.value,
            "simulation_results": simulation_results,
            "applicable_rules": [
                {
                    "rule_id": rule.rule_id,
                    "description": rule.description,
                    "type": rule.rule_type.value,
                    "priority": rule.priority.value
                }
                for rule in applicable_rules
            ],
            "would_create_tickets": len(simulation_results.get("support_tickets", [])),
            "would_update_metadata": simulation_results.get("metadata_updates", {}),
            "would_execute_actions": simulation_results.get("actions", [])
        }


# Instancia global del adaptador
sainapsis_order_adapter = SainapsisOrderAdapter()