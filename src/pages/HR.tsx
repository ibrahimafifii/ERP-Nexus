import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/store/useStore'
import { supabase } from '@/lib/supabase'
import { fmtCurrency, fmt } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import { Plus, Edit2, Trash2, Users, Phone, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY = { first_name: '', last_name: '', phone: '', position: '', department: '', hire_date: '', base_salary: 0, employee_code: '' }

export default function HR() {
  const { profile } = useAuth()
  const { employees, loadMasterData } = useStore()
  const bid = profile?.business_id
  const canEdit = ['owner', 'manager', 'hr'].includes(profile?.role ?? '')
  const canSeeSalary = ['owner', 'accountant', 'hr'].includes(profile?.role ?? '')

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [showDelete, setShowDelete] = useState<any>(null)
  const [search, setSearch] = useState('')

  function openAdd() { setEditing(null); setForm(EMPTY); setShowForm(true) }
  function openEdit(e: any) {
    setEditing(e)
    setForm({ first_name: e.first_name, last_name: e.last_name, phone: e.phone ?? '', position: e.position ?? '', department: e.department ?? '', hire_date: e.hire_date ?? '', base_salary: e.base_salary, employee_code: e.employee_code ?? '' })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.first_name) { toast.error('الاسم مطلوب'); return }
    setSaving(true)
    const payload = { ...form, base_salary: Number(form.base_salary), business_id: bid }
    const { error } = editing
      ? await supabase.from('employees').update(payload).eq('id', editing.id)
      : await supabase.from('employees').insert(payload)
    if (error) toast.error(error.message)
    else { toast.success(editing ? 'تم التعديل' : 'تمت الإضافة'); setShowForm(false); loadMasterData(bid!) }
    setSaving(false)
  }

  async function handleDelete() {
    await supabase.from('employees').update({ is_active: false, deleted_at: new Date().toISOString() }).eq('id', showDelete.id)
    toast.success('تم الحذف'); setShowDelete(null); loadMasterData(bid!)
  }

  const filtered = employees.filter(e =>
    `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    e.department?.toLowerCase().includes(search.toLowerCase())
  )

  const totalSalaries = employees.reduce((s, e) => s + Number(e.base_salary), 0)

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">الموارد البشرية</h1>
          <p className="text-xs text-slate-500 mt-0.5">{fmt(employees.length)} موظف
            {canSeeSalary && <span className="mr-2">· إجمالي الرواتب: {fmtCurrency(totalSalaries)}</span>}
          </p>
        </div>
        {canEdit && <button onClick={openAdd} className="btn-primary"><Plus size={16} />موظف جديد</button>}
      </div>

      {/* Search */}
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." className="input h-9 text-sm max-w-64" />

      {/* Grid */}
      {filtered.length === 0
        ? <div className="card flex flex-col items-center py-16 text-slate-400"><Users size={36} className="mb-3 opacity-30" /><p className="text-sm">لا يوجد موظفين</p></div>
        : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(emp => (
            <div key={emp.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 font-bold text-sm">{emp.first_name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{emp.first_name} {emp.last_name}</p>
                    <p className="text-xs text-slate-500">{emp.position || '—'}</p>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(emp)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={13} /></button>
                    <button onClick={() => setShowDelete(emp)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
              <div className="mt-3 space-y-1.5">
                {emp.phone && <div className="flex items-center gap-2 text-xs text-slate-500"><Phone size={12} />{emp.phone}</div>}
                {emp.department && <div className="flex items-center gap-2 text-xs text-slate-500"><Briefcase size={12} />{emp.department}</div>}
                {canSeeSalary && <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500">الراتب</span>
                  <span className="text-sm font-bold text-emerald-700">{fmtCurrency(emp.base_salary)}</span>
                </div>}
              </div>
            </div>
          ))}
        </div>
      }

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'تعديل موظف' : 'موظف جديد'}
        footer={<div className="flex gap-2"><button onClick={handleSave} disabled={saving} className="btn-primary flex-1">{saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'حفظ'}</button><button onClick={() => setShowForm(false)} className="btn-secondary">إلغاء</button></div>}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-slate-600 mb-1">الاسم الأول *</label><input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="input" /></div>
            <div><label className="block text-xs font-semibold text-slate-600 mb-1">الاسم الأخير</label><input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className="input" /></div>
          </div>
          <div><label className="block text-xs font-semibold text-slate-600 mb-1">رقم الموظف</label><input value={form.employee_code} onChange={e => setForm({ ...form, employee_code: e.target.value })} className="input" placeholder="EMP-001" /></div>
          <div><label className="block text-xs font-semibold text-slate-600 mb-1">الهاتف</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" dir="ltr" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-slate-600 mb-1">المسمى الوظيفي</label><input value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className="input" /></div>
            <div><label className="block text-xs font-semibold text-slate-600 mb-1">القسم</label><input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="input" /></div>
          </div>
          <div><label className="block text-xs font-semibold text-slate-600 mb-1">تاريخ التعيين</label><input type="date" value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} className="input" /></div>
          <div><label className="block text-xs font-semibold text-slate-600 mb-1">الراتب الأساسي (ج.م)</label><input type="number" value={form.base_salary} onChange={e => setForm({ ...form, base_salary: Number(e.target.value) })} className="input" min="0" /></div>
        </div>
      </Modal>

      <Modal open={!!showDelete} onClose={() => setShowDelete(null)} title="تأكيد الحذف" size="sm"
        footer={<div className="flex gap-2"><button onClick={handleDelete} className="btn-danger flex-1">حذف</button><button onClick={() => setShowDelete(null)} className="btn-secondary flex-1">إلغاء</button></div>}>
        <p className="text-slate-600 text-sm text-center py-2">هيتم حذف "{showDelete?.first_name} {showDelete?.last_name}"</p>
      </Modal>
    </div>
  )
}
