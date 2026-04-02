export type UserRole = 'owner' | 'manager' | 'accountant' | 'sales' | 'warehouse' | 'packer' | 'hr'

export interface Business {
  id: string
  name: string
  name_ar?: string
  address?: string
  phone?: string
  email?: string
  currency: string
  created_at: string
}

export interface Profile {
  id: string
  business_id: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface Warehouse {
  id: string
  business_id: string
  name: string
  name_ar?: string
  location?: string
  is_active: boolean
}

export interface Product {
  id: string
  business_id: string
  sku: string
  name: string
  name_ar?: string
  category_id?: string
  unit: string
  unit_price: number
  cost_price: number
  min_stock: number
  is_active: boolean
  deleted_at?: string
  created_at: string
}

export interface StockItem {
  id: string
  product_id: string
  warehouse_id: string
  quantity: number
  reserved_quantity: number
  product?: Product
  warehouse?: Warehouse
}

export interface Customer {
  id: string
  business_id: string
  name: string
  phone?: string
  email?: string
  balance: number
  is_active: boolean
}

export interface SalesInvoice {
  id: string
  business_id: string
  invoice_number: string
  book_number?: number
  customer_id?: string
  warehouse_id?: string
  sales_channel: string
  invoice_date: string
  total_amount: number
  paid_amount: number
  status: 'draft' | 'confirmed' | 'cancelled'
  created_at: string
  customer?: Customer
}

export interface Employee {
  id: string
  business_id: string
  employee_code?: string
  first_name: string
  last_name: string
  phone?: string
  position?: string
  department?: string
  base_salary: number
  is_active: boolean
}

export interface DashboardKPIs {
  totalProducts: number
  totalInventoryValue: number
  todaySales: number
  todayRevenue: number
  lowStockCount: number
  totalCustomers: number
}
