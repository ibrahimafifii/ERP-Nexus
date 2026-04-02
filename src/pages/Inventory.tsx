import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/store/useStore'
import { supabase } from '@/lib/supabase'
import { fmtCurrency, fmt, generateCode, UNITS } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import { Plus, Search, Edit2, Trash2, AlertTriangle, Package, X } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = { sku: '', name: '', name_ar: '', category_id: '', unit: 'piece', unit_price: 0, cost_price: 0, min_stock: 0 }

export default function Inventory() {
  const { profile } = useAuth()
  const { products, categories, warehouses, refreshProducts } = useStore()
  const bid = profile?.business_id
  const canSeeCosts = ['owner', 'accountant'].includes(profile?.role ?? '')
  const canEdit = ['owner', 'manager', 'warehouse'].includes(profile?.role ?? '')

  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterLow, setFilterLow] = useState(false)
  const [stockMap, setStockMap] = useState<Record<string, number>>({})
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [showStock, setShowStock] = useState<any>(null)
  const [stockDetail, setStockDetail] = useState<any[]>([])
  const [showDelete, setShowDelete] = useState<any>(null)

  useEffect(() => { if (bid) loadStock() }, [products, bid])

  async function loadStock() {
    if (!bid) return
    const { data } = await supabase.from('stock').select('product_id, quantity').eq('business_id', bid)
    const map: Record<string, number> = {}
    for (const r of data ?? []) map[r.product_id] = (map[r.product_id] ?? 0) + Number(r.quantity)
    setStockMap(map)
  }

  async function loadStockDetail(p: any) {
    const { data } = await supabase.from('stock').select('quantity, warehouse:warehouses(name, name_ar)').eq('product_id', p.id)
    setStockDetail(data ?? [])
    setShowStock(p)
  }

  function openAdd() {
    setEditing(null); setForm({ ...EMPTY, sku: generateCode() }); setShowForm(true)
  }
  function openEdit(p: any) {
    setEditing(p)
    setForm({ sku: p.sku, name: p.name ?? '', name_ar: p.name_ar ?? '', category_id: p.category_id ?? '', unit: p.unit, unit_price: p.unit_price, cost_price: p.cost_price, min_stock: p.min_stock })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name && !form.name_ar) { toast.error('اكتب اسم المنتج'); return }
    if (!form.sku) { toast.error('كود المنتج مطلوب'); return }
    setSaving(true)
    const payload = {
      sku: form.sku, name: form.name || form.name_ar,
      name_ar: form.name_ar || form.name, category_id: form.category_id || null,
      unit: form.unit, unit_price: Number(form.unit_price),
      cost_price: Number(form.cost_price), min_stock: Number(form.min_stock), business_id: bid,
    }
    const { error } = editing
      ? await supabase.from('products').update(payload).eq('id', editing.id)
      : await supabase.from('products').insert(payload)
    if (error) toast.error(error.message)
    else { toast.success(editing ? 'تم التعديل' : 'تمت الإضافة'); setShowForm(false); refreshProducts(bid!) }
    setSaving(false)
  }

  async function handleDelete() {
    await supabase.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', showDelete.id)
    toast.success('تم الحذف'); setShowDelete(null); refreshProducts(bid!)
  }

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    const match = p.name?.toLowerCase().includes(q) || p.name_ar?.includes(search) || p.sku?.toLowerCase().includes(q)
    const cat = !filterCat || p.category_id === filterCat
    const low = !filterLow || (stockMap[p.id] ?? 0) <= p.min_stock
    return match && cat && low
  })

  const lowCount = products.filter(p => (stockMap[p.id] ?? 0) <= p.min_stock).length

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">إدارة المخزون</h1>
          <p className="text-xs text-slate-500 mt-0.5">{fmt(products.length)} منتج {lowCount > 0 && <span className="text-red-500">· {fmt(lowCount)} تنبيه</span>}</p>
        </div>
        {canEdit && <button onClick={openAdd} className="btn-primary"><Plus size={16} />منتج جديد</button>}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الكود..." className="input pr-9 h-9 text-xs" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="input h-9 text-xs w-auto min-w-32">
          <option value="">كل التصنيفات</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={() => setFilterLow(!filterLow)}
          className={`h-9 px-3 rounded-xl text-xs border flex items-center gap-1.5 transition-colors
            ${filterLow ? 'bg-red-50 border-red-300 text-red-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          <AlertTriangle size={13} />تنبيهات
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {filtered.length === 0
          ? <div className="flex flex-col items-center py-16 text-slate-400"><Package size={36} className="mb-3 opacity-30" /><p className="text-sm">لا توجد منتجات</p></div>
          : <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-100">
                {['الكود', 'المنتج', 'التصنيف', 'الوحدة', canSeeCosts ? 'التكلفة' : '', 'السعر', 'المخزون', canEdit ? '' : ''].filter(Boolean).map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-semibold text-slate-500">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(p => {
                  const stock = stockMap[p.id] ?? 0
                  const isLow = stock <= p.min_stock
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3"><span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-lg text-slate-500">{p.sku}</span></td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{p.name_ar || p.name}</p>
                        {p.name_ar && p.name && <p className="text-xs text-slate-400">{p.name}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{(p as any).category?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{UNITS.find(u => u.value === p.unit)?.label ?? p.unit}</td>
                      {canSeeCosts && <td className="px-4 py-3 text-xs text-slate-600 font-mono">{fmtCurrency(p.cost_price)}</td>}
                      <td className="px-4 py-3 font-semibold text-slate-800 font-mono text-xs">{fmtCurrency(p.unit_price)}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => loadStockDetail(p)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors
                            ${isLow ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                          {isLow && <AlertTriangle size={10} />}{fmt(stock)}
                        </button>
                      </td>
                      {canEdit && <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={13} /></button>
                          <button onClick={() => setShowDelete(p)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        }
      </div>

      {/* Add/Edit Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editing ? 'تعديل منتج' : 'منتج جديد'}
        footer={
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'حفظ'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">إلغاء</button>
          </div>
        }>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">كود المنتج *</label>
            <div className="flex gap-2">
              <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="input font-mono" placeholder="THG-00001" />
              <button onClick={() => setForm({ ...form, sku: generateCode() })} className="btn-secondary text-xs px-3 whitespace-nowrap">توليد تلقائي</button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">الاسم بالعربي</label>
            <input value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} className="input" placeholder="اسم المنتج" dir="rtl" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">الاسم بالإنجليزي</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="Product name" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">التصنيف</label>
            <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className="input bg-white">
              <option value="">بدون تصنيف</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">الوحدة</label>
            <div className="flex gap-2">
              {UNITS.map(u => (
                <button key={u.value} type="button" onClick={() => setForm({ ...form, unit: u.value })}
                  className={`flex-1 py-2 rounded-xl text-sm border transition-colors ${form.unit === u.value ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {u.label}
                </button>
              ))}
            </div>
          </div>
          <div className={`grid gap-3 ${canSeeCosts ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">سعر البيع (ج.م)</label>
              <input type="number" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: Number(e.target.value) })} className="input" min="0" />
            </div>
            {canSeeCosts && <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">سعر التكلفة (ج.م)</label>
              <input type="number" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: Number(e.target.value) })} className="input" min="0" />
            </div>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">الحد الأدنى للمخزون</label>
            <input type="number" value={form.min_stock} onChange={e => setForm({ ...form, min_stock: Number(e.target.value) })} className="input" min="0" />
          </div>
        </div>
      </Modal>

      {/* Stock Detail Modal */}
      <Modal open={!!showStock} onClose={() => setShowStock(null)} title={`مخزون — ${showStock?.name_ar || showStock?.name}`} size="sm">
        {stockDetail.length === 0
          ? <p className="text-center text-slate-400 py-6 text-sm">لا يوجد مخزون</p>
          : <div className="space-y-2">
            {stockDetail.map((s, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-sm text-slate-700">{(s.warehouse as any)?.name_ar || (s.warehouse as any)?.name}</span>
                <span className="font-bold text-slate-800">{fmt(s.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
              <span className="text-sm font-semibold text-blue-700">الإجمالي</span>
              <span className="font-bold text-blue-700">{fmt(stockDetail.reduce((s, r) => s + Number(r.quantity), 0))}</span>
            </div>
          </div>
        }
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!showDelete} onClose={() => setShowDelete(null)} title="تأكيد الحذف" size="sm"
        footer={<div className="flex gap-2"><button onClick={handleDelete} className="btn-danger flex-1">حذف</button><button onClick={() => setShowDelete(null)} className="btn-secondary flex-1">إلغاء</button></div>}>
        <p className="text-slate-600 text-sm text-center py-2">هيتم حذف "{showDelete?.name_ar || showDelete?.name}"</p>
      </Modal>
    </div>
  )
}
