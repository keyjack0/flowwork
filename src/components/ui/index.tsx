'use client'

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

// ===== Button =====
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all disabled:opacity-60'
  const variants = {
    primary: 'bg-[#685AFF] text-white hover:bg-[#4A3FCC]',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    ghost: 'text-gray-500 hover:bg-gray-100',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-[12px]',
    md: 'px-4 py-2 text-[13px]',
    lg: 'px-5 py-2.5 text-[14px]',
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  )
}

// ===== Badge =====
interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'gray'
  className?: string
}

export function Badge({ children, variant = 'primary', className }: BadgeProps) {
  const variants = {
    primary: 'bg-[rgba(104,90,255,0.1)] text-[#685AFF]',
    success: 'bg-green-50 text-green-700',
    warning: 'bg-yellow-50 text-yellow-700',
    danger: 'bg-red-50 text-red-700',
    gray: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold', variants[variant], className)}>
      {children}
    </span>
  )
}

// ===== Card =====
export function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('bg-white border border-gray-100 rounded-xl', className)} {...props}>
      {children}
    </div>
  )
}

// ===== Input =====
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div>
      {label && <label className="block text-[12px] font-medium text-gray-500 mb-1.5">{label}</label>}
      <input
        className={cn(
          'w-full px-3 py-2.5 border rounded-lg text-[13px] font-[Poppins] text-gray-800 bg-white transition-all focus:outline-none',
          error ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-[#685AFF]',
          className
        )}
        {...props}
      />
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  )
}

// ===== Select =====
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div>
      {label && <label className="block text-[12px] font-medium text-gray-500 mb-1.5">{label}</label>}
      <select
        className={cn(
          'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-800 bg-white focus:border-[#685AFF] focus:outline-none cursor-pointer',
          className
        )}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

// ===== Table =====
export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse">{children}</table>
    </div>
  )
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn('px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide bg-gray-50 border-b border-gray-100', className)}>
      {children}
    </th>
  )
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn('px-4 py-3 text-[13px] text-gray-700 border-b border-gray-50', className)}>
      {children}
    </td>
  )
}

// ===== Loading Spinner =====
export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={cn('animate-spin text-[#685AFF]', className)} />
}

// ===== Empty State =====
export function EmptyState({ icon, title, description }: { icon?: string; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="text-4xl mb-3">{icon}</div>}
      <div className="text-[14px] font-medium text-gray-600 mb-1">{title}</div>
      {description && <div className="text-[12px] text-gray-400 max-w-xs">{description}</div>}
    </div>
  )
}

// ===== Status Dot =====
export function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    success: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', label: 'Sukses' },
    pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Menunggu' },
    failed: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Gagal' },
    expired: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: 'Expired' },
  }
  const c = configs[status] || configs.pending
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold', c.bg, c.text)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', c.dot)} />
      {c.label}
    </span>
  )
}
