'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Zap, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error, data } = await supabase.auth.signInWithPassword({ email, password })
    console.log('Login result:', { error, data })
    if (error) {
      toast.error('Email atau password salah')
      setLoading(false)
      return
    }
    console.log('Session after login:', await supabase.auth.getSession())
    toast.success('Selamat datang!')
    await new Promise(resolve => setTimeout(resolve, 200))
    const { data: { session } } = await supabase.auth.getSession()
    console.log('Session verified:', session)
    if (session) {
      router.replace('/dashboard')
      router.refresh()
      return
    } else {
      setLoading(false)
      toast.error('Session gagal dibuat, coba lagi')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0EFF8] to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#685AFF] rounded-2xl flex items-center justify-center shadow-lg">
            <Zap size={20} className="text-white fill-white" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#685AFF]">Flowwork</div>
            <div className="text-xs text-gray-400 -mt-0.5">Manajemen Bisnis Terintegrasi</div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Masuk ke akun Anda</h2>
          <p className="text-sm text-gray-500 mb-6">Gunakan email dan password yang terdaftar</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#685AFF] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-[#685AFF] focus:outline-none transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#685AFF] text-white rounded-lg text-sm font-semibold hover:bg-[#4A3FCC] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={15} className="animate-spin" /> Masuk...</> : 'Masuk'}
            </button>
          </form>

          <div className="mt-4 p-3 bg-[rgba(104,90,255,0.06)] rounded-lg">
            <p className="text-xs text-gray-500 font-medium mb-1">Demo Akun:</p>
            <p className="text-xs text-gray-500">Email: <span className="font-mono text-[#685AFF]">demo@flowwork.id</span></p>
            <p className="text-xs text-gray-500">Password: <span className="font-mono text-[#685AFF]">flowwork123</span></p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          &copy; {new Date().getFullYear()} Flowwork. All rights reserved.
        </p>
      </div>
    </div>
  )
}
