import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/store/useStore'
import { supabase } from '@/lib/supabase'
import { fmtCurrency, fmt, fmtDate } from '@/lib/utils'
import { Calculator, BookOpen, TrendingUp, TrendingDown } from 'lucide-react'

export default function Accounting() {
  const { profile } = useAuth()
  const { accounts } = useStore()
  const bid = profile?.business_id
  const canAccess = ['owner', 'accountant', 'manager'].includes(profile?.role ?? '')

  const [tab, setTab] = useState<'summary'|'accounts'|'entries'>('summary')
  const [invoices, setInvoices] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (bid && canAccess) load() }, [bid])

  async function load() {
    setLoading(true)
    const month = new Date().toISOString().slice(0, 7)
    const [invRes, expRes] = await Promise.all([
      supabase.from('sales_invoices').select('total_amount, paid_amount, invoice_date, status, sales_channel')
        .eq('business_id', bid!).eq('status', 'confirmed')
        .gte('invoice_date', `${month}-01`),
      supabase.from('expenses').select('*').eq('business_id', bid!).gte('expense_date', `${month}-01`),
    ])
    setInvoices(invRes.data ?? [])
    setExpenses(expRes.data ?? [])
    setLoading(false)
  }

  if (!canAccess) return (
    <div className="p-6 flex flex-col items-center justify-center py-20 text-slate-400">
      <Calculator size={40} className="mb-3 opacity-30" />
      <p className="text-sm">ليس لديك صلاحية للوصول للمحاسبة</p>
    </div>
  )

  const totalRevenue = invoices.reduce((s, r) => s + Number(r.total_amount), 0)
  const totalPaid = invoices.reduce((s, r) => s + Number(r.paid_amount), 0)
  const totalExpenses = expenses.reduce((s, r) => s + Number(r.amount), 0)
  const netProfit = totalRevenue - totalExpenses

  const TABS = [{ id: 'summary', label: 'ملخص الشهر' }, { id: 'accounts', label: 'دليل الحسابات' }, { id: 'entries', label: 'المصروفات' }]

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-xl font-bold text-slate-800">المحاسبة</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      {tab === 'summary' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'إجمالي الإيرادات', val: totalRevenue, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'المبالغ المحصّلة', val: totalPaid, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'إجمالي المصروفات', val: totalExpenses, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'صافي الربح', val: netProfit, icon: Calculator, color: netProfit >= 0 ? 'text-emerald-600' : 'text-red-600', bg: netProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
            ].map(({ label, val, icon: Icon, color, bg }) => (
              <div key={label} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-slate-500">{label}</p>
                  <div className={`${bg} p-1.5 rounded-lg`}><Icon size={14} className={color} /></div>
                </div>
                {loading
                  ? <div className="h-6 w-24 bg-slate-100 rounded animate-pulse" />
                  : <p className={`text-xl font-bold ${color}`}>{fmtCurrency(val)}</p>
                }
              </div>
            ))}
          </div>

          {/* Receivables */}
          <div className="card p-4">
            <h2 className="font-semibold text-slate-700 text-sm mb-3">الذمم المدينة (هذا الشهر)</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: totalRevenue > 0 ? `${(totalPaid / totalRevenue) * 100}%` : '0%' }} />
              </div>
              <span className="text-sm font-bold text-slate-700">{totalRevenue > 0 ? Math.round((totalPaid / totalRevenue) * 100) : 0}%</span>
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>المحصّل: {fmtCurrency(totalPaid)}</span>
              <span>المتبقي: {fmtCurrency(totalRevenue - totalPaid)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Accounts */}
      {tab === 'accounts' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-100">
                {['الكود', 'اسم الحساب', 'النوع'].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-semibold text-slate-500">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {accounts.map(acc => {
                  const typeLabel: Record<string, { label: string; cls: string }> = {
                    asset: { label: 'أصول', cls: 'badge-blue' },
                    liability: { label: 'خصوم', cls: 'badge-red' },
                    equity: { label: 'حقوق ملكية', cls: 'badge-yellow' },
                    revenue: { label: 'إيرادات', cls: 'badge-green' },
                    expense: { label: 'مصروفات', cls: 'badge-red' },
                  }
                  const t = typeLabel[acc.account_type] ?? { label: acc.account_type, cls: 'badge-blue' }
                  return (
                    <tr key={acc.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5"><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{acc.account_code}</span></td>
                      <td className="px-4 py-2.5">
                        <p className="text-sm text-slate-800">{acc.account_name_ar}</p>
                        <p className="text-xs text-slate-400">{acc.account_name}</p>
                      </td>
                      <td className="px-4 py-2.5"><span className={t.cls}>{t.label}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expenses */}
      {tab === 'entries' && (
        <div className="space-y-3">
          <div className="card overflow-hidden">
            {expenses.length === 0
              ? <div className="flex flex-col items-center py-12 text-slate-400"><BookOpen size={32} className="mb-3 opacity-30" /><p className="text-sm">لا توجد مصروفات هذا الشهر</p></div>
              : <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="bg-slate-50 border-b border-slate-100">
                  {['التاريخ', 'البند', 'المبلغ'].map(h => (
                    <th key={h} className="text-right px-4 py-3 text-xs font-semibold text-slate-500">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {expenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-xs text-slate-500">{fmtDate(e.expense_date)}</td>
                      <td className="px-4 py-2.5">
                        <p className="text-sm text-slate-800">{e.description || e.category}</p>
                        <p className="text-xs text-slate-400">{e.category}</p>
                      </td>
                      <td className="px-4 py-2.5 font-bold text-red-600 font-mono">{fmtCurrency(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            }
          </div>
        </div>
      )}
    </div>
  )
}
