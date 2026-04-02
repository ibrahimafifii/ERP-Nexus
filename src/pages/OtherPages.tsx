import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/store/useStore'
import { supabase } from '@/lib/supabase'
import { fmtCurrency, fmt, fmtDate, generateCode, UNITS } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import { Construction, Warehouse as WH, Ship, AlertTriangle, Plus, Search } from 'lucide-react'
import toast from 'react-hot-toast'

// ============================================================
// WAREHOUSE
// ============================================================
export function Warehouse() {
  const { profile } = useAuth()
  const { products, warehouses } = useStore()
  const bid = profile?.business_id
  const [stockAll, setStockAll] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selWarehouse, setSelWarehouse] = useState('')

  useEffect(() => { if (bid) load() }, [bid])
  async function load() {
    setLoading(true)
    const { data } = await supabase.from('stock')
      .select('quantity, product:products(sku, name, name_ar, unit, min_stock), warehouse:warehouses(name, name_ar), product_id, warehouse_id')
      .eq('business_id', bid!)
    setStockAll(data ?? [])
    setLoading(false)
  }

  const filtered = stockAll.filter(s => {
    const p = s.product as any
    const q = search.toLowerCase()
    const matchSearch = p?.name?.toLowerCase().includes(q) || p?.name_ar?.includes(search) || p?.sku?.toLowerCase().includes(q)
    const matchWH = !selWarehouse || s.warehouse_id === selWarehouse
    return matchSearch && matchWH
  })

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-xl font-bold text-slate-800">إدارة المستودع</h1>
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="input h-9 text-sm pr-9" />
        </div>
        <select value={selWarehouse} onChange={e => setSelWarehouse(e.target.value)} className="input h-9 text-sm w-auto bg-white">
          <option value="">كل المستودعات</option>
          {warehouses.map(w => <option key={w.id} value={w.id}>{w.name_ar || w.name}</option>)}
        </select>
      </div>
      <div className="card overflow-hidden">
        {loading
          ? <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
          : filtered.length === 0
            ? <div className="flex flex-col items-center py-16 text-slate-400"><WH size={36} className="mb-3 opacity-30" /><p className="text-sm">لا يوجد مخزون</p></div>
            : <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-100">
                {['الكود', 'المنتج', 'المستودع', 'الكمية', 'الحالة'].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-semibold text-slate-500">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((s, i) => {
                  const p = s.product as any
                  const w = s.warehouse as any
                  const isLow = Number(s.quantity) <= Number(p?.min_stock ?? 0)
                  return (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5"><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{p?.sku}</span></td>
                      <td className="px-4 py-2.5 text-sm text-slate-800">{p?.name_ar || p?.name}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">{w?.name_ar || w?.name}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-800">{fmt(s.quantity)}</td>
                      <td className="px-4 py-2.5">
                        <span className={isLow ? 'badge-red' : 'badge-green'}>{isLow ? 'تنبيه' : 'طبيعي'}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table></div>
        }
      </div>
    </div>
  )
}

// ============================================================
// IMPORTS
// ============================================================
export function Imports() {
  const { profile } = useAuth()
  const { suppliers, warehouses } = useStore()
  const bid = profile?.business_id
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (bid) load() }, [bid])
  async function load() {
    setLoading(true)
    const { data } = await supabase.from('purchases').select('*, supplier:suppliers(name)').eq('business_id', bid!).order('created_at', { ascending: false })
    setPurchases(data ?? [])
    setLoading(false)
  }

  const totalImports = purchases.reduce((s, p) => s + Number(p.total_amount), 0)

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">الاستيراد والمشتريات</h1>
          <p className="text-xs text-slate-500 mt-0.5">{fmt(purchases.length)} عملية · {fmtCurrency(totalImports)}</p>
        </div>
      </div>
      <div className="card overflow-hidden">
        {loading
          ? <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
          : purchases.length === 0
            ? <div className="flex flex-col items-center py-16 text-slate-400"><Ship size={36} className="mb-3 opacity-30" /><p className="text-sm">لا توجد مشتريات</p><p className="text-xs mt-1">ستُضاف هنا عمليات الاستيراد والمشتريات</p></div>
            : <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-100">
                {['رقم الطلب', 'المورّد', 'التاريخ', 'الإجمالي', 'الحالة'].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-semibold text-slate-500">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {purchases.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono text-xs">{p.purchase_number}</td>
                    <td className="px-4 py-2.5 text-sm">{(p.supplier as any)?.name ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{fmtDate(p.purchase_date)}</td>
                    <td className="px-4 py-2.5 font-bold font-mono">{fmtCurrency(p.total_amount)}</td>
                    <td className="px-4 py-2.5"><span className="badge-blue">{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
        }
      </div>
    </div>
  )
}

// ============================================================
// DAMAGE TRACKING
// ============================================================
export function DamageTracking() {
  const { profile } = useAuth()
  const { products, warehouses } = useStore()
  const bid = profile?.business_id
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ product_id: '', warehouse_id: '', quantity: 1, damage_date: new Date().toISOString().split('T')[0], reason: '', estimated_loss: 0 })
  const [saving, setSaving] = useState(false)
  const canEdit = ['owner', 'manager', 'warehouse'].includes(profile?.role ?? '')

  useEffect(() => { if (bid) load() }, [bid])
  async function load() {
    setLoading(true)
    const { data } = await supabase.from('damage_reports')
      .select('*, product:products(name, name_ar), warehouse:warehouses(name, name_ar)')
      .eq('business_id', bid!).order('created_at', { ascending: false })
    setReports(data ?? [])
    setLoading(false)
  }

  async function handleSave() {
    if (!form.product_id || !form.warehouse_id) { toast.error('اختر المنتج والمستودع'); return }
    setSaving(true)
    const { error } = await supabase.from('damage_reports').insert({ ...form, quantity: Number(form.quantity), estimated_loss: Number(form.estimated_loss), business_id: bid })
    if (error) toast.error(error.message)
    else { toast.success('تم التسجيل'); setShowForm(false); load() }
    setSaving(false)
  }

  const totalLoss = reports.reduce((s, r) => s + Number(r.estimated_loss), 0)

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">البضاعة التالفة</h1>
          <p className="text-xs text-slate-500 mt-0.5">{fmt(reports.length)} حالة · خسائر: {fmtCurrency(totalLoss)}</p>
        </div>
        {canEdit && <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={16} />تسجيل تالف</button>}
      </div>
      <div className="card overflow-hidden">
        {loading
          ? <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
          : reports.length === 0
            ? <div className="flex flex-col items-center py-16 text-slate-400"><AlertTriangle size={36} className="mb-3 opacity-30" /><p className="text-sm">لا توجد بضاعة تالفة</p></div>
            : <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-100">
                {['التاريخ', 'المنتج', 'المستودع', 'الكمية', 'السبب', 'الخسارة'].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-semibold text-slate-500">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {reports.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-xs text-slate-500">{fmtDate(r.damage_date)}</td>
                    <td className="px-4 py-2.5 text-sm">{(r.product as any)?.name_ar || (r.product as any)?.name}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{(r.warehouse as any)?.name_ar}</td>
                    <td className="px-4 py-2.5 font-bold text-red-600">{fmt(r.quantity)}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{r.reason || '—'}</td>
                    <td className="px-4 py-2.5 font-bold text-red-600 font-mono">{fmtCurrency(r.estimated_loss)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
        }
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="تسجيل بضاعة تالفة"
        footer={<div className="flex gap-2"><button onClick={handleSave} disabled={saving} className="btn-primary flex-1">{saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'حفظ'}</button><button onClick={() => setShowForm(false)} className="btn-secondary">إلغاء</button></div>}>
        <div className="space-y-3">
          <div><label className="block text-xs font-semibold text-slate-600 mb-1">المنتج *</label>
            <select value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} className="input bg-white">
              <option value="">اختر منتج</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name_ar || p.name}</option>)}
            </select>
          </div>
          <div><label className="block text-xs font-semibold text-slate-600 mb-1">المستودع *</label>
            <select value={form.warehouse_id} onChange={e => setForm({ ...form, warehouse_id: e.target.value })} className="input bg-white">
              <option value="">اختر مستودع</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name_ar || w.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-slate-600 mb-1">الكمية</label>
              <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} className="input" min="1" /></div>
            <div><label className="block text-xs font-semibold text-slate-600 mb-1">التاريخ</label>
              <input type="date" value={form.damage_date} onChange={e => setForm({ ...form, damage_date: e.target.value })} className="input" /></div>
          </div>
          <div><label className="block text-xs font-semibold text-slate-600 mb-1">السبب</label>
            <input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className="input" placeholder="سبب التلف" /></div>
          <div><label className="block text-xs font-semibold text-slate-600 mb-1">الخسارة التقديرية (ج.م)</label>
            <input type="number" value={form.estimated_loss} onChange={e => setForm({ ...form, estimated_loss: Number(e.target.value) })} className="input" min="0" /></div>
        </div>
      </Modal>
    </div>
  )
}
