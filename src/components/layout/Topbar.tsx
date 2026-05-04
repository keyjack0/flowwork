'use client'

import { Bell, Download } from 'lucide-react'
import toast from 'react-hot-toast'

interface TopbarProps {
  title: string
  action?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
}

export default function Topbar({ title, action }: TopbarProps) {
  function handleExport() {
    toast.success('Export berhasil diunduh!')
  }

  return (
    <div className="bg-white border-b border-gray-100 px-6 h-14 flex items-center gap-2 flex-shrink-0">
      <h1 className="text-[15px] font-semibold text-gray-800 flex-1">{title}</h1>
      <div className="flex items-center gap-2">
        {/* <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download size={13} />
          Export
        </button> */}
        {action && (
          <button
            onClick={action.onClick}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-primary rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            {action.icon}
            {action.label}
          </button>
        )}
      </div>
      <div>
        <button className="flex items-center gap-2 w-full px-2 py-2 text-[12px] stroke text-primary hover:bg-gray-100 rounded-lg  border border-gray-200 transition-colors">
            <Bell size={14} />
          </button>
      </div>
    </div>
  )
}
