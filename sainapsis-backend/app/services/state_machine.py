
from typing import Dict, Tuple, List
from app.models.domain import OrderState, EventType
from app.core.exceptions import InvalidTransition


class StateMachine:
    """Máquina de estados para órdenes"""

    # Matriz de transiciones: (estado_actual, evento) -> nuevo_estado
    TRANSITIONS: Dict[Tuple[OrderState, EventType], OrderState] = {
        # Desde PENDING
        (
            OrderState.PENDING,
            EventType.PENDING_BIOMETRICAL_VERIFICATION,
        ): OrderState.ON_HOLD,
        (
            OrderState.PENDING,
            EventType.NO_VERIFICATION_NEEDED,
        ): OrderState.PENDING_PAYMENT,
        (OrderState.PENDING, EventType.PAYMENT_FAILED): OrderState.CANCELLED,
        (OrderState.PENDING, EventType.ORDER_CANCELLED): OrderState.CANCELLED,
        # Desde ON_HOLD
        (
            OrderState.ON_HOLD,
            EventType.BIOMETRICAL_VERIFICATION_SUCCESSFUL,
        ): OrderState.PENDING_PAYMENT,
        (OrderState.ON_HOLD, EventType.VERIFICATION_FAILED): OrderState.CANCELLED,
        (OrderState.ON_HOLD, EventType.ORDER_CANCELLED_BY_USER): OrderState.CANCELLED,
        # Desde PENDING_PAYMENT
        (
            OrderState.PENDING_PAYMENT,
            EventType.PAYMENT_SUCCESSFUL,
        ): OrderState.CONFIRMED,
        (
            OrderState.PENDING_PAYMENT,
            EventType.ORDER_CANCELLED_BY_USER,
        ): OrderState.CANCELLED,
        # Desde CONFIRMED
        (OrderState.CONFIRMED, EventType.PREPARING_SHIPMENT): OrderState.PROCESSING,
        (OrderState.CONFIRMED, EventType.ORDER_CANCELLED_BY_USER): OrderState.CANCELLED,
        # Desde PROCESSING
        (OrderState.PROCESSING, EventType.ITEM_DISPATCHED): OrderState.SHIPPED,
        (
            OrderState.PROCESSING,
            EventType.ORDER_CANCELLED_BY_USER,
        ): OrderState.CANCELLED,
        # Desde SHIPPED
        (OrderState.SHIPPED, EventType.ITEM_RECEIVED_BY_CUSTOMER): OrderState.DELIVERED,
        (OrderState.SHIPPED, EventType.DELIVERY_ISSUE): OrderState.ON_HOLD,
        (OrderState.SHIPPED, EventType.ORDER_CANCELLED_BY_USER): OrderState.CANCELLED,
        # Desde DELIVERED
        (
            OrderState.DELIVERED,
            EventType.RETURN_INITIATED_BY_CUSTOMER,
        ): OrderState.RETURNING,
        # Desde RETURNING
        (OrderState.RETURNING, EventType.ITEM_RECEIVED_BACK): OrderState.RETURNED,
        # Desde RETURNED
        (OrderState.RETURNED, EventType.REFUND_PROCESSED): OrderState.REFUNDED,
    }

    # Estados desde los cuales NO se puede cancelar
    NON_CANCELLABLE_STATES = {
        OrderState.DELIVERED,
        OrderState.RETURNED,
        OrderState.REFUNDED,
        OrderState.CANCELLED,
    }

    @classmethod
    def get_next_state(cls, current_state: OrderState, event: EventType) -> OrderState:
        """Obtener siguiente estado"""
        # Verificar transición específica
        transition_key = (current_state, event)
        if transition_key in cls.TRANSITIONS:
            return cls.TRANSITIONS[transition_key]

        # Regla especial: cancelación por usuario
        if (
            event == EventType.ORDER_CANCELLED_BY_USER
            and current_state not in cls.NON_CANCELLABLE_STATES
        ):
            return OrderState.CANCELLED

        # Si no hay transición válida
        raise InvalidTransition(current_state.value, event.value)

    @classmethod
    def get_allowed_events(cls, current_state: OrderState) -> List[EventType]:
        """Obtener eventos permitidos para un estado"""
        allowed_events = []

        # Buscar eventos específicos
        for (state, event), _ in cls.TRANSITIONS.items():
            if state == current_state:
                allowed_events.append(event)

        # Agregar cancelación por usuario si es permitida
        if current_state not in cls.NON_CANCELLABLE_STATES:
            allowed_events.append(EventType.ORDER_CANCELLED_BY_USER)

        return list(set(allowed_events))

    @classmethod
    def is_final_state(cls, state: OrderState) -> bool:
        """Verificar si un estado es final"""
        final_states = {OrderState.DELIVERED, OrderState.REFUNDED, OrderState.CANCELLED}
        return state in final_states
