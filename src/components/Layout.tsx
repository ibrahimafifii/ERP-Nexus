import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard, Package, ShoppingCart, Calculator,
  Users, Warehouse, Ship, AlertTriangle, LogOut,
  Menu, X, ChevronRight, Bell
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: 'الرئيسية', labelEn: 'Dashboard', icon: LayoutDashboard },
  { path: '/inventory', label: 'المخزون', labelEn: 'Inventory', icon: Package },
  { path: '/pos', label: 'نقطة البيع', labelEn: 'POS', icon: ShoppingCart },
  { path: '/warehouse', label: 'المستودع', labelEn: 'Warehouse', icon: Warehouse },
  { path: '/accounting', label: 'المحاسبة', labelEn: 'Accounting', icon: Calculator },
  { path: '/hr', label: 'الموارد البشرية', labelEn: 'HR', icon: Users },
  { path: '/imports', label: 'الاستيراد', labelEn: 'Imports', icon: Ship },
  { path: '/damage', label: 'البضاعة التالفة', labelEn: 'Damage', icon: AlertTriangle },
]

const roleLabels: Record<string, string> = {
  owner: 'المالك',
  manager: 'المدير',
  accountant: 'المحاسب',
  sales: 'المبيعات',
  warehouse: 'المستودع',
  packer: 'التعبئة',
  hr: 'الموارد البشرية',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/50">
        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">N</span>
        </div>
        {sidebarOpen && (
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Nexus ERP</p>
            <p className="text-slate-400 text-xs">Touch Home Gallery</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, label, labelEn, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative
              ${isActive
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:bg-slate-700/60 hover:text-white'
              }`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {sidebarOpen && (
              <span className="font-arabic">{label}</span>
            )}
            {!sidebarOpen && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none">
                {labelEn}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-slate-700/50 p-3">
        <div className={`flex items-center gap-3 px-2 py-2 rounded-lg ${sidebarOpen ? '' : 'justify-center'}`}>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {profile?.full_name?.charAt(0) ?? 'U'}
            </span>
          </div>
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate font-arabic">
                {profile?.full_name ?? 'المستخدم'}
              </p>
              <p className="text-slate-400 text-xs">
                {profile?.role ? roleLabels[profile.role] : ''}
              </p>
            </div>
          )}
          {sidebarOpen && (
            <button
              onClick={handleSignOut}
              className="text-slate-400 hover:text-red-400 transition-colors p-1"
              title="تسجيل الخروج"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
        {!sidebarOpen && (
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center w-full mt-1 p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-700/60"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-slate-900 transition-all duration-300 flex-shrink-0 ${
          sidebarOpen ? 'w-60' : 'w-16'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-60 bg-slate-900 flex flex-col z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            {/* Desktop collapse button */}
            <button
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
              <Bell size={18} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
