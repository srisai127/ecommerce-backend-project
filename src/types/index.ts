export type UserRole = "customer" | "admin";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export interface CartRow {
  product_id: number;
  name: string;
  description: string;
  sku: string;
  price_paise: number;
  stock_quantity: number;
  quantity: number;
  category_name: string;
}
