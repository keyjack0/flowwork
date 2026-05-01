import { useState, useEffect, useCallback } from 'react'
import { OpexConfigDB, OpexSettingsDB } from '@/types/hpp'
import toast from 'react-hot-toast'

export function useOpex() {
  const [configs, setConfigs] = useState<OpexConfigDB[]>([])
  const [settings, setSettings] = useState<OpexSettingsDB | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchConfigs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/opex?type=configs')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setConfigs(data)
    } catch (error: any) {
      toast.error('Gagal memuat OPEX configs: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/opex?type=settings')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSettings(data)
    } catch (error: any) {
      // Ignore error, settings might not exist yet
    }
  }, [])

  const addConfig = useCallback(async (config: Omit<OpexConfigDB, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => {
    try {
      const res = await fetch('/api/opex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'config', ...config }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setConfigs(prev => [...prev, data])
      toast.success('OPEX config berhasil ditambahkan!')
      return data
    } catch (error: any) {
      toast.error('Gagal menambahkan OPEX config: ' + error.message)
      return null
    }
  }, [])

  const updateConfig = useCallback(async (id: string, updates: Partial<OpexConfigDB>) => {
    try {
      const res = await fetch(`/api/opex/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setConfigs(prev => prev.map(c => c.id === id ? data : c))
      toast.success('OPEX config berhasil diupdate!')
      return data
    } catch (error: any) {
      toast.error('Gagal mengupdate OPEX config: ' + error.message)
      return null
    }
  }, [])

  const deleteConfig = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/opex/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setConfigs(prev => prev.filter(c => c.id !== id))
      toast.success('OPEX config berhasil dihapus!')
      return true
    } catch (error: any) {
      toast.error('Gagal menghapus OPEX config: ' + error.message)
      return false
    }
  }, [])

  const updateSettings = useCallback(async (updates: Partial<OpexSettingsDB>) => {
    try {
      const res = await fetch('/api/opex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'settings', ...updates }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSettings(data)
      toast.success('OPEX settings berhasil diupdate!')
      return data
    } catch (error: any) {
      toast.error('Gagal mengupdate OPEX settings: ' + error.message)
      return null
    }
  }, [])

  useEffect(() => {
    fetchConfigs()
    fetchSettings()
  }, [fetchConfigs, fetchSettings])

  return {
    configs,
    settings,
    loading,
    fetchConfigs,
    fetchSettings,
    addConfig,
    updateConfig,
    deleteConfig,
    updateSettings,
  }
}
