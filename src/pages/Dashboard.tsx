import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  Package, TrendingUp, AlertTriangle, Users,
  ShoppingCart, Warehouse, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

interface KPIs {
  totalProducts: number
  totalInventoryValue: number
  todayRevenue: number
  todayInvoices: number
  lowStockCount: number
  totalCustomers: number
  totalEmployees: number
  totalWarehouses: number
}

const emptyKPIs: KPIs = {
  totalProducts: 0,
  totalInventoryValue: 0,
  todayRevenue: 0,
  todayInvoices: 0,
  lowStockCount: 0,
  totalCustomers: 0,
  totalEmployees: 0,
  totalWarehouses: 0,
}

// placeholder chart data until real data exists
const chartPlaceholder = [
  { day: 'السبت', revenue: 0 },
  { day: 'الأحد', revenue: 0 },
  { day: 'الاثنين', revenue: 0 },
  { day: 'الثلاثاء', revenue: 0 },
  { day: 'الأربعاء', revenue: 0 },
  { day: 'الخميس', revenue: 0 },
  { day: 'الجمعة', revenue: 0 },
]

function formatCurrency(n: number) {
  return new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n) + ' ج.م'
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [kpis, setKpis] = useState<KPIs>(emptyKPIs)
  const [loading, setLoading] = useState(true)
  const [weeklyData, setWeeklyData] = useState(chartPlaceholder)

  useEffect(() => {
    loadKPIs()
  }, [profile])

  async function loadKPIs() {
    if (!profile?.business_id) { setLoading(false); return }
    const bid = profile.business_id
    const today = new Date().toISOString().split('T')[0]

    const [
      productsRes,
      warehousesRes,
      customersRes,
      employeesRes,
      todayInvoicesRes,
      stockRes,
      weekRes,
    ] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact' }).eq('business_id', bid).is('deleted_at', null),
      supabase.from('warehouses').select('id', { count: 'exact' }).eq('business_id', bid).eq('is_active', true),
      supabase.from('customers').select('id', { count: 'exact' }).eq('business_id', bid).eq('is_active', true),
      supabase.from('employees').select('id', { count: 'exact' }).eq('business_id', bid).eq('is_active', true),
      supabase.from('sales_invoices').select('total_amount').eq('business_id', bid).eq('invoice_date', today).eq('status', 'confirmed'),
      supabase.from('stock').select('quantity, product:products(cost_price, min_stock)').eq('business_id', bid),
      supabase.from('sales_invoices')
        .select('invoice_date, total_amount')
        .eq('business_id', bid)
        .eq('status', 'confirmed')
        .gte('invoice_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
    ])

    // calculate inventory value & low stock
    let inventoryValue = 0
    let lowStockCount = 0
    if (stockRes.data) {
      for (const row of stockRes.data as any[]) {
        const costPrice = row.product?.cost_price ?? 0
        const minStock = row.product?.min_stock ?? 0
        inventoryValue += row.quantity * costPrice
        if (row.quantity <= minStock && row.quantity >= 0) lowStockCount++
      }
    }

    // today revenue
    const todayRevenue = todayInvoicesRes.data?.reduce((s: number, i: any) => s + (i.total_amount ?? 0), 0) ?? 0
    const todayInvoices = todayInvoicesRes.data?.length ?? 0

    // weekly chart
    if (weekRes.data && weekRes.data.length > 0) {
      const grouped: Record<string, number> = {}
      for (const inv of weekRes.data as any[]) {
        const d = inv.invoice_date
        grouped[d] = (grouped[d] ?? 0) + (inv.total_amount ?? 0)
      }
      const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
      const chart = Object.entries(grouped).map(([date, revenue]) => ({
        day: days[new Date(date).getDay()],
        revenue,
      }))
      if (chart.length > 0) setWeeklyData(chart)
    }

    setKpis({
      totalProducts: productsRes.count ?? 0,
      totalInventoryValue: inventoryValue,
      todayRevenue,
      todayInvoices,
      lowStockCount,
      totalCustomers: customersRes.count ?? 0,
      totalEmployees: employeesRes.count ?? 0,
      totalWarehouses: warehousesRes.count ?? 0,
    })
    setLoading(false)
  }

  const canSeeCosts = profile?.role === 'owner' || profile?.role === 'accountant'

  const cards = [
    {
      label: 'إيرادات اليوم',
      value: formatCurrency(kpis.todayRevenue),
      sub: `${kpis.todayInvoices} فاتورة`,
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600',
      iconBg: 'bg-green-100',
      show: true,
    },
    {
      label: 'قيمة المخزون',
      value: canSeeCosts ? formatCurrency(kpis.totalInventoryValue) : '---',
      sub: `${kpis.totalProducts} منتج`,
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
      iconBg: 'bg-blue-100',
      show: true,
    },
    {
      label: 'تنبيهات المخزون',
      value: kpis.lowStockCount.toString(),
      sub: 'منتج تحت الحد الأدنى',
      icon: AlertTriangle,
      color: kpis.lowStockCount > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500',
      iconBg: kpis.lowStockCount > 0 ? 'bg-red-100' : 'bg-gray-100',
      show: true,
    },
    {
      label: 'العملاء',
      value: kpis.totalCustomers.toString(),
      sub: `${kpis.totalWarehouses} مستودع`,
      icon: Users,
      color: 'bg-purple-50 text-purple-600',
      iconBg: 'bg-purple-100',
      show: true,
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-arabic">
          مرحباً، {profile?.full_name?.split(' ')[0] ?? 'مستخدم'} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1 font-arabic">
          {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, sub, icon: Icon, color, iconBg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 font-arabic">{label}</p>
                {loading ? (
                  <div className="h-7 w-24 bg-gray-200 rounded animate-pulse mt-1" />
                ) : (
                  <p className={`text-2xl font-bold mt-1 ${color.split(' ')[1]}`}>{value}</p>
                )}
                <p className="text-xs text-gray-400 mt-1 font-arabic">{sub}</p>
              </div>
              <div className={`${iconBg} p-2.5 rounded-xl`}>
                <Icon size={20} className={color.split(' ')[1]} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 font-arabic">المبيعات — آخر 7 أيام</h2>
            <span className="text-xs text-gray-400 font-arabic">جنيه مصري</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fontFamily: 'Cairo' }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v), 'الإيرادات']}
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontFamily: 'Cairo' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="font-semibold text-gray-800 font-arabic mb-4">نظرة عامة</h2>
          <div className="space-y-3">
            {[
              { label: 'المنتجات', value: kpis.totalProducts, icon: Package, color: 'text-blue-600' },
              { label: 'العملاء', value: kpis.totalCustomers, icon: Users, color: 'text-purple-600' },
              { label: 'الموظفين', value: kpis.totalEmployees, icon: Users, color: 'text-green-600' },
              { label: 'المستودعات', value: kpis.totalWarehouses, icon: Warehouse, color: 'text-amber-600' },
              { label: 'فواتير اليوم', value: kpis.todayInvoices, icon: ShoppingCart, color: 'text-rose-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <Icon size={15} className={color} />
                  <span className="text-sm text-gray-600 font-arabic">{label}</span>
                </div>
                {loading
                  ? <div className="h-4 w-8 bg-gray-200 rounded animate-pulse" />
                  : <span className="font-semibold text-gray-800">{value}</span>
                }
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
