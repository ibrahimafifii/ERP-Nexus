import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { signIn, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (user) { navigate('/dashboard'); return null }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { error } = await signIn(email, password)
    if (error) { setError(error); setLoading(false) }
    else navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* BG blobs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-700/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative w-full max-w-sm">
        <div className="bg-slate-800/90 backdrop-blur border border-slate-700 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-white font-bold text-2xl">N</span>
            </div>
            <h1 className="text-xl font-bold text-white">Nexus ERP</h1>
            <p className="text-slate-400 text-sm mt-1">Touch Home Gallery</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">البريد الإلكتروني</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm
                  placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">كلمة المرور</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required dir="ltr"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm
                    placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-11"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            {error && <p className="text-red-400 text-sm text-center bg-red-500/10 py-2 px-3 rounded-xl">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full btn-primary py-3 mt-2 bg-blue-600 hover:bg-blue-700 rounded-xl">
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'تسجيل الدخول'
              }
            </button>
          </form>
        </div>
        <p className="text-center text-slate-600 text-xs mt-5">Nexus ERP v2.0 — نظام إدارة الأعمال</p>
      </div>
    </div>
  )
}
