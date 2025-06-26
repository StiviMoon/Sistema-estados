# app/business_rules/base.py

"""
Clases base para el sistema de reglas de negocio de Sainapsis.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from enum import Enum
from dataclasses import dataclass
from uuid import UUID

from app.models.domain import Order, EventType


class RuleType(Enum):
    """Tipos de reglas disponibles"""
    EVENT_FILTER = "event_filter"      # Filtran eventos disponibles
    BUSINESS_LOGIC = "business_logic"  # Aplican lógica de negocio
    VALIDATION = "validation"          # Validan condiciones
    ENRICHMENT = "enrichment"          # Enriquecen datos


class RulePriority(Enum):
    """Prioridades de ejecución"""
    CRITICAL = 1    # Se ejecutan primero
    HIGH = 2        # Alta prioridad
    MEDIUM = 3      # Prioridad media
    LOW = 4         # Baja prioridad


@dataclass
class RuleContext:
    """Contexto que se pasa a las reglas"""
    order: Order
    event_type: Optional[EventType] = None
    metadata: Optional[Dict[str, Any]] = None
    user_context: Optional[Dict[str, Any]] = None
    
    def get_order_amount(self) -> float:
        return self.order.amount
    
    def get_country_code(self) -> Optional[str]:
        """Obtener código de país del contexto"""
        if self.user_context and "country_code" in self.user_context:
            return self.user_context["country_code"]
        if self.order.metadata and "country_code" in self.order.metadata:
            return self.order.metadata["country_code"]
        return None


@dataclass
class RuleResult:
    """Resultado de la ejecución de una regla"""
    success: bool
    actions: List[str] = None
    filtered_events: List[EventType] = None
    metadata_updates: Dict[str, Any] = None
    support_tickets: List[Dict[str, Any]] = None
    error_message: Optional[str] = None
    
    def __post_init__(self):
        if self.actions is None:
            self.actions = []
        if self.filtered_events is None:
            self.filtered_events = []
        if self.metadata_updates is None:
            self.metadata_updates = {}
        if self.support_tickets is None:
            self.support_tickets = []


class BaseBusinessRule(ABC):
    """Clase base para todas las reglas de negocio"""
    
    def __init__(self, rule_id: str, description: str, rule_type: RuleType, priority: RulePriority = RulePriority.MEDIUM):
        self.rule_id = rule_id
        self.description = description
        self.rule_type = rule_type
        self.priority = priority
        self.enabled = True
    
    @abstractmethod
    def applies_to(self, context: RuleContext) -> bool:
        """Determina si esta regla aplica al contexto dado"""
        pass
    
    @abstractmethod
    def execute(self, context: RuleContext) -> RuleResult:
        """Ejecuta la regla y retorna el resultado"""
        pass
    
    def is_enabled(self) -> bool:
        return self.enabled
    
    def disable(self):
        self.enabled = False
    
    def enable(self):
        self.enabled = True


class EventFilterRule(BaseBusinessRule):
    """Clase base para reglas que filtran eventos disponibles"""
    
    def __init__(self, rule_id: str, description: str, priority: RulePriority = RulePriority.HIGH):
        super().__init__(rule_id, description, RuleType.EVENT_FILTER, priority)
    
    @abstractmethod
    def filter_events(self, available_events: List[EventType], context: RuleContext) -> List[EventType]:
        """Filtra la lista de eventos disponibles"""
        pass
    
    def execute(self, context: RuleContext) -> RuleResult:
        return RuleResult(success=True)


class BusinessLogicRule(BaseBusinessRule):
    """Clase base para reglas de lógica de negocio"""
    
    def __init__(self, rule_id: str, description: str, priority: RulePriority = RulePriority.MEDIUM):
        super().__init__(rule_id, description, RuleType.BUSINESS_LOGIC, priority)


class ValidationRule(BaseBusinessRule):
    """Clase base para reglas de validación"""
    
    def __init__(self, rule_id: str, description: str, priority: RulePriority = RulePriority.CRITICAL):
        super().__init__(rule_id, description, RuleType.VALIDATION, priority)


class EnrichmentRule(BaseBusinessRule):
    """Clase base para reglas de enriquecimiento"""
    
    def __init__(self, rule_id: str, description: str, priority: RulePriority = RulePriority.LOW):
        super().__init__(rule_id, description, RuleType.ENRICHMENT, priority)


class BusinessRuleException(Exception):
    """Excepción para reglas de negocio"""
    
    def __init__(self, rule_id: str, message: str):
        self.rule_id = rule_id
        super().__init__(f"Business rule '{rule_id}' failed: {message}")