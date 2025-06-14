class OrderException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class OrderNotFound(OrderException):
    def __init__(self, order_id: str):
        super().__init__(f"Order {order_id} not found", 404)


class InvalidTransition(OrderException):
    def __init__(self, current_state: str, event: str):
        super().__init__(
            f"Cannot transition from {current_state} with event {event}", 400
        )


class InvalidOrderData(OrderException):
    def __init__(self, message: str):
        super().__init__(message, 400)


class DatabaseError(OrderException):
    def __init__(self, message: str):
        super().__init__(f"Database error: {message}", 500)
