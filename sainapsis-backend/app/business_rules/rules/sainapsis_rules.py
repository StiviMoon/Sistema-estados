# app/business_rules/rules/sainapsis_rules.py

"""
Reglas de negocio específicas para el sistema Sainapsis.
"""

from typing import List
from app.business_rules.base import (
    EventFilterRule, 
    BusinessLogicRule,
    EnrichmentRule,
    RuleContext, 
    RuleResult, 
    RulePriority
)
from app.models.domain import EventType, OrderState


# =============================================================================
# REGLA PRINCIPAL: Órdenes ≤ $20 no requieren verificación
# =============================================================================

class SainapsisSmallOrderRule(EventFilterRule):
    """
    🎯 ESTA ES LA REGLA QUE RESUELVE TU PROBLEMA ESPECÍFICO
    Órdenes de $20 o menos no requieren verificación biométrica
    """
    
    def __init__(self, threshold: float = 20.0):
        super().__init__(
            rule_id="sainapsis_small_order_no_verification",
            description=f"Orders ${threshold} or less do not require biometric verification",
            priority=RulePriority.HIGH
        )
        self.threshold = threshold
    
    def applies_to(self, context: RuleContext) -> bool:
        """Solo aplica a órdenes PENDING con monto pequeño"""
        return (
            context.order.state == OrderState.PENDING and 
            context.order.amount <= self.threshold
        )
    
    def filter_events(self, available_events: List[EventType], context: RuleContext) -> List[EventType]:
        """
        AQUÍ ES DONDE SE REMUEVE LA VERIFICACIÓN PARA ÓRDENES PEQUEÑAS
        """
        # Remover la opción de verificación biométrica
        filtered = [
            event for event in available_events 
            if event != EventType.PENDING_BIOMETRICAL_VERIFICATION
        ]
        
        # Log para debugging
        if EventType.PENDING_BIOMETRICAL_VERIFICATION in available_events:
            was_removed = EventType.PENDING_BIOMETRICAL_VERIFICATION not in filtered
            print(f"🔍 Small order rule: ${context.order.amount} - Verification {'removed' if was_removed else 'kept'}")
        
        return filtered


# =============================================================================
# REGLAS DE VALOR ALTO (integrando tu lógica existente)
# =============================================================================

class SainapsisHighValuePaymentFailedRule(BusinessLogicRule):
    """
    Integra tu regla existente: Órdenes > $1000 con pago fallido crean ticket
    """
    
    def __init__(self):
        super().__init__(
            rule_id="sainapsis_high_value_payment_failed",
            description="Create support ticket for high-value payment failures",
            priority=RulePriority.MEDIUM
        )
    
    def applies_to(self, context: RuleContext) -> bool:
        return (
            context.event_type == EventType.PAYMENT_FAILED and
            context.order.amount > 1000.0
        )
    
    def execute(self, context: RuleContext) -> RuleResult:
        priority = "high" if context.order.amount > 2000 else "medium"
        
        ticket_data = {
            "reason": f"High amount payment failure: ${context.order.amount}",
            "amount": context.order.amount,
            "metadata": {
                "event_type": context.event_type.value,
                "auto_created": True,
                "created_by": "sainapsis_business_rules",
                "priority": priority,
                "rule_id": self.rule_id
            }
        }
        
        return RuleResult(
            success=True,
            actions=[f"Created support ticket for payment failure: ${context.order.amount}"],
            support_tickets=[ticket_data]
        )


class SainapsisUltraHighValueReviewRule(BusinessLogicRule):
    """
    Integra tu regla existente: Órdenes > $5000 requieren revisión manual
    """
    
    def __init__(self):
        super().__init__(
            rule_id="sainapsis_ultra_high_value_review",
            description="Orders over $5000 require manual review after payment",
            priority=RulePriority.HIGH
        )
    
    def applies_to(self, context: RuleContext) -> bool:
        return (
            context.event_type == EventType.PAYMENT_SUCCESSFUL and
            context.order.amount > 5000.0
        )
    
    def execute(self, context: RuleContext) -> RuleResult:
        requires_manager = context.order.amount > 10000
        
        ticket_data = {
            "reason": f"High value order requires manual review: ${context.order.amount}",
            "amount": context.order.amount,
            "metadata": {
                "event_type": "manual_review_required",
                "priority": "urgent",
                "auto_created": True,
                "review_type": "high_value_order",
                "requires_manager_approval": requires_manager,
                "rule_id": self.rule_id
            }
        }
        
        return RuleResult(
            success=True,
            actions=[f"Created review ticket for ultra-high-value order: ${context.order.amount}"],
            support_tickets=[ticket_data],
            metadata_updates={
                "requires_manual_review": True,
                "review_reason": "high_value_order",
                "review_threshold": 5000
            }
        )


# =============================================================================
# REGLAS DE PAÍS
# =============================================================================

class SainapsisCountryTaxRule(EnrichmentRule):
    """
    Aplica impuestos automáticamente según el país
    """
    
    # Configuración de impuestos por país
    TAX_RATES = {
        "US": {"rate": 0.08, "name": "Sales Tax"},
        "CA": {"rate": 0.13, "name": "HST"},
        "MX": {"rate": 0.16, "name": "IVA"},
        "ES": {"rate": 0.21, "name": "IVA"},
        "FR": {"rate": 0.20, "name": "TVA"},
        "DE": {"rate": 0.19, "name": "MwSt"},
        "BR": {"rate": 0.17, "name": "ICMS"},
        "AR": {"rate": 0.21, "name": "IVA"},
        "CO": {"rate": 0.19, "name": "IVA"},
    }
    
    def __init__(self):
        super().__init__(
            rule_id="sainapsis_country_tax_calculation",
            description="Apply country-specific tax rates to orders",
            priority=RulePriority.LOW
        )
    
    def applies_to(self, context: RuleContext) -> bool:
        country_code = context.get_country_code()
        return country_code is not None and country_code in self.TAX_RATES
    
    def execute(self, context: RuleContext) -> RuleResult:
        country_code = context.get_country_code()
        tax_config = self.TAX_RATES[country_code]
        
        base_amount = context.order.amount
        tax_amount = base_amount * tax_config["rate"]
        total_amount = base_amount + tax_amount
        
        metadata_updates = {
            "country_code": country_code,
            "tax_rate": tax_config["rate"],
            "tax_name": tax_config["name"],
            "tax_amount": round(tax_amount, 2),
            "base_amount": base_amount,
            "total_amount_with_tax": round(total_amount, 2),
            "tax_applied_by_rule": self.rule_id
        }
        
        return RuleResult(
            success=True,
            actions=[f"Applied {tax_config['name']} ({tax_config['rate']*100:.1f}%) for {country_code}"],
            metadata_updates=metadata_updates
        )


class SainapsisHighRiskCountryRule(EventFilterRule):
    """
    Países de alto riesgo requieren verificación adicional
    """
    
    HIGH_RISK_COUNTRIES = {"VE", "AF", "IQ", "SY", "KP"}  # Ejemplo
    
    def __init__(self):
        super().__init__(
            rule_id="sainapsis_high_risk_country_verification",
            description="High-risk countries require additional verification",
            priority=RulePriority.HIGH
        )
    
    def applies_to(self, context: RuleContext) -> bool:
        country_code = context.get_country_code()
        return (
            country_code in self.HIGH_RISK_COUNTRIES and
            context.order.state == OrderState.PENDING
        )
    
    def filter_events(self, available_events: List[EventType], context: RuleContext) -> List[EventType]:
        """
        Para países de alto riesgo, siempre requerir verificación
        (anula la regla de monto pequeño)
        """
        # Asegurar que la verificación esté disponible
        if EventType.PENDING_BIOMETRICAL_VERIFICATION not in available_events:
            available_events.append(EventType.PENDING_BIOMETRICAL_VERIFICATION)
        
        # Remover la opción de NO verificación para estos países
        filtered = [
            event for event in available_events 
            if event != EventType.NO_VERIFICATION_NEEDED
        ]
        
        country_code = context.get_country_code()
        print(f"🚨 High-risk country {country_code}: Verification required regardless of amount")
        
        return filtered


# =============================================================================
# REGLAS DE INTEGRACIÓN CON REVIEWING STATE
# =============================================================================

class SainapsisReviewingStateRule(BusinessLogicRule):
    """
    Integra con tu sistema de reviewing existente
    """
    
    def __init__(self):
        super().__init__(
            rule_id="sainapsis_reviewing_state_integration",
            description="Handle orders that enter reviewing state",
            priority=RulePriority.MEDIUM
        )
    
    def applies_to(self, context: RuleContext) -> bool:
        return (
            context.event_type == EventType.MANUAL_REVIEW_REQUIRED or
            context.order.state == OrderState.REVIEWING
        )
    
    def execute(self, context: RuleContext) -> RuleResult:
        actions = []
        metadata_updates = {}
        
        if context.event_type == EventType.MANUAL_REVIEW_REQUIRED:
            actions.append("Order flagged for manual review")
            metadata_updates.update({
                "requires_manual_review": True,
                "review_requested_at": context.order.updated_at.isoformat(),
                "review_reason": context.metadata.get("review_reason", "Manual review required")
            })
        
        if context.order.state == OrderState.REVIEWING:
            actions.append("Order is in reviewing state")
            metadata_updates.update({
                "in_review_state": True,
                "available_review_actions": ["approve", "reject"]
            })
        
        return RuleResult(
            success=True,
            actions=actions,
            metadata_updates=metadata_updates
        )


# =============================================================================
# REGLA DE HORARIOS (ejemplo de extensibilidad)
# =============================================================================

class SainapsisWeekendOrderRule(EventFilterRule):
    """
    Ejemplo: Los fines de semana solo se permiten órdenes pequeñas
    """
    
    def __init__(self, weekend_threshold: float = 500.0):
        super().__init__(
            rule_id="sainapsis_weekend_order_restriction",
            description=f"Restrict orders over ${weekend_threshold} on weekends",
            priority=RulePriority.MEDIUM
        )
        self.weekend_threshold = weekend_threshold
        self.enabled = False  # Deshabilitada por defecto
    
    def applies_to(self, context: RuleContext) -> bool:
        from datetime import datetime
        now = datetime.utcnow()
        is_weekend = now.weekday() >= 5  # Sábado=5, Domingo=6
        is_large_order = context.order.amount > self.weekend_threshold
        
        return is_weekend and is_large_order and context.order.state == OrderState.PENDING
    
    def filter_events(self, available_events: List[EventType], context: RuleContext) -> List[EventType]:
        # Solo permitir cancelación los fines de semana para órdenes grandes
        return [EventType.ORDER_CANCELLED_BY_USER]