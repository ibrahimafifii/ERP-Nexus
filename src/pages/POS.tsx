import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/store/useStore'
import { supabase } from '@/lib/supabase'
import { fmtCurrency, fmt, generateCode, SALES_CHANNELS, UNITS } from '@/lib/utils'
import { Search, Plus, Minus, Trash2, ShoppingCart, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface CartItem { product: any; qty: number; price: number; discount: number }

export default function POS() {
  const { profile } = useAuth()
  const { products, customers, warehouses } = useStore()
  const bid = profile?.business_id

  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerId, setCustomerId] = useState('')
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? '')
  const [channel, setChannel] = useState('shop')
  const [bookNum, setBookNum] = useState('')
  const [discountTotal, setDiscountTotal] = useState(0)
  const [paidAmount, setPaidAmount] = useState(0)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastInvoice, setLastInvoice] = useState<any>(null)

  const filteredProducts = products.filter(p => {
    const q = search.toLowerCase()
    return p.name?.toLowerCase().includes(q) || p.name_ar?.includes(search) || p.sku?.toLowerCase().includes(q)
  }).slice(0, 20)

  function addToCart(p: any) {
    setCart(prev => {
      const exists = prev.find(c => c.product.id === p.id)
      if (exists) return prev.map(c => c.product.id === p.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { product: p, qty: 1, price: p.unit_price, discount: 0 }]
    })
    setSearch('')
  }

  function updateQty(id: string, delta: number) {
    setCart(prev => prev.map(c => c.product.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c))
  }

  function updatePrice(id: string, val: number) {
    setCart(prev => prev.map(c => c.product.id === id ? { ...c, price: val } : c))
  }

  function removeItem(id: string) { setCart(prev => prev.filter(c => c.product.id !== id)) }

  const subtotal = cart.reduce((s, c) => s + c.qty * c.price, 0)
  const total = Math.max(0, subtotal - discountTotal)
  const remaining = Math.max(0, total - paidAmount)

  async function handleConfirm() {
    if (cart.length === 0) { toast.error('السلة فارغة'); return }
    if (!warehouseId) { toast.error('اختر المستودع'); return }
    setSaving(true)

    const invoiceNum = generateCode('INV')
    const { data: inv, error: invErr } = await supabase.from('sales_invoices').insert({
      business_id: bid, invoice_number: invoiceNum,
      book_number: bookNum ? Number(bookNum) : null,
      customer_id: customerId || null, warehouse_id: warehouseId,
      sales_channel: channel, invoice_date: new Date().toISOString().split('T')[0],
      subtotal, discount_amount: discountTotal, total_amount: total,
      paid_amount: paidAmount, status: 'confirmed', notes,
    }).select().single()

    if (invErr) { toast.error('خطأ في حفظ الفاتورة'); setSaving(false); return }

    // Insert items
    await supabase.from('sales_invoice_items').insert(
      cart.map(c => ({
        invoice_id: inv.id, product_id: c.product.id,
        quantity: c.qty, unit_price: c.price,
        discount_percent: c.discount, total_price: c.qty * c.price,
      }))
    )

    // Update stock (deduct)
    for (const item of cart) {
      const { data: stockRow } = await supabase.from('stock')
        .select('id, quantity').eq('product_id', item.product.id).eq('warehouse_id', warehouseId).single()
      if (stockRow) {
        await supabase.from('stock').update({ quantity: Number(stockRow.quantity) - item.qty }).eq('id', stockRow.id)
      }
      // Log movement
      await supabase.from('stock_movements').insert({
        business_id: bid, product_id: item.product.id, warehouse_id: warehouseId,
        movement_type: 'sale', quantity: -item.qty,
        unit_cost: item.product.cost_price,
        reference_type: 'sales_invoice', reference_id: inv.id,
      })
    }

    setLastInvoice({ ...inv, items: cart })
    setCart([]); setCustomerId(''); setBookNum(''); setDiscountTotal(0); setPaidAmount(0); setNotes('')
    setShowSuccess(true)
    toast.success('تم حفظ الفاتورة ✓')
    setSaving(false)
  }

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">

      {/* Left: Products */}
      <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-l border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h1 className="font-bold text-slate-800 mb-3">نقطة البيع</h1>
          <div className="relative">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن منتج..." className="input pr-9 h-9 text-sm" autoFocus />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {search && filteredProducts.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-8">لا توجد نتائج</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {(search ? filteredProducts : products.slice(0, 40)).map(p => (
              <button key={p.id} onClick={() => addToCart(p)}
                className="card p-3 text-right hover:border-blue-300 hover:shadow-md transition-all active:scale-95">
                <p className="text-xs font-mono text-slate-400 mb-1">{p.sku}</p>
                <p className="text-sm font-semibold text-slate-800 leading-tight line-clamp-2">{p.name_ar || p.name}</p>
                <p className="text-sm font-bold text-blue-700 mt-1">{fmtCurrency(p.unit_price)}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-full md:w-80 lg:w-96 flex flex-col bg-white border-slate-200 overflow-hidden">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart size={16} className="text-slate-500" />
            <span className="font-semibold text-slate-700 text-sm">الفاتورة</span>
            <span className="badge-blue">{cart.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)} className="input h-8 text-xs bg-white">
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name_ar || w.name}</option>)}
            </select>
            <select value={channel} onChange={e => setChannel(e.target.value)} className="input h-8 text-xs bg-white">
              {SALES_CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="input h-8 text-xs bg-white">
              <option value="">عميل عام</option>
              {useStore.getState().customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input value={bookNum} onChange={e => setBookNum(e.target.value)} placeholder="رقم الدفتر" className="input h-8 text-xs" />
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0
            ? <div className="flex flex-col items-center py-12 text-slate-300"><ShoppingCart size={32} /><p className="text-sm mt-2">السلة فارغة</p></div>
            : cart.map(item => (
              <div key={item.product.id} className="bg-slate-50 rounded-xl p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">{item.product.name_ar || item.product.name}</p>
                    <input type="number" value={item.price} onChange={e => updatePrice(item.product.id, Number(e.target.value))}
                      className="mt-1 w-full border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-400" min="0" />
                  </div>
                  <button onClick={() => removeItem(item.product.id)} className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0">
                    <X size={14} />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQty(item.product.id, -1)}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100"><Minus size={10} /></button>
                    <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.product.id, 1)}
                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100"><Plus size={10} /></button>
                  </div>
                  <span className="text-sm font-bold text-blue-700">{fmtCurrency(item.qty * item.price)}</span>
                </div>
              </div>
            ))
          }
        </div>

        {/* Totals */}
        <div className="border-t border-slate-100 p-4 space-y-3">
          <div className="flex justify-between text-sm"><span className="text-slate-500">المجموع</span><span className="font-mono">{fmtCurrency(subtotal)}</span></div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 whitespace-nowrap">خصم</span>
            <input type="number" value={discountTotal} onChange={e => setDiscountTotal(Number(e.target.value))}
              className="input h-8 text-sm font-mono text-left" min="0" dir="ltr" />
          </div>
          <div className="flex justify-between font-bold"><span>الإجمالي</span><span className="text-blue-700 font-mono">{fmtCurrency(total)}</span></div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 whitespace-nowrap">المدفوع</span>
            <input type="number" value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))}
              className="input h-8 text-sm font-mono text-left" min="0" dir="ltr" />
          </div>
          {remaining > 0 && <div className="flex justify-between text-sm text-red-600 font-semibold"><span>المتبقي</span><span className="font-mono">{fmtCurrency(remaining)}</span></div>}
          <button onClick={handleConfirm} disabled={saving || cart.length === 0}
            className="btn-primary w-full py-3">
            {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check size={16} />تأكيد الفاتورة</>}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-1">تم الحفظ!</h3>
            <p className="text-slate-500 text-sm mb-4">رقم الفاتورة: <span className="font-mono font-bold">{lastInvoice?.invoice_number}</span></p>
            <div className="text-sm space-y-1 text-right bg-slate-50 rounded-xl p-3 mb-4">
              <div className="flex justify-between"><span className="text-slate-500">الإجمالي</span><span className="font-bold">{fmtCurrency(lastInvoice?.total_amount)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">المدفوع</span><span className="font-bold text-emerald-600">{fmtCurrency(lastInvoice?.paid_amount)}</span></div>
              {lastInvoice?.total_amount - lastInvoice?.paid_amount > 0 && (
                <div className="flex justify-between"><span className="text-slate-500">المتبقي</span><span className="font-bold text-red-600">{fmtCurrency(lastInvoice?.total_amount - lastInvoice?.paid_amount)}</span></div>
              )}
            </div>
            <button onClick={() => setShowSuccess(false)} className="btn-primary w-full">فاتورة جديدة</button>
          </div>
        </div>
      )}
    </div>
  )
}
