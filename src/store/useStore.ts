import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { Product, Warehouse, Category, Customer, Employee, Account } from '@/types'

interface AppState {
  // Shared data loaded once
  products: Product[]
  warehouses: Warehouse[]
  categories: Category[]
  customers: Customer[]
  employees: Employee[]
  accounts: Account[]
  loadingMaster: boolean

  // Actions
  loadMasterData: (businessId: string) => Promise<void>
  refreshProducts: (businessId: string) => Promise<void>
  refreshCustomers: (businessId: string) => Promise<void>
}

export const useStore = create<AppState>((set) => ({
  products: [], warehouses: [], categories: [],
  customers: [], employees: [], accounts: [],
  loadingMaster: true,

  async loadMasterData(bid: string) {
    set({ loadingMaster: true })
    const [prodRes, whRes, catRes, custRes, empRes, accRes] = await Promise.all([
      supabase.from('products').select('*, category:categories(id,name,name_ar)')
        .eq('business_id', bid).is('deleted_at', null).order('name'),
      supabase.from('warehouses').select('*').eq('business_id', bid).eq('is_active', true),
      supabase.from('categories').select('*').eq('business_id', bid).order('name'),
      supabase.from('customers').select('*').eq('business_id', bid).eq('is_active', true).order('name'),
      supabase.from('employees').select('*').eq('business_id', bid).eq('is_active', true).order('first_name'),
      supabase.from('chart_of_accounts').select('*').eq('business_id', bid).order('account_code'),
    ])
    set({
      products: prodRes.data ?? [],
      warehouses: whRes.data ?? [],
      categories: catRes.data ?? [],
      customers: custRes.data ?? [],
      employees: empRes.data ?? [],
      accounts: accRes.data ?? [],
      loadingMaster: false,
    })
  },

  async refreshProducts(bid: string) {
    const { data } = await supabase.from('products').select('*, category:categories(id,name,name_ar)')
      .eq('business_id', bid).is('deleted_at', null).order('name')
    set({ products: data ?? [] })
  },

  async refreshCustomers(bid: string) {
    const { data } = await supabase.from('customers').select('*')
      .eq('business_id', bid).eq('is_active', true).order('name')
    set({ customers: data ?? [] })
  },
}))
