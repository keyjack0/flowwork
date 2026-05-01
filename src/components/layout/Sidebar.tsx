'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Monitor,
  Package,
  Calculator,
  TrendingUp,
  FileText,
  Zap,
  LogOut,
  Bell,
  Settings,
  User
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'


const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Utama' },
  { href: '/kasir', label: 'Kasir (POS)', icon: Monitor, section: 'Utama' },
  { href: '/stok', label: 'Manajemen Stok', icon: Package, section: 'Manajemen' },
  { href: '/hpp', label: 'Kalkulator HPP', icon: Calculator, section: 'Manajemen' },
  { href: '/keuangan', label: 'Laporan Keuangan', icon: TrendingUp, section: 'Manajemen' },
  { href: '/pengeluaran', label: 'Pengeluaran', icon: FileText, section: 'Manajemen' },

]


interface SidebarProps {
  userName?: string
  userRole?: string
}

export default function Sidebar({ userName = 'User', userRole = 'Kasir' }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [lowStockCount, setLowStockCount] = useState(0)

  const sections = ['Utama', 'Manajemen']

  useEffect(() => {
    const fetchLowStock = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('products')
        .select('stock, min_stock_alert')
        .eq('is_active', true)

      if (data) {
        const count = data.filter(p => p.stock > 0 && p.stock <= p.min_stock_alert).length
        setLowStockCount(count)
      }
    }
    fetchLowStock()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-[220px] bg-white border-r border-gray-100 flex flex-col flex-shrink-0 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#685AFF] rounded-[10px] flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-white fill-white" />
        </div>
        <div>
          <div className="text-[15px] font-bold text-[#685AFF] leading-tight">Flowwork</div>
          <div className="text-[10px] text-gray-400">Manajemen Bisnis</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {sections.map(section => {
          const items = navItems.filter(i => i.section === section)
          return (
            <div key={section} className="mb-2">
              <div className="px-2 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {section}
              </div>
              {items.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium mb-0.5 transition-all',
                      isActive
                        ? 'bg-[rgba(104,90,255,0.08)] text-[#685AFF]'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                    )}
                  >
                    <item.icon size={15} className="flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.href === '/stok' && lowStockCount > 0 && (
                      <span className="text-[10px] font-medium text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-full">
                        {lowStockCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* User */}
      
      <div className="p-3 border-t border-gray-100 relative">

        {/* Dropdown */}
        {open && (
          <div className="absolute bottom-16 left-3 right-3 bg-white border border-gray-100 rounded-xl shadow-lg p-1.5 z-50">

            <button className="flex items-center gap-2 w-full px-3 py-2 text-[12px] hover:bg-gray-100 rounded-lg">
              <User size={14} /> Profile
            </button>

            <button className="flex items-center gap-2 w-full px-3 py-2 text-[12px] hover:bg-gray-100 rounded-lg">
              <Settings size={14} /> Settings
            </button>

              <button className="flex items-center gap-2 w-full px-3 py-2 text-[12px] hover:bg-gray-100 rounded-lg">
            <Bell size={14} /> Notifikasi
          </button>

            <div className="border-t my-1"></div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-red-500 hover:bg-red-100 rounded-lg"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        )}

        {/* User Bar */}
        <div
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 p-2 rounded-lg bg-gray-50 cursor-pointer"
        >
          <div className="w-7 h-7 rounded-full bg-[#685AFF] flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0">
            {userName.split(' ').map(n => n[0]).join('').substring(0, 2)}
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="text-[12px] font-semibold text-gray-800 truncate">{userName}</div>
            <div className="text-[10px] text-gray-400">{userRole}</div>
          </div>

          <svg
            className={cn('w-3 h-3 text-gray-400 transition-transform', open && 'rotate-180')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>

        </div>
      </div>
    </aside>
  )
}
