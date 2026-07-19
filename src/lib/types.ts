/**
 * Domain types matching the documented MongoDB collections.
 * Adjust field names here if your backend API differs.
 */

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "cashier" | string;
  branchId?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  productCount?: number;
  createdAt?: string;
}

export interface Product {
  _id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  categoryId?: string;
  category?: Category | string;
  costPrice: number;
  sellingPrice: number;
  taxRate?: number;
  unit?: string;
  imageUrl?: string;
  stock?: number;
  lowStockThreshold?: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface Supplier {
  _id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt?: string;
}

export interface Customer {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  loyaltyPoints?: number;
  totalSpent?: number;
  createdAt?: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
}

export type PaymentMethod = "cash" | "card" | "mobile" | "credit";

export interface Sale {
  _id: string;
  receiptNumber?: string;
  customerId?: string;
  customer?: Customer | string;
  items: SaleItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  paymentMethod: PaymentMethod | string;
  status?: "completed" | "refunded" | "void" | string;
  cashierId?: string;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  name?: string;
  quantity: number;
  unitCost: number;
  total?: number;
}

export interface Purchase {
  _id: string;
  referenceNumber?: string;
  supplierId: string;
  supplier?: Supplier | string;
  items: PurchaseItem[];
  total: number;
  status: "pending" | "ordered" | "received" | "cancelled" | string;
  expectedDate?: string;
  receivedDate?: string;
  notes?: string;
  createdAt?: string;
}

export interface InventoryItem {
  _id: string;
  productId: string;
  product?: Product | string;
  name?: string;
  sku?: string;
  quantity: number;
  lowStockThreshold?: number;
  branchId?: string;
  updatedAt?: string;
}

export interface StockMovement {
  _id: string;
  productId: string;
  product?: Product | string;
  type: "in" | "out" | "adjustment" | "transfer" | string;
  quantity: number;
  reason?: string;
  reference?: string;
  createdAt?: string;
}

export interface AuditLog {
  _id: string;
  userId?: string;
  user?: User | string;
  action: string;
  entity?: string;
  entityId?: string;
  details?: string;
  createdAt?: string;
}

export interface Settings {
  storeName?: string;
  currency?: string;
  taxRate?: number;
  receiptFooter?: string;
  lowStockThreshold?: number;
  address?: string;
  phone?: string;
  email?: string;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  orders?: number;
}

export interface ProfitPoint {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
}

export interface TopProduct {
  productId?: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface Expense {
  _id: string;
  category?: string;
  amount: number;
  note?: string;
  createdAt?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type OrderStatus = "pending" | "confirmed" | "fulfilled" | "cancelled";

export interface Order {
  _id: string;
  orderNumber?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress?: string;
  fulfillmentType?: "pickup" | "delivery";
  items: OrderItem[];
  subtotal: number;
  tax?: number;
  total: number;
  status: OrderStatus | string;
  notes?: string;
  linkedSaleId?: string;
  createdAt?: string;
}

/** Shape returned by the public, unauthenticated /public/products endpoint. */
export interface PublicProduct {
  _id: string;
  name: string;
  description?: string;
  sku?: string;
  category?: { _id: string; name: string } | null;
  price: number;
  imageUrl?: string;
  unit?: string;
  inStock: boolean;
}

export interface PublicCategory {
  _id: string;
  name: string;
  description?: string;
}

export interface DashboardSummary {
  todayRevenue?: number;
  todaySalesCount?: number;
  monthRevenue?: number;
  totalProducts?: number;
  lowStockCount?: number;
  totalCustomers?: number;
  revenueByDay?: RevenuePoint[];
  topProducts?: TopProduct[];
}