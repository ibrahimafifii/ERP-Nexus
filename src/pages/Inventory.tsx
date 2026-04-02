import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  Plus, Search, Edit2, Trash2, X, Save,
  Package, AlertTriangle, Filter, ChevronDown
} from 'lucide-react'

interface Category {
  id: string
  name: string
  name_ar: string
}

interface Warehouse {
  id: string
  name: string
  name_ar: string
}

interface Product {
  id: string
  sku: string
  name: string
  name_ar: string
  category_id: string
  unit: string
  unit_price: number
  cost_price: number
  min_stock: number
  is_active: boolean
  category?: { name_ar: string }
  total_stock?: number
}

const UNITS = ['piece', 'box', 'set', 'meter', 'kg', 'liter']
const UNIT_AR: Record<string, string> = {
  piece: 'قطعة', box: 'صندوق', set: 'طقم',
  meter: 'متر', kg: 'كيلو', liter: 'لتر'
}

function fmt(n: number) {
  return new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 0 }).format(n)
}

const emptyForm = {
  sku: '', name: '', name_ar: '', category_id: '',
  unit: 'piece', unit_price: 0, cost_price: 0, min_stock: 0
}

export default function Inventory() {
  const { profile } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterLow, setFilterLow] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [stockModal, setStockModal] = useState<Product | null>(null)
  const [stockData, setStockData] = useState<any[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null)

  const bid = profile?.business_id
  const canSeeCosts = profile?.role === 'owner' || profile?.role === 'accountant'
  const canEdit = ['owner', 'manager', 'warehouse'].includes(profile?.role ?? '')

  useEffect(() => { if (bid) loadAll() }, [bid])

  async function loadAll() {
    setLoading(true)
    const [prodRes, catRes, whRes] = await Promise.all([
      supabase
        .from('products')
        .select('*, category:categories(name_ar)')
        .eq('business_id', bid!)
        .is('deleted_at', null)
        .order('name'),
      supabase.from('categories').select('*').eq('business_id', bid!).order('name_ar'),
      supabase.from('warehouses').select('*').eq('business_id', bid!).eq('is_active', true),
    ])

    const prods = prodRes.data ?? []

    // load stock totals
    const { data: stockRows } = await supabase
      .from('stock')
      .select('product_id, quantity')
      .eq('business_id', bid!)

    const stockMap: Record<string, number> = {}
    for (const s of stockRows ?? []) {
      stockMap[s.product_id] = (stockMap[s.product_id] ?? 0) + Number(s.quantity)
    }

    setProducts(prods.map(p => ({ ...p, total_stock: stockMap[p.id] ?? 0 })))
    setCategories(catRes.data ?? [])
    setWarehouses(whRes.data ?? [])
    setLoading(false)
  }

  async function loadStockDetail(product: Product) {
    const { data } = await supabase
      .from('stock')
      .select('quantity, warehouse:warehouses(name, name_ar)')
      .eq('product_id', product.id)
    setStockData(data ?? [])
    setStockModal(product)
  }

  function openAdd() {
    setEditProduct(null)
    setForm(emptyForm)
    setError('')
    setShowModal(true)
  }

  function openEdit(p: Product) {
    setEditProduct(p)
    setForm({
      sku: p.sku, name: p.name, name_ar: p.name_ar ?? '',
      category_id: p.category_id ?? '',
      unit: p.unit, unit_price: p.unit_price,
      cost_price: p.cost_price, min_stock: p.min_stock
    })
    setError('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.sku || !form.name) { setError('كود المنتج والاسم مطلوبين'); return }
    setSaving(true)
    setError('')
    const payload = {
      ...form,
      business_id: bid,
      category_id: form.category_id || null,
      unit_price: Number(form.unit_price),
      cost_price: Number(form.cost_price),
      min_stock: Number(form.min_stock),
    }
    let err
    if (editProduct) {
      const res = await supabase.from('products').update(payload).eq('id', editProduct.id)
      err = res.error
    } else {
      const res = await supabase.from('products').insert(payload)
      err = res.error
    }
    if (err) { setError(err.message); setSaving(false); return }
    setShowModal(false)
    loadAll()
    setSaving(false)
  }

  async function handleDelete(p: Product) {
    await supabase.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', p.id)
    setDeleteConfirm(null)
    loadAll()
  }

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.name_ar ?? '').includes(search) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCat || p.category_id === filterCat
    const matchLow = !filterLow || (p.total_stock ?? 0) <= p.min_stock
    return matchSearch && matchCat && matchLow
  })

  const lowStockCount = products.filter(p => (p.total_stock ?? 0) <= p.min_stock).length

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-arabic">إدارة المخزون</h1>
          <p className="text-sm text-gray-500 font-arabic mt-0.5">
            {products.length} منتج
            {lowStockCount > 0 && (
              <span className="text-red-500 mr-2">· {lowStockCount} تحت الحد الأدنى</span>
            )}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors font-arabic"
          >
            <Plus size={16} />
            منتج جديد
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الكود..."
            className="w-full pr-9 pl-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-arabic"
          />
        </div>
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-arabic"
        >
          <option value="">كل التصنيفات</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name_ar}</option>
          ))}
        </select>
        <button
          onClick={() => setFilterLow(!filterLow)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-colors font-arabic ${
            filterLow ? 'bg-red-50 border-red-300 text-red-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <AlertTriangle size={14} />
          تنبيهات المخزون
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Package size={40} className="mb-3 opacity-30" />
            <p className="font-arabic">لا توجد منتجات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 font-arabic">الكود</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 font-arabic">المنتج</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 font-arabic">التصنيف</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 font-arabic">الوحدة</th>
                  {canSeeCosts && (
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 font-arabic">التكلفة</th>
                  )}
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 font-arabic">سعر البيع</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 font-arabic">المخزون</th>
                  {canEdit && (
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 font-arabic"></th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(p => {
                  const isLow = (p.total_stock ?? 0) <= p.min_stock
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-lg text-gray-600">
                          {p.sku}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 text-sm font-arabic">{p.name_ar || p.name}</p>
                        {p.name_ar && <p className="text-xs text-gray-400">{p.name}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-arabic">
                        {p.category?.name_ar ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-arabic">
                        {UNIT_AR[p.unit] ?? p.unit}
                      </td>
                      {canSeeCosts && (
                        <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                          {fmt(p.cost_price)} ج.م
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800 font-mono">
                        {fmt(p.unit_price)} ج.م
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => loadStockDetail(p)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            isLow
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-700 hover:bg-green-100'
                          }`}
                        >
                          {isLow && <AlertTriangle size={11} />}
                          {fmt(p.total_stock ?? 0)}
                        </button>
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEdit(p)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(p)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 font-arabic">
                {editProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 font-arabic">كود المنتج *</label>
                  <input
                    value={form.sku}
                    onChange={e => setForm({ ...form, sku: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="SKU-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 font-arabic">التصنيف</label>
                  <select
                    value={form.category_id}
                    onChange={e => setForm({ ...form, category_id: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-arabic"
                  >
                    <option value="">بدون تصنيف</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name_ar}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 font-arabic">الاسم بالعربي *</label>
                <input
                  value={form.name_ar}
                  onChange={e => setForm({ ...form, name_ar: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-arabic"
                  placeholder="اسم المنتج بالعربي"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">الاسم بالإنجليزي *</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Product name in English"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 font-arabic">الوحدة</label>
                  <select
                    value={form.unit}
                    onChange={e => setForm({ ...form, unit: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-arabic"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{UNIT_AR[u]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 font-arabic">سعر البيع</label>
                  <input
                    type="number"
                    value={form.unit_price}
                    onChange={e => setForm({ ...form, unit_price: Number(e.target.value) })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                {canSeeCosts && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1 font-arabic">سعر التكلفة</label>
                    <input
                      type="number"
                      value={form.cost_price}
                      onChange={e => setForm({ ...form, cost_price: Number(e.target.value) })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 font-arabic">الحد الأدنى للمخزون</label>
                <input
                  type="number"
                  value={form.min_stock}
                  onChange={e => setForm({ ...form, min_stock: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm font-arabic bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-medium transition-colors font-arabic"
              >
                {saving
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><Save size={15} /><span>حفظ</span></>
                }
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl text-sm transition-colors font-arabic"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Detail Modal */}
      {stockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 font-arabic">
                المخزون — {stockModal.name_ar || stockModal.name}
              </h2>
              <button onClick={() => setStockModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {stockData.length === 0 ? (
                <p className="text-center text-gray-400 py-8 font-arabic">لا يوجد مخزون مسجّل</p>
              ) : (
                <div className="space-y-3">
                  {stockData.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm font-arabic text-gray-700">
                        {(s.warehouse as any)?.name_ar || (s.warehouse as any)?.name}
                      </span>
                      <span className="font-bold text-gray-800">{fmt(s.quantity)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                    <span className="text-sm font-semibold font-arabic text-blue-700">الإجمالي</span>
                    <span className="font-bold text-blue-700">
                      {fmt(stockData.reduce((s, r) => s + Number(r.quantity), 0))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-600" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2 font-arabic">حذف المنتج؟</h3>
            <p className="text-gray-500 text-sm mb-6 font-arabic">
              هيتم حذف "{deleteConfirm.name_ar || deleteConfirm.name}" — مش هيتعافى
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-arabic transition-colors"
              >
                حذف
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-2.5 rounded-xl text-sm font-arabic transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
