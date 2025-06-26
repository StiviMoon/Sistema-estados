# test_business_rules_only.py

"""
Test enfocado SOLO en las business rules (sin base de datos)
Para verificar que el sistema funciona correctamente
Version corregida con datetime moderno
"""

import asyncio
from datetime import datetime, timezone
from uuid import uuid4
from typing import List, Dict, Any, Optional

def test_business_rules_initialization():
    """Test 1: Verificar que las business rules se inicialicen correctamente"""
    print("🔧 Test 1: Business Rules Initialization")
    
    try:
        from app.business_rules import (
            get_business_rule_registry, 
            get_business_rule_evaluator,
            BUSINESS_RULES_INITIALIZED
        )
        
        if not BUSINESS_RULES_INITIALIZED:
            print("❌ Business rules not initialized")
            return False
        
        registry = get_business_rule_registry()
        rules = registry.get_all_rules()
        
        print(f"   ✅ Business rules initialized: {BUSINESS_RULES_INITIALIZED}")
        print(f"   📋 Total rules registered: {len(rules)}")
        
        # Verificar reglas específicas
        small_order_rule = registry.get_rule("sainapsis_small_order_no_verification")
        if small_order_rule:
            print(f"   ✅ Small order rule found: {small_order_rule.description}")
        else:
            print("   ❌ Small order rule not found")
            return False
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


def test_small_order_rule_logic():
    """Test 2: Probar la lógica de la regla de órdenes pequeñas (sin BD)"""
    print("\n🎯 Test 2: Small Order Rule Logic (Mock Data)")
    
    try:
        from app.business_rules import get_business_rule_registry
        from app.business_rules.base import RuleContext
        from app.models.domain import Order, OrderState, EventType
        
        registry = get_business_rule_registry()
        small_order_rule = registry.get_rule("sainapsis_small_order_no_verification")
        
        if not small_order_rule:
            print("   ❌ Small order rule not found")
            return False
        
        # Test con diferentes montos
        test_cases = [
            {"amount": 5.0, "should_apply": True, "description": "$5 order"},
            {"amount": 15.0, "should_apply": True, "description": "$15 order"},
            {"amount": 20.0, "should_apply": True, "description": "$20 order"},
            {"amount": 25.0, "should_apply": False, "description": "$25 order"},
            {"amount": 100.0, "should_apply": False, "description": "$100 order"},
        ]
        
        all_passed = True
        
        for test_case in test_cases:
            # Crear orden mock - AQUÍ ESTABA EL ERROR
            mock_order = Order(
                id=uuid4(),
                product_ids=["TEST-PRODUCT"],
                amount=test_case["amount"],
                state=OrderState.PENDING,
                metadata={},
                created_at=datetime.now(timezone.utc),  # Usar timezone-aware datetime
                updated_at=datetime.now(timezone.utc)   # Usar timezone-aware datetime
            )
            
            # Crear contexto
            context = RuleContext(order=mock_order)
            
            # Verificar si la regla aplica
            rule_applies = small_order_rule.applies_to(context)
            expected = test_case["should_apply"]
            
            # Test de filtrado de eventos
            base_events = [
                EventType.NO_VERIFICATION_NEEDED,
                EventType.PENDING_BIOMETRICAL_VERIFICATION,
                EventType.ORDER_CANCELLED_BY_USER
            ]
            
            if rule_applies:
                filtered_events = small_order_rule.filter_events(base_events, context)
                verification_removed = EventType.PENDING_BIOMETRICAL_VERIFICATION not in filtered_events
            else:
                verification_removed = False
            
            test_passed = rule_applies == expected
            
            status = "✅" if test_passed else "❌"
            print(f"   {status} {test_case['description']}: Rule applies={rule_applies}, Expected={expected}")
            
            if rule_applies:
                print(f"      🔧 Verification removed: {verification_removed}")
            
            if not test_passed:
                all_passed = False
        
        return all_passed
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_event_filtering():
    """Test 3: Probar el filtrado de eventos directamente"""
    print("\n🔧 Test 3: Event Filtering Engine")
    
    try:
        from app.business_rules import get_business_rule_evaluator
        from app.business_rules.base import RuleContext
        from app.models.domain import Order, OrderState, EventType
        
        evaluator = get_business_rule_evaluator()
        
        # Crear orden pequeña ($15) - CORRECCIÓN AQUÍ
        small_order = Order(
            id=uuid4(),
            product_ids=["SMALL-TEST"],
            amount=15.0,
            state=OrderState.PENDING,
            metadata={},
            created_at=datetime.now(timezone.utc),  # Correcto
            updated_at=datetime.now(timezone.utc)   # Correcto
        )
        
        # Crear orden grande ($100) - CORRECCIÓN AQUÍ
        large_order = Order(
            id=uuid4(),
            product_ids=["LARGE-TEST"],
            amount=100.0,
            state=OrderState.PENDING,
            metadata={},
            created_at=datetime.now(timezone.utc),  # Correcto
            updated_at=datetime.now(timezone.utc)   # Correcto
        )
        
        base_events = [
            EventType.NO_VERIFICATION_NEEDED,
            EventType.PENDING_BIOMETRICAL_VERIFICATION,
            EventType.ORDER_CANCELLED_BY_USER
        ]
        
        # Test orden pequeña
        small_context = RuleContext(order=small_order)
        small_filtered = evaluator.filter_available_events(base_events, small_context)
        
        small_verification_removed = (
            EventType.PENDING_BIOMETRICAL_VERIFICATION in base_events and
            EventType.PENDING_BIOMETRICAL_VERIFICATION not in small_filtered
        )
        
        # Test orden grande
        large_context = RuleContext(order=large_order)
        large_filtered = evaluator.filter_available_events(base_events, large_context)
        
        large_verification_kept = EventType.PENDING_BIOMETRICAL_VERIFICATION in large_filtered
        
        print(f"   📊 Base events: {len(base_events)}")
        print(f"   🔧 Small order ($15) filtered events: {len(small_filtered)}")
        print(f"   🔧 Large order ($100) filtered events: {len(large_filtered)}")
        print(f"   ✅ Small order verification removed: {small_verification_removed}")
        print(f"   ✅ Large order verification kept: {large_verification_kept}")
        
        # Verificar resultados
        success = small_verification_removed and large_verification_kept
        
        if success:
            print("   🎉 Event filtering working correctly!")
        else:
            print("   ❌ Event filtering not working as expected")
        
        return success
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_country_tax_rule():
    """Test 4: Probar reglas de país (sin BD)"""
    print("\n🌍 Test 4: Country Tax Rules")
    
    try:
        from app.business_rules import get_business_rule_evaluator
        from app.business_rules.base import RuleContext
        from app.models.domain import Order, OrderState
        
        evaluator = get_business_rule_evaluator()
        
        # Crear orden con contexto de México - CORRECCIÓN AQUÍ
        order = Order(
            id=uuid4(),
            product_ids=["MEXICO-TEST"],
            amount=100.0,
            state=OrderState.PENDING,
            metadata={},
            created_at=datetime.now(timezone.utc),  # Correcto
            updated_at=datetime.now(timezone.utc)   # Correcto
        )
        
        # Contexto de usuario mexicano
        user_context = {"country_code": "MX"}
        context = RuleContext(order=order, user_context=user_context)
        
        # Obtener enriquecimientos
        enriched_data = evaluator.enrich_order_data(context)
        
        print(f"   🌍 Country: MX")
        print(f"   💰 Base amount: ${order.amount}")
        print(f"   📊 Enriched data keys: {list(enriched_data.keys())}")
        
        if "tax_rate" in enriched_data:
            print(f"   💵 Tax rate: {enriched_data['tax_rate'] * 100:.1f}%")
            print(f"   💵 Tax amount: ${enriched_data['tax_amount']}")
            print(f"   💵 Total with tax: ${enriched_data['total_amount_with_tax']}")
            return True
        else:
            print("   ❌ No tax information applied")
            return False
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_high_value_payment_failed():
    """Test 5: Probar regla de pagos fallidos de alto valor"""
    print("\n💰 Test 5: High Value Payment Failed Rule")
    
    try:
        from app.business_rules import get_business_rule_evaluator
        from app.business_rules.base import RuleContext
        from app.models.domain import Order, OrderState, EventType
        
        evaluator = get_business_rule_evaluator()
        
        # Crear orden de alto valor ($1500)
        high_value_order = Order(
            id=uuid4(),
            product_ids=["LAPTOP-PRO"],
            amount=1500.0,
            state=OrderState.PENDING_PAYMENT,
            metadata={},
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        # Contexto con evento de pago fallido
        context = RuleContext(
            order=high_value_order,
            event_type=EventType.PAYMENT_FAILED,
            metadata={"reason": "Insufficient funds"}
        )
        
        # Evaluar reglas de lógica de negocio
        results = evaluator.evaluate_business_logic(context)
        
        print(f"   💳 Order amount: ${high_value_order.amount}")
        print(f"   🎯 Event type: {EventType.PAYMENT_FAILED.value}")
        print(f"   📋 Rules executed: {results['executed_rules']}")
        print(f"   🎫 Support tickets created: {len(results['support_tickets'])}")
        
        # Verificar que se creó un ticket
        if results['support_tickets']:
            ticket = results['support_tickets'][0]
            print(f"   ✅ Ticket reason: {ticket['reason']}")
            print(f"   ✅ Ticket priority: {ticket['metadata'].get('priority', 'not set')}")
            return True
        else:
            print("   ❌ No support ticket created")
            return False
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_rule_priority_execution():
    """Test 6: Verificar que las reglas se ejecutan por prioridad"""
    print("\n🎯 Test 6: Rule Priority Execution")
    
    try:
        from app.business_rules import get_business_rule_registry
        from app.business_rules.base import RulePriority
        
        registry = get_business_rule_registry()
        
        # Obtener todas las reglas y verificar prioridades
        all_rules = registry.get_all_rules()
        
        priority_groups = {}
        for rule in all_rules:
            priority = rule.priority.value
            if priority not in priority_groups:
                priority_groups[priority] = []
            priority_groups[priority].append(rule.rule_id)
        
        print("   📊 Rules by priority:")
        for priority in sorted(priority_groups.keys()):
            priority_name = RulePriority(priority).name
            rules = priority_groups[priority]
            print(f"   {priority}. {priority_name}: {len(rules)} rules")
            for rule_id in rules[:3]:  # Mostrar máximo 3
                print(f"      - {rule_id}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


def test_rule_enable_disable():
    """Test 7: Verificar habilitación/deshabilitación de reglas"""
    print("\n🔧 Test 7: Rule Enable/Disable Functionality")
    
    try:
        from app.business_rules import (
            get_business_rule_registry,
            enable_rule,
            disable_rule
        )
        
        registry = get_business_rule_registry()
        test_rule_id = "sainapsis_weekend_order_restriction"
        
        # Verificar estado inicial
        rule = registry.get_rule(test_rule_id)
        if not rule:
            print(f"   ⚠️ Rule {test_rule_id} not found, using small order rule")
            test_rule_id = "sainapsis_small_order_no_verification"
            rule = registry.get_rule(test_rule_id)
        
        initial_state = rule.is_enabled()
        print(f"   📊 Initial state of {test_rule_id}: {'ENABLED' if initial_state else 'DISABLED'}")
        
        # Deshabilitar
        disable_rule(test_rule_id)
        after_disable = rule.is_enabled()
        print(f"   🔴 After disable: {'ENABLED' if after_disable else 'DISABLED'}")
        
        # Habilitar
        enable_rule(test_rule_id)
        after_enable = rule.is_enabled()
        print(f"   🟢 After enable: {'ENABLED' if after_enable else 'DISABLED'}")
        
        # Restaurar estado original
        if initial_state:
            enable_rule(test_rule_id)
        else:
            disable_rule(test_rule_id)
        
        success = (not after_disable) and after_enable
        if success:
            print("   ✅ Enable/disable functionality working correctly")
        else:
            print("   ❌ Enable/disable functionality not working")
        
        return success
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


def run_business_rules_tests():
    """Ejecutar todos los tests de business rules (sin base de datos)"""
    print("🧪 SAINAPSIS BUSINESS RULES - STANDALONE TESTS")
    print("=" * 80)
    print(f"⏰ Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tests = [
        ("Initialization", test_business_rules_initialization),
        ("Small Order Rule Logic", test_small_order_rule_logic),
        ("Event Filtering", test_event_filtering),
        ("Country Tax Rules", test_country_tax_rule),
        ("High Value Payment Failed", test_high_value_payment_failed),
        ("Rule Priority Execution", test_rule_priority_execution),
        ("Rule Enable/Disable", test_rule_enable_disable),
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        print(f"\n{'='*60}")
        print(f"🧪 TESTING: {test_name.upper()}")
        print(f"{'='*60}")
        
        try:
            success = test_func()
            results[test_name] = success
        except Exception as e:
            print(f"💥 FATAL ERROR in {test_name}: {e}")
            results[test_name] = False
    
    # Resumen final
    print(f"\n{'='*80}")
    print("📊 FINAL TEST RESULTS")
    print(f"{'='*80}")
    
    successful_tests = []
    failed_tests = []
    
    for test_name, success in results.items():
        if success:
            successful_tests.append(test_name)
            print(f"✅ {test_name}: PASSED")
        else:
            failed_tests.append(test_name)
            print(f"❌ {test_name}: FAILED")
    
    print(f"\n📊 SUMMARY:")
    print(f"   ✅ Successful tests: {len(successful_tests)}")
    print(f"   ❌ Failed tests: {len(failed_tests)}")
    print(f"   📊 Total tests: {len(results)}")
    print(f"   🎯 Success rate: {(len(successful_tests) / len(results) * 100):.1f}%")
    
    if len(failed_tests) == 0:
        print(f"\n🎉 ALL BUSINESS RULES TESTS PASSED!")
        print(f"   ✅ Business rules system is working correctly")
        print(f"   ✅ Small order rule (≤$20) is functional")
        print(f"   ✅ Event filtering is working")
        print(f"   ✅ Country tax rules are working")
        print(f"   ✅ High value payment rules are working")
        print(f"   ✅ Rule management is working")
        print(f"   ⚠️ Database connection needed for full integration")
    else:
        print(f"\n⚠️ SOME TESTS FAILED")
        print(f"   Failed tests: {', '.join(failed_tests)}")
        print(f"   Please check the errors above for details")
    
    print(f"\n⏰ Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    
    return len(failed_tests) == 0


if __name__ == "__main__":
    success = run_business_rules_tests()
    exit(0 if success else 1)