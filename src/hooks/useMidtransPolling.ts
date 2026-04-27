'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type TransactionStatus = 'pending' | 'success' | 'failed' | 'expired' | null

interface UseMidtransPollingOptions {
  onSuccess?: (orderId: string) => void
  onFailed?: (orderId: string) => void
  onExpired?: (orderId: string) => void
  intervalMs?: number
  maxAttempts?: number
}

export function useMidtransPolling(options: UseMidtransPollingOptions = {}) {
  const {
    onSuccess,
    onFailed,
    onExpired,
    intervalMs = 3000,
    maxAttempts = 60, // 3 menit maksimal
  } = options

  const [orderId, setOrderId] = useState<string | null>(null)
  const [status, setStatus] = useState<TransactionStatus>(null)
  const [attempts, setAttempts] = useState(0)
  const [isPolling, setIsPolling] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPolling(false)
    setOrderId(null)
    setAttempts(0)
  }, [])

  const startPolling = useCallback((id: string) => {
    setOrderId(id)
    setStatus('pending')
    setAttempts(0)
    setIsPolling(true)
  }, [])

  useEffect(() => {
    if (!orderId || !isPolling) return

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/midtrans/status?orderId=${orderId}`)
        const data = await res.json()

        setAttempts(prev => {
          const next = prev + 1
          if (next >= maxAttempts) {
            stopPolling()
            setStatus('expired')
            onExpired?.(orderId)
          }
          return next
        })

        if (data.status === 'success') {
          setStatus('success')
          stopPolling()
          onSuccess?.(orderId)
        } else if (data.status === 'failed') {
          setStatus('failed')
          stopPolling()
          onFailed?.(orderId)
        } else if (data.status === 'expired') {
          setStatus('expired')
          stopPolling()
          onExpired?.(orderId)
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }

    intervalRef.current = setInterval(checkStatus, intervalMs)
    // Check immediately
    checkStatus()

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [orderId, isPolling])

  return { startPolling, stopPolling, status, isPolling, attempts }
}
