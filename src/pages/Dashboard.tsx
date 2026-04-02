import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { fmtCurrency, fmt } from '@/lib/utils'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, Package, AlertTriangle, Users, ShoppingCart, Warehouse, ArrowUpRight } from 'lucide-react'

interface KPIs {
  todayRevenue: number; todayInvoices: number; todayCost: number
  totalProducts: number; lowStock: number; totalCustomers: number
  totalEmployees: number; totalWarehouses: number; inventoryValue: number
}

const empty: KPIs = {
  todayRevenue: 0, todayInvoices: 0, todayCost: 0,
  totalProducts: 0, lowStock: 0, totalCustomers: 0,
  totalEmployees: 0, totalWarehouses: 0, inventoryValue: 0
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [kpis, setKpis] = useState<KPIs>(empty)
  const [weeklyChart, setWeeklyChart] = useState<any[]>([])
  const [channelChart, setChannelChart] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const bid = profile?.business_id
  const canSeeCosts = profile?.role === 'owner' || profile?.role === 'accountant'

  useEffect(() => { if (bid) load() }, [bid])

  async function load() {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const week = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

    const [prodRes, whRes, custRes, empRes, stockRes, todayRes, weekRes] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact' }).eq('business_id', bid!).is('deleted_at', null),
      supabase.from('warehouses').select('id', { count: 'exact' }).eq('business_id', bid!).eq('is_active', true),
      supabase.from('customers').select('id', { count: 'exact' }).eq('business_id', bid!).eq('is_active', true),
      supabase.from('employees').select('id', { count: 'exact' }).eq('business_id', bid!).eq('is_active', true),
      supabase.from('stock').select('quantity, product:products(cost_price, min_stock)').eq('business_id', bid!),
      supabase.from('sales_invoices').select('total_amount, sales_channel').eq('business_id', bid!).eq('invoice_date', today).eq('status', 'confirmed'),
      supabase.from('sales_invoices').select('invoice_date, total_amount, sales_channel').eq('business_id', bid!).eq('status', 'confirmed').gte('invoice_date', week),
    ])

    let inventoryValue = 0, lowStock = 0
    for (const row of (stockRes.data ?? []) as any[]) {
      inventoryValue += Number(row.quantity) * Number(row.product?.cost_price ?? 0)
      if (Number(row.quantity) <= Number(row.product?.min_stock ?? 0)) lowStock++
    }

    const todayRevenue = (todayRes.data ?? []).reduce((s: number, r: any) => s + Number(r.total_amount), 0)

    // Weekly chart
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    const grouped: Record<string, number> = {}
    for (const r of (weekRes.data ?? []) as any[]) {
      grouped[r.invoice_date] = (grouped[r.invoice_date] ?? 0) + Number(r.total_amount)
    }
    const chart = Object.entries(grouped).map(([date, revenue]) => ({
      day: dayNames[new Date(date).getDay()], revenue
    }))
    setWeeklyChart(chart.length ? chart : dayNames.slice(-5).map(d => ({ day: d, revenue: 0 })))

    // Channel chart
    const channels: Record<string, number> = {}
    for (const r of (weekRes.data ?? []) as any[]) {
      channels[r.sales_channel] = (channels[r.sales_channel] ?? 0) + 1
    }
    setChannelChart(Object.entries(channels).map(([name, count]) => ({ name, count })))

    setKpis({
      todayRevenue, todayInvoices: todayRes.data?.length ?? 0, todayCost: 0,
      totalProducts: prodRes.count ?? 0, lowStock,
      totalCustomers: custRes.count ?? 0, totalEmployees: empRes.count ?? 0,
      totalWarehouses: whRes.count ?? 0, inventoryValue,
    })
    setLoading(false)
  }

  const Stat = ({ label, value, sub, icon: Icon, color, bg }: any) => (
    <div className="card p-4 flex items-start justify-between">
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        {loading
          ? <div className="h-7 w-28 bg-slate-100 rounded-lg animate-pulse mt-1.5" />
          : <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        }
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      </div>
      <div className={`${bg} p-2.5 rounded-xl`}>
        <Icon size={20} className={color} />
      </div>
    </div>
  )

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">
          مرحباً، {profile?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="إيرادات اليوم" value={fmtCurrency(kpis.todayRevenue)}
          sub={`${kpis.todayInvoices} فاتورة`} icon={TrendingUp}
          color="text-emerald-600" bg="bg-emerald-50" />
        <Stat label="قيمة المخزون" value={canSeeCosts ? fmtCurrency(kpis.inventoryValue) : '---'}
          sub={`${kpis.totalProducts} منتج`} icon={Package}
          color="text-blue-600" bg="bg-blue-50" />
        <Stat label="تنبيهات" value={fmt(kpis.lowStock)}
          sub="منتج تحت الحد الأدنى" icon={AlertTriangle}
          color={kpis.lowStock > 0 ? 'text-red-600' : 'text-slate-400'}
          bg={kpis.lowStock > 0 ? 'bg-red-50' : 'bg-slate-100'} />
        <Stat label="العملاء" value={fmt(kpis.totalCustomers)}
          sub={`${kpis.totalWarehouses} مستودع`} icon={Users}
          color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Revenue */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700 text-sm">المبيعات — آخر 7 أيام</h2>
            <span className="text-xs text-slate-400">ج.م</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={weeklyChart}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fontFamily: 'Cairo' }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number) => [fmtCurrency(v), 'الإيرادات']}
                contentStyle={{ fontFamily: 'Cairo', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-700 text-sm mb-4">نظرة سريعة</h2>
          <div className="space-y-3">
            {[
              { label: 'المنتجات', val: kpis.totalProducts, icon: Package, c: 'text-blue-600' },
              { label: 'العملاء', val: kpis.totalCustomers, icon: Users, c: 'text-purple-600' },
              { label: 'الموظفين', val: kpis.totalEmployees, icon: Users, c: 'text-emerald-600' },
              { label: 'المستودعات', val: kpis.totalWarehouses, icon: Warehouse, c: 'text-amber-600' },
              { label: 'فواتير اليوم', val: kpis.todayInvoices, icon: ShoppingCart, c: 'text-rose-600' },
            ].map(({ label, val, icon: Icon, c }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-2">
                  <Icon size={14} className={c} />
                  <span className="text-sm text-slate-600">{label}</span>
                </div>
                {loading
                  ? <div className="h-4 w-8 bg-slate-100 rounded animate-pulse" />
                  : <span className="font-bold text-slate-800">{fmt(val)}</span>
                }
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Channel Chart */}
      {channelChart.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-700 text-sm mb-4">قنوات البيع — آخر 7 أيام</h2>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={channelChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontFamily: 'Cairo', borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} name="عدد الفواتير" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
