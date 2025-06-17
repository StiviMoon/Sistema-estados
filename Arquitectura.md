# 🏗️ Diagrama Completo del Sistema Sainapsis

## 📊 Arquitectura General del Sistema

```mermaid
graph TB
    %% === FRONTEND LAYER ===
    subgraph "🖥️ FRONTEND - Next.js 15"
        A1[👤 User Interface]
        A2[📱 React Components]
        A3[🎨 shadcn/ui + Tailwind]
        A4[📡 Axios HTTP Client]
        A5[🎣 Custom Hooks]
        A6[📝 TypeScript Types]
        
        A1 --> A2
        A2 --> A3
        A2 --> A5
        A5 --> A4
        A4 --> A6
    end
    
    %% === API LAYER ===
    subgraph "🚀 BACKEND - FastAPI"
        subgraph "🎮 CONTROLLERS"
            B1[📦 Order Controller]
            B2[🎫 Support Controller]
            B3[❤️ Health Controller]
        end
        
        subgraph "🔧 SERVICES"
            C1[⚙️ Order Service]
            C2[🎯 Support Service]
            C3[🤖 State Machine]
        end
        
        subgraph "🗄️ REPOSITORIES"
            D1[📊 Order Repository]
            D2[📋 Support Repository]
            D3[📁 Base Repository]
        end
    end
    
    %% === DATABASE LAYER ===
    subgraph "🗃️ DATABASE - PostgreSQL"
        E1[(📦 orders)]
        E2[(🎫 support_tickets)]
        E3[(📝 order_events)]
        E4[🔐 Supabase]
    end
    
    %% === CONNECTIONS ===
    A4 --> B1
    A4 --> B2
    A4 --> B3
    
    B1 --> C1
    B2 --> C2
    
    C1 --> C3
    C1 --> D1
    C1 --> D2
    C2 --> D2
    
    D1 --> E1
    D1 --> E3
    D2 --> E2
    
    E1 --> E4
    E2 --> E4
    E3 --> E4
```

## 🔄 Máquina de Estados Completa

```mermaid
stateDiagram-v2
    [*] --> pending : Nueva Orden
    
    %% === ESTADOS PRINCIPALES ===
    pending --> on_hold : pendingBiometricalVerification
    pending --> pending_payment : noVerificationNeeded
    pending --> cancelled : paymentFailed/orderCancelled
    
    on_hold --> pending_payment : biometricalVerificationSuccessful
    on_hold --> cancelled : verificationFailed/orderCancelledByUser
    
    pending_payment --> confirmed : paymentSuccessful
    pending_payment --> cancelled : orderCancelledByUser
    
    confirmed --> processing : preparingShipment
    confirmed --> cancelled : orderCancelledByUser
    
    processing --> shipped : itemDispatched
    processing --> cancelled : orderCancelledByUser
    
    shipped --> delivered : itemReceivedByCustomer
    shipped --> on_hold : deliveryIssue
    shipped --> cancelled : orderCancelledByUser
    
    %% === FLUJO DE DEVOLUCIONES ===
    delivered --> returning : returnInitiatedByCustomer
    returning --> returned : itemReceivedBack
    returned --> refunded : refundProcessed
    
    %% === ESTADOS FINALES ===
    cancelled --> [*]
    delivered --> [*]
    refunded --> [*]
    
    %% === REGLA ESPECIAL ===
    note right of cancelled
        Cualquier estado puede 
        transicionar a cancelled
        con orderCancelledByUser
        (excepto delivered, returned, refunded)
    end note
```

## 🔄 Flujo de Datos Completo

```mermaid
sequenceDiagram
    participant U as 👤 Usuario
    participant UI as 🖥️ Frontend
    participant API as 🚀 FastAPI
    participant SM as 🤖 State Machine
    participant DB as 🗃️ Database
    participant ST as 🎫 Support System
    
    %% === CREAR ORDEN ===
    U->>UI: Crear orden ($1500)
    UI->>API: POST /orders
    API->>DB: INSERT order (pending)
    DB-->>API: Order created
    API-->>UI: Order response
    UI-->>U: Orden creada ✅
    
    %% === PROCESAR EVENTO ===
    U->>UI: Procesar evento (paymentFailed)
    UI->>API: POST /orders/{id}/events
    
    API->>DB: GET order by ID
    DB-->>API: Current order state
    
    API->>SM: validate transition
    SM-->>API: Valid/Invalid transition
    
    Note over API: 🔥 REGLA DE NEGOCIO
    API->>API: Check amount > $1000
    API->>ST: Create support ticket
    ST->>DB: INSERT support_ticket
    
    API->>DB: UPDATE order state
    API->>DB: INSERT order_event (audit)
    DB-->>API: Updated order
    
    API-->>UI: Event processed
    UI-->>U: Estado actualizado + Ticket creado 🎫
```

## 📊 Flujo de Datos de una Orden Real

```mermaid
flowchart TD
    %% === INICIO ===
    START([👤 Usuario crea orden]) --> CREATE{💰 Monto > $1000?}
    
    %% === CREACIÓN ===
    CREATE -->|Sí| ORDER1[📦 Orden: $1500 - PENDING]
    CREATE -->|No| ORDER2[📦 Orden: $500 - PENDING]
    
    %% === VERIFICACIÓN ===
    ORDER1 --> VERIFY{🔍 Necesita verificación?}
    ORDER2 --> VERIFY
    
    VERIFY -->|Sí| HOLD[⏸️ ON_HOLD]
    VERIFY -->|No| PAYMENT[💳 PENDING_PAYMENT]
    
    HOLD --> VERIFY_OK{✅ Verificación OK?}
    VERIFY_OK -->|Sí| PAYMENT
    VERIFY_OK -->|No| CANCEL1[❌ CANCELLED]
    
    %% === PAGO ===
    PAYMENT --> PAY_PROCESS{💳 Procesar pago}
    PAY_PROCESS -->|✅ Éxito| CONFIRMED[✅ CONFIRMED]
    PAY_PROCESS -->|❌ Fallo| PAY_FAIL[💥 PAYMENT_FAILED]
    
    %% === REGLA DE NEGOCIO AUTOMÁTICA ===
    PAY_FAIL --> CHECK_AMOUNT{💰 Monto > $1000?}
    CHECK_AMOUNT -->|Sí| TICKET[🎫 CREAR TICKET AUTOMÁTICO]
    CHECK_AMOUNT -->|No| CANCEL2[❌ CANCELLED]
    
    TICKET --> CANCEL3[❌ CANCELLED]
    TICKET --> SUPPORT[👨‍💼 Soporte interviene]
    SUPPORT --> RETRY[🔄 Reintento de pago]
    RETRY --> CONFIRMED
    
    %% === PROCESAMIENTO ===
    CONFIRMED --> PROCESSING[⚙️ PROCESSING]
    PROCESSING --> SHIPPED[🚚 SHIPPED]
    SHIPPED --> DELIVERED[📦 DELIVERED]
    
    %% === DEVOLUCIONES ===
    DELIVERED --> RETURN_REQ{↩️ Cliente quiere devolver?}
    RETURN_REQ -->|Sí| RETURNING[📮 RETURNING]
    RETURN_REQ -->|No| END1[🎉 PROCESO COMPLETO]
    
    RETURNING --> RETURNED[📥 RETURNED]
    RETURNED --> REFUNDED[💰 REFUNDED]
    REFUNDED --> END2[🎉 PROCESO COMPLETO]
    
    %% === CANCELACIONES ===
    CANCEL1 --> END3[❌ ORDEN CANCELADA]
    CANCEL2 --> END3
    CANCEL3 --> END3
    
    %% === STYLING ===
    classDef startEnd fill:#e1f5fe,stroke:#01579b,stroke-width:3px
    classDef process fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef error fill:#ffebee,stroke:#c62828,stroke-width:2px
    classDef success fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef ticket fill:#fff8e1,stroke:#f57f17,stroke-width:3px
    
    class START,END1,END2,END3 startEnd
    class ORDER1,ORDER2,HOLD,PAYMENT,CONFIRMED,PROCESSING,SHIPPED,DELIVERED,RETURNING,RETURNED,REFUNDED process
    class CREATE,VERIFY,VERIFY_OK,PAY_PROCESS,CHECK_AMOUNT,RETURN_REQ decision
    class PAY_FAIL,CANCEL1,CANCEL2,CANCEL3 error
    class DELIVERED,REFUNDED success
    class TICKET,SUPPORT ticket
```

## 🏗️ Arquitectura de 3 Capas Detallada

```mermaid
graph TB
    %% === PRESENTATION LAYER ===
    subgraph "🎨 PRESENTATION LAYER"
        subgraph "📱 Frontend Components"
            P1[📋 OrdersList]
            P2[📦 OrderDetail]
            P3[🎫 SupportTickets]
            P4[⚡ EventButtons]
        end
        
        subgraph "🎮 API Controllers"
            P5[📊 OrderController]
            P6[🎯 SupportController]
            P7[❤️ HealthController]
        end
    end
    
    %% === BUSINESS LAYER ===
    subgraph "🔧 BUSINESS LOGIC LAYER"
        subgraph "⚙️ Services"
            B1[📦 OrderService]
            B2[🎫 SupportService]
        end
        
        subgraph "🤖 Domain Logic"
            B3[🎯 StateMachine]
            B4[📋 BusinessRules]
            B5[🔄 EventProcessor]
        end
        
        subgraph "📊 Domain Models"
            B6[📦 Order]
            B7[🎫 SupportTicket]
            B8[📝 OrderEvent]
        end
    end
    
    %% === DATA LAYER ===
    subgraph "🗄️ DATA ACCESS LAYER"
        subgraph "📚 Repositories"
            D1[📊 OrderRepository]
            D2[🎯 SupportRepository]
            D3[📁 BaseRepository]
        end
        
        subgraph "🗃️ Database"
            D4[(📦 orders)]
            D5[(🎫 support_tickets)]
            D6[(📝 order_events)]
        end
        
        subgraph "☁️ Infrastructure"
            D7[🔐 Supabase]
            D8[🔗 Connection Pool]
            D9[📊 Indexes]
        end
    end
    
    %% === CONNECTIONS ===
    P1 --> P5
    P2 --> P5
    P3 --> P6
    P4 --> P5
    
    P5 --> B1
    P6 --> B2
    
    B1 --> B3
    B1 --> B4
    B1 --> B5
    B1 --> B6
    B2 --> B7
    
    B1 --> D1
    B1 --> D2
    B2 --> D2
    
    D1 --> D4
    D1 --> D6
    D2 --> D5
    
    D4 --> D7
    D5 --> D7
    D6 --> D7
    
    D7 --> D8
    D7 --> D9
    
    %% === STYLING ===
    classDef presentation fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef business fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef data fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    
    class P1,P2,P3,P4,P5,P6,P7 presentation
    class B1,B2,B3,B4,B5,B6,B7,B8 business
    class D1,D2,D3,D4,D5,D6,D7,D8,D9 data
```

## 🎯 Sistema de Support Tickets Automático

```mermaid
flowchart LR
    %% === TRIGGER ===
    subgraph "🚨 AUTOMATIC TRIGGER"
        A1[💳 paymentFailed event]
        A2{💰 amount > $1000?}
        A3[🎫 CREATE SUPPORT TICKET]
    end
    
    %% === TICKET WORKFLOW ===
    subgraph "🎫 TICKET LIFECYCLE"
        B1[🔴 OPEN]
        B2[🟡 IN_PROGRESS]
        B3[✅ RESOLVED]
        B4[⚫ CLOSED]
    end
    
    %% === SUPPORT ACTIONS ===
    subgraph "👨‍💼 SUPPORT ACTIONS"
        C1[📞 Contact Customer]
        C2[🔍 Review Payment]
        C3[💳 Process Alternative Payment]
        C4[📧 Send Resolution Email]
    end
    
    %% === BUSINESS IMPACT ===
    subgraph "📊 BUSINESS IMPACT"
        D1[💰 Revenue Recovery]
        D2[😊 Customer Satisfaction]
        D3[📈 Success Metrics]
        D4[🔄 Process Improvement]
    end
    
    %% === CONNECTIONS ===
    A1 --> A2
    A2 -->|YES| A3
    A2 -->|NO| END1[❌ Order Cancelled]
    
    A3 --> B1
    B1 --> B2
    B2 --> B3
    B3 --> B4
    
    B1 --> C1
    B2 --> C2
    B2 --> C3
    B3 --> C4
    
    C4 --> D1
    D1 --> D2
    D2 --> D3
    D3 --> D4
    
    %% === STYLING ===
    classDef trigger fill:#ffebee,stroke:#c62828,stroke-width:3px
    classDef workflow fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef action fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef impact fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    
    class A1,A2,A3 trigger
    class B1,B2,B3,B4 workflow
    class C1,C2,C3,C4 action
    class D1,D2,D3,D4 impact
```

## 🔐 Seguridad y Validación

```mermaid
graph TB
    %% === INPUT VALIDATION ===
    subgraph "🛡️ INPUT VALIDATION"
        V1[📝 Pydantic Schemas]
        V2[🔍 Type Checking]
        V3[📊 Business Rules]
        V4[🚫 SQL Injection Prevention]
    end
    
    %% === AUTHENTICATION ===
    subgraph "🔐 AUTHENTICATION"
        A1[👤 User Identity]
        A2[🎟️ JWT Tokens]
        A3[🔑 API Keys]
        A4[⏰ Session Management]
    end
    
    %% === AUTHORIZATION ===
    subgraph "👮 AUTHORIZATION"
        Z1[📋 Role-Based Access]
        Z2[🎯 Permission Checks]
        Z3[🏢 Organization Scope]
        Z4[📊 Resource Ownership]
    end
    
    %% === AUDIT & LOGGING ===
    subgraph "📊 AUDIT & LOGGING"
        L1[📝 Event Sourcing]
        L2[🔍 Audit Trail]
        L3[📊 Security Monitoring]
        L4[🚨 Alert System]
    end
    
    %% === CONNECTIONS ===
    V1 --> V2
    V2 --> V3
    V3 --> V4
    
    A1 --> A2
    A2 --> A3
    A3 --> A4
    
    Z1 --> Z2
    Z2 --> Z3
    Z3 --> Z4
    
    L1 --> L2
    L2 --> L3
    L3 --> L4
    
    V4 --> A1
    A4 --> Z1
    Z4 --> L1
```

## 📈 Performance y Escalabilidad

```mermaid
graph LR
    %% === FRONTEND OPTIMIZATION ===
    subgraph "🚀 FRONTEND PERFORMANCE"
        F1[⚡ Next.js SSR/SSG]
        F2[📦 Code Splitting]
        F3[🖼️ Image Optimization]
        F4[💾 Browser Caching]
    end
    
    %% === BACKEND OPTIMIZATION ===
    subgraph "⚙️ BACKEND PERFORMANCE"
        B1[🔄 Async/Await]
        B2[🏊 Connection Pooling]
        B3[📊 Query Optimization]
        B4[🗜️ Response Compression]
    end
    
    %% === DATABASE OPTIMIZATION ===
    subgraph "🗃️ DATABASE PERFORMANCE"
        D1[📊 Strategic Indexes]
        D2[🔄 Query Optimization]
        D3[📈 Connection Scaling]
        D4[🗂️ Partitioning]
    end
    
    %% === CACHING STRATEGY ===
    subgraph "💾 CACHING LAYERS"
        C1[🌐 CDN Caching]
        C2[🖥️ Browser Cache]
        C3[🚀 Application Cache]
        C4[🗃️ Database Cache]
    end
    
    %% === MONITORING ===
    subgraph "📊 MONITORING"
        M1[📈 Performance Metrics]
        M2[🚨 Error Tracking]
        M3[📊 Usage Analytics]
        M4[⏱️ Response Times]
    end
    
    %% === CONNECTIONS ===
    F1 --> F2 --> F3 --> F4
    B1 --> B2 --> B3 --> B4
    D1 --> D2 --> D3 --> D4
    C1 --> C2 --> C3 --> C4
    M1 --> M2 --> M3 --> M4
    
    F4 -.-> B1
    B4 -.-> D1
    D4 -.-> C1
    C4 -.-> M1
```

---

## 🎯 Resumen Visual del Sistema

Este diagrama completo muestra cómo tu sistema Sainapsis integra:

1. **🖥️ Frontend Moderno** - Next.js 15 con React 19
2. **🚀 Backend Robusto** - FastAPI con arquitectura de 3 capas
3. **🤖 State Machine** - Control preciso de estados de órdenes
4. **🎫 Support Automático** - Tickets creados automáticamente
5. **🗃️ Persistencia Confiable** - PostgreSQL con Supabase
6. **🔐 Seguridad Integral** - Validación y autenticación
7. **📈 Performance Optimizada** - Cacheo y optimizaciones
8. **📊 Monitoreo Completo** - Métricas y alertas

El sistema es una **arquitectura empresarial de clase mundial** que maneja el ciclo completo de órdenes de forma automática, segura y escalable.