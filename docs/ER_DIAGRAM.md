# Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ CART_ITEMS : owns
    PRODUCTS ||--o{ CART_ITEMS : appears_in
    CATEGORIES ||--o{ PRODUCTS : groups
    USERS ||--o{ ORDERS : places
    ORDERS ||--|{ ORDER_ITEMS : contains
    PRODUCTS o|--o{ ORDER_ITEMS : referenced_by
    ORDERS ||--o| PAYMENTS : has

    USERS {
      int id PK
      string name
      string email UK
      string password_hash
      string role
      datetime created_at
    }
    CATEGORIES {
      int id PK
      string name UK
      string slug UK
      string description
    }
    PRODUCTS {
      int id PK
      int category_id FK
      string name
      string sku UK
      int price_paise
      int stock_quantity
      boolean is_active
    }
    CART_ITEMS {
      int id PK
      int user_id FK
      int product_id FK
      int quantity
    }
    ORDERS {
      int id PK
      int user_id FK
      string status
      int subtotal_paise
      int total_paise
      string shipping_address
    }
    ORDER_ITEMS {
      int id PK
      int order_id FK
      int product_id FK
      string product_name
      string sku
      int unit_price_paise
      int quantity
    }
    PAYMENTS {
      int id PK
      int order_id FK
      string payment_reference UK
      string provider
      string status
      int amount_paise
    }
```

`ORDER_ITEMS.product_id` can become `NULL` if the referenced product is deleted, while the product name, SKU, and unit-price snapshot remain available for order history. In normal catalog operations products are soft-deleted rather than physically deleted.
