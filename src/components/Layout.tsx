import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/store/useStore'
import { ROLES } from '@/lib/utils'
import {
  LayoutDashboard, Package, ShoppingCart, Calculator,
  Users, Warehouse, Ship, AlertTriangle, LogOut,
  Menu, X, ChevronLeft, Bell, Settings
} from 'lucide-react'

const NAV = [
  { path: '/dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { path: '/inventory', label: 'المخزون', icon: Package },
  { path: '/pos', label: 'نقطة البيع', icon: ShoppingCart },
  { path: '/warehouse', label: 'المستودع', icon: Warehouse },
  { path: '/accounting', label: 'المحاسبة', icon: Calculator },
  { path: '/hr', label: 'الموارد البشرية', icon: Users },
  { path: '/imports', label: 'الاستيراد', icon: Ship },
  { path: '/damage', label: 'التالف', icon: AlertTriangle },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth()
  const { loadMasterData } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Load all master data once when layout mounts
  useEffect(() => {
    if (profile?.business_id) loadMasterData(profile.business_id)
  }, [profile?.business_id])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const currentPage = NAV.find(n => location.pathname.startsWith(n.path))

  function SidebarContent() {
    return (
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-4 border-b border-slate-800 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-white text-sm">N</div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-white font-bold text-sm leading-tight">Nexus ERP</p>
              <p className="text-slate-500 text-xs truncate">Touch Home Gallery</p>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative
                ${collapsed ? 'justify-center' : ''}
                ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
              {/* Tooltip when collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs rounded-lg
                  opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-slate-700">
                  {label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-slate-800 p-2">
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{profile?.full_name?.charAt(0) ?? 'U'}</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{profile?.full_name}</p>
                <p className="text-slate-500 text-xs">{ROLES[profile?.role ?? ''] ?? ''}</p>
              </div>
            )}
            {!collapsed && (
              <button onClick={handleSignOut} title="تسجيل الخروج"
                className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-slate-800">
                <LogOut size={15} />
              </button>
            )}
          </div>
          {collapsed && (
            <button onClick={handleSignOut}
              className="w-full flex justify-center p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors mt-1">
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col bg-slate-900 flex-shrink-0 transition-all duration-200 ${collapsed ? 'w-[60px]' : 'w-56'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-56 bg-slate-900 flex flex-col z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
              onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </button>
            <button className="hidden lg:flex p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
              onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
            </button>
            <h1 className="text-sm font-semibold text-slate-700">
              {currentPage?.label ?? 'Nexus ERP'}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
              <Bell size={18} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
