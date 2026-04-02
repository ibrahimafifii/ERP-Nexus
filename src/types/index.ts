export type UserRole = 'owner'|'manager'|'accountant'|'sales'|'warehouse'|'packer'|'hr'

export interface Profile {
  id: string; business_id: string; full_name: string
  role: UserRole; is_active: boolean; created_at: string
}
export interface Business {
  id: string; name: string; name_ar: string; currency: string
}
export interface Warehouse {
  id: string; business_id: string; name: string; name_ar: string
  location: string; is_active: boolean
}
export interface Category {
  id: string; business_id: string; name: string; name_ar: string
}
export interface Product {
  id: string; business_id: string; sku: string; name: string; name_ar: string
  category_id: string; unit: string; unit_price: number; cost_price: number
  min_stock: number; is_active: boolean; deleted_at?: string; created_at: string
  category?: Category; total_stock?: number
}
export interface StockRow {
  id: string; product_id: string; warehouse_id: string
  quantity: number; reserved_quantity: number
  product?: Product; warehouse?: Warehouse
}
export interface Customer {
  id: string; business_id: string; name: string; phone?: string
  email?: string; balance: number; customer_type: string; is_active: boolean
}
export interface Supplier {
  id: string; business_id: string; name: string; phone?: string; balance: number; is_active: boolean
}
export interface SalesInvoice {
  id: string; business_id: string; invoice_number: string; book_number?: number
  customer_id?: string; warehouse_id?: string; sales_channel: string
  invoice_date: string; subtotal: number; discount_amount: number
  total_amount: number; paid_amount: number; status: 'draft'|'confirmed'|'cancelled'
  notes?: string; created_at: string
  customer?: Customer; warehouse?: Warehouse; items?: SalesInvoiceItem[]
}
export interface SalesInvoiceItem {
  id: string; invoice_id: string; product_id: string
  quantity: number; unit_price: number; discount_percent: number; total_price: number
  product?: Product
}
export interface Employee {
  id: string; business_id: string; employee_code?: string
  first_name: string; last_name: string; phone?: string
  position?: string; department?: string; hire_date?: string
  base_salary: number; is_active: boolean
}
export interface Account {
  id: string; business_id: string; account_code: string
  account_name: string; account_name_ar: string; account_type: string
}
export interface JournalEntry {
  id: string; business_id: string; entry_number: string; entry_date: string
  description?: string; is_posted: boolean; created_at: string
  lines?: JournalLine[]
}
export interface JournalLine {
  id: string; journal_entry_id: string; account_id: string
  debit: number; credit: number; description?: string
  account?: Account
}
export interface DamageReport {
  id: string; business_id: string; product_id: string; warehouse_id: string
  quantity: number; damage_date: string; reason?: string
  estimated_loss: number; created_at: string
  product?: Product; warehouse?: Warehouse
}
export interface Purchase {
  id: string; business_id: string; purchase_number: string
  supplier_id?: string; warehouse_id?: string; purchase_date: string
  total_amount: number; paid_amount: number; status: string
  notes?: string; created_at: string
}
