# app/business_rules/__init__.py


from app.business_rules.engine import business_rule_registry, business_rule_evaluator
from app.business_rules.adapters.order_adapter import sainapsis_order_adapter

# Importar todas las reglas específicas de Sainapsis
from app.business_rules.rules.sainapsis_rules import (
    SainapsisSmallOrderRule,
    SainapsisHighValuePaymentFailedRule,
    SainapsisUltraHighValueReviewRule,
    SainapsisCountryTaxRule,
    SainapsisHighRiskCountryRule,
    SainapsisReviewingStateRule,
    SainapsisWeekendOrderRule
)


def initialize_sainapsis_business_rules():
    """
    Inicializa y registra todas las reglas de negocio de Sainapsis
    """
    print("🔧 Initializing Sainapsis Business Rules System...")
    
    # ========================================================================
    # REGLA PRINCIPAL: Órdenes ≤ $20 no requieren verificación
    # ========================================================================
    business_rule_registry.register(SainapsisSmallOrderRule(threshold=20.0))
    
    # ========================================================================
    # REGLAS DE VALOR ALTO (integrando tu lógica existente)
    # ========================================================================
    business_rule_registry.register(SainapsisHighValuePaymentFailedRule())
    business_rule_registry.register(SainapsisUltraHighValueReviewRule())
    
    # ========================================================================
    # REGLAS DE PAÍS
    # ========================================================================
    business_rule_registry.register(SainapsisCountryTaxRule())
    business_rule_registry.register(SainapsisHighRiskCountryRule())
    
    # ========================================================================
    # REGLAS DE INTEGRACIÓN CON SISTEMA EXISTENTE
    # ========================================================================
    business_rule_registry.register(SainapsisReviewingStateRule())
    
    # ========================================================================
    # REGLAS OPCIONALES (deshabilitadas por defecto)
    # ========================================================================
    weekend_rule = SainapsisWeekendOrderRule()
    weekend_rule.disable()  # Deshabilitar por defecto
    business_rule_registry.register(weekend_rule)
    
    # ========================================================================
    # RESUMEN DE INICIALIZACIÓN
    # ========================================================================
    registered_rules = business_rule_registry.get_all_rules()
    print(f"✅ Successfully registered {len(registered_rules)} business rules")
    
    # Log detallado de reglas registradas
    print("📋 Registered Rules:")
    for rule in registered_rules:
        status = "🟢 ENABLED" if rule.is_enabled() else "🔴 DISABLED"
        print(f"   {status} {rule.rule_id}: {rule.description}")
    
    # Estadísticas por tipo
    from collections import defaultdict
    stats = defaultdict(int)
    for rule in registered_rules:
        stats[rule.rule_type.value] += 1
    
    print(f"📊 Rules by type: {dict(stats)}")
    
    return len(registered_rules)


def get_business_rule_registry():
    """Obtiene el registro de reglas de negocio"""
    return business_rule_registry


def get_business_rule_evaluator():
    """Obtiene el evaluador de reglas de negocio"""
    return business_rule_evaluator


def get_sainapsis_order_adapter():
    """Obtiene el adaptador para el sistema de órdenes de Sainapsis"""
    return sainapsis_order_adapter


def get_rule_info():
    """Obtiene información de todas las reglas registradas"""
    return business_rule_registry.list_rules_info()


def enable_rule(rule_id: str) -> bool:
    """Habilita una regla específica"""
    rule = business_rule_registry.get_rule(rule_id)
    if rule:
        rule.enable()
        print(f"✅ Rule {rule_id} enabled")
        return True
    else:
        print(f"❌ Rule {rule_id} not found")
        return False


def disable_rule(rule_id: str) -> bool:
    """Deshabilita una regla específica"""
    rule = business_rule_registry.get_rule(rule_id)
    if rule:
        rule.disable()
        print(f"🔴 Rule {rule_id} disabled")
        return True
    else:
        print(f"❌ Rule {rule_id} not found")
        return False


def change_small_order_threshold(new_threshold: float) -> bool:
    """
    Cambia el threshold de la regla de órdenes pequeñas
    Útil para ajustar el límite de $20 a otro valor
    """
    rule = business_rule_registry.get_rule("sainapsis_small_order_no_verification")
    if rule and hasattr(rule, 'threshold'):
        old_threshold = rule.threshold
        rule.threshold = new_threshold
        print(f"🔧 Small order threshold changed from ${old_threshold} to ${new_threshold}")
        return True
    else:
        print("❌ Small order rule not found")
        return False


# ============================================================================
# AUTO-INICIALIZACIÓN
# ============================================================================

# Inicializar automáticamente cuando se importa el módulo
try:
    initialize_sainapsis_business_rules()
    BUSINESS_RULES_INITIALIZED = True
    print("🚀 Sainapsis Business Rules System ready!")
except Exception as e:
    print(f"❌ Failed to initialize business rules: {str(e)}")
    BUSINESS_RULES_INITIALIZED = False


# ============================================================================
# EXPORTACIONES
# ============================================================================

__all__ = [
    # Instancias principales
    'business_rule_registry',
    'business_rule_evaluator', 
    'sainapsis_order_adapter',
    
    # Funciones de acceso
    'get_business_rule_registry',
    'get_business_rule_evaluator',
    'get_sainapsis_order_adapter',
    
    # Funciones de utilidad
    'get_rule_info',
    'enable_rule',
    'disable_rule',
    'change_small_order_threshold',
    
    # Estado del sistema
    'BUSINESS_RULES_INITIALIZED'
]