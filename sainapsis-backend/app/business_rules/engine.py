# app/business_rules/engine.py

"""
Motor de reglas de negocio que coordina la evaluación y ejecución.
CREAR ESTE ARCHIVO NUEVO - NO MODIFICAR ARCHIVOS EXISTENTES
"""

from typing import List, Dict, Any, Optional
from collections import defaultdict
import logging

from app.business_rules.base import (
    BaseBusinessRule, 
    RuleContext, 
    RuleResult, 
    RuleType, 
    RulePriority,
    EventFilterRule,
    BusinessRuleException
)
from app.models.domain import EventType

logger = logging.getLogger(__name__)


class BusinessRuleRegistry:
    """Registro centralizado de todas las reglas de negocio"""
    
    def __init__(self):
        self._rules: Dict[str, BaseBusinessRule] = {}
        self._rules_by_type: Dict[RuleType, List[BaseBusinessRule]] = defaultdict(list)
        self._rules_by_priority: Dict[RulePriority, List[BaseBusinessRule]] = defaultdict(list)
    
    def register(self, rule: BaseBusinessRule) -> None:
        """Registra una nueva regla"""
        if rule.rule_id in self._rules:
            print(f"⚠️ Rule {rule.rule_id} is being overwritten")
        
        self._rules[rule.rule_id] = rule
        self._rules_by_type[rule.rule_type].append(rule)
        self._rules_by_priority[rule.priority].append(rule)
        
        print(f"✅ Registered rule: {rule.rule_id} ({rule.rule_type.value})")
    
    def unregister(self, rule_id: str) -> bool:
        """Desregistra una regla"""
        if rule_id not in self._rules:
            return False
        
        rule = self._rules.pop(rule_id)
        self._rules_by_type[rule.rule_type].remove(rule)
        self._rules_by_priority[rule.priority].remove(rule)
        
        print(f"🗑️ Unregistered rule: {rule_id}")
        return True
    
    def get_rule(self, rule_id: str) -> Optional[BaseBusinessRule]:
        """Obtiene una regla por ID"""
        return self._rules.get(rule_id)
    
    def get_rules_by_type(self, rule_type: RuleType) -> List[BaseBusinessRule]:
        """Obtiene todas las reglas de un tipo específico"""
        return [rule for rule in self._rules_by_type[rule_type] if rule.is_enabled()]
    
    def get_all_rules(self) -> List[BaseBusinessRule]:
        """Obtiene todas las reglas habilitadas"""
        return [rule for rule in self._rules.values() if rule.is_enabled()]
    
    def get_applicable_rules(self, context: RuleContext, rule_type: Optional[RuleType] = None) -> List[BaseBusinessRule]:
        """Obtiene las reglas aplicables a un contexto específico"""
        rules = self.get_rules_by_type(rule_type) if rule_type else self.get_all_rules()
        return [rule for rule in rules if rule.applies_to(context)]
    
    def list_rules_info(self) -> List[Dict[str, Any]]:
        """Lista información de todas las reglas registradas"""
        return [
            {
                "rule_id": rule.rule_id,
                "description": rule.description,
                "type": rule.rule_type.value,
                "priority": rule.priority.value,
                "enabled": rule.is_enabled()
            }
            for rule in self._rules.values()
        ]


class BusinessRuleEvaluator:
    """Evaluador principal que ejecuta las reglas de negocio"""
    
    def __init__(self, registry: BusinessRuleRegistry):
        self.registry = registry
    
    def evaluate_all_rules(self, context: RuleContext) -> Dict[str, Any]:
        """Evalúa todas las reglas aplicables a un contexto"""
        results = {
            "success": True,
            "executed_rules": [],
            "failed_rules": [],
            "actions": [],
            "metadata_updates": {},
            "support_tickets": [],
            "filtered_events": None
        }
        
        # Obtener reglas aplicables ordenadas por prioridad
        applicable_rules = self._get_ordered_applicable_rules(context)
        
        for rule in applicable_rules:
            try:
                rule_result = rule.execute(context)
                
                if rule_result.success:
                    results["executed_rules"].append(rule.rule_id)
                    results["actions"].extend(rule_result.actions)
                    results["metadata_updates"].update(rule_result.metadata_updates)
                    results["support_tickets"].extend(rule_result.support_tickets)
                    
                    # Para reglas de filtro de eventos
                    if rule.rule_type == RuleType.EVENT_FILTER and rule_result.filtered_events:
                        results["filtered_events"] = rule_result.filtered_events
                
                else:
                    results["failed_rules"].append({
                        "rule_id": rule.rule_id,
                        "error": rule_result.error_message
                    })
                    
                    # Si es una regla crítica que falla, detener
                    if rule.priority == RulePriority.CRITICAL:
                        results["success"] = False
                        break
                        
            except Exception as e:
                print(f"❌ Error executing rule {rule.rule_id}: {str(e)}")
                results["failed_rules"].append({
                    "rule_id": rule.rule_id,
                    "error": str(e)
                })
                
                if rule.priority == RulePriority.CRITICAL:
                    results["success"] = False
                    break
        
        return results
    
    def filter_available_events(self, available_events: List[EventType], context: RuleContext) -> List[EventType]:
        """Filtra eventos disponibles usando reglas de filtro"""
        filtered_events = available_events.copy()
        
        # Obtener reglas de filtro aplicables
        filter_rules = self.registry.get_applicable_rules(context, RuleType.EVENT_FILTER)
        
        # Ordenar por prioridad
        filter_rules.sort(key=lambda r: r.priority.value)
        
        for rule in filter_rules:
            if isinstance(rule, EventFilterRule):
                try:
                    filtered_events = rule.filter_events(filtered_events, context)
                    print(f"🔧 Rule {rule.rule_id} applied - Events: {len(filtered_events)}")
                except Exception as e:
                    print(f"❌ Error in filter rule {rule.rule_id}: {str(e)}")
        
        return filtered_events
    
    def evaluate_business_logic(self, context: RuleContext) -> Dict[str, Any]:
        """Evalúa solo reglas de lógica de negocio"""
        business_rules = self.registry.get_applicable_rules(context, RuleType.BUSINESS_LOGIC)
        
        results = {
            "success": True,
            "executed_rules": [],
            "support_tickets": [],
            "metadata_updates": {},
            "actions": []
        }
        
        # Ordenar por prioridad
        business_rules.sort(key=lambda r: r.priority.value)
        
        for rule in business_rules:
            try:
                rule_result = rule.execute(context)
                
                if rule_result.success:
                    results["executed_rules"].append(rule.rule_id)
                    results["support_tickets"].extend(rule_result.support_tickets)
                    results["metadata_updates"].update(rule_result.metadata_updates)
                    results["actions"].extend(rule_result.actions)
                else:
                    print(f"⚠️ Business rule {rule.rule_id} failed: {rule_result.error_message}")
                    
            except Exception as e:
                print(f"❌ Error executing business rule {rule.rule_id}: {str(e)}")
        
        return results
    
    def validate_context(self, context: RuleContext) -> bool:
        """Valida un contexto usando reglas de validación"""
        validation_rules = self.registry.get_applicable_rules(context, RuleType.VALIDATION)
        
        for rule in validation_rules:
            try:
                result = rule.execute(context)
                if not result.success:
                    raise BusinessRuleException(rule.rule_id, result.error_message or "Validation failed")
            except BusinessRuleException:
                raise
            except Exception as e:
                raise BusinessRuleException(rule.rule_id, str(e))
        
        return True
    
    def enrich_order_data(self, context: RuleContext) -> Dict[str, Any]:
        """Enriquece datos de la orden usando reglas de enriquecimiento"""
        enrichment_rules = self.registry.get_applicable_rules(context, RuleType.ENRICHMENT)
        
        enriched_data = {}
        
        for rule in enrichment_rules:
            try:
                result = rule.execute(context)
                if result.success:
                    enriched_data.update(result.metadata_updates)
            except Exception as e:
                print(f"⚠️ Error in enrichment rule {rule.rule_id}: {str(e)}")
        
        return enriched_data
    
    def _get_ordered_applicable_rules(self, context: RuleContext) -> List[BaseBusinessRule]:
        """Obtiene reglas aplicables ordenadas por prioridad"""
        applicable_rules = self.registry.get_applicable_rules(context)
        return sorted(applicable_rules, key=lambda r: r.priority.value)


# Instancias globales
business_rule_registry = BusinessRuleRegistry()
business_rule_evaluator = BusinessRuleEvaluator(business_rule_registry)