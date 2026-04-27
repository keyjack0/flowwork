'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { formatRupiah } from '@/lib/utils'

function PaymentResultContent() {
  const params = useSearchParams()
  const status = params.get('transaction_status') || params.get('status')
  const orderId = params.get('order_id')
  const amount = params.get('gross_amount')

  const isSuccess = status === 'settlement' || status === 'capture' || status === 'success'
  const isPending = status === 'pending'
  const isFailed = !isSuccess && !isPending

  return (
    <div className="min-h-screen bg-[#F7F7FB] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
        {isSuccess && (
          <>
            <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-1">Pembayaran Berhasil!</h2>
            <p className="text-gray-500 text-sm mb-4">Transaksi telah berhasil diproses</p>
          </>
        )}
        {isPending && (
          <>
            <Clock size={56} className="text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-1">Menunggu Pembayaran</h2>
            <p className="text-gray-500 text-sm mb-4">Transaksi masih dalam proses</p>
          </>
        )}
        {isFailed && (
          <>
            <XCircle size={56} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-1">Pembayaran Gagal</h2>
            <p className="text-gray-500 text-sm mb-4">Transaksi tidak berhasil diproses</p>
          </>
        )}

        {orderId && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-left">
            <div className="text-[11px] text-gray-400 mb-1">Order ID</div>
            <div className="font-mono text-[13px] text-gray-700">{orderId}</div>
            {amount && (
              <>
                <div className="text-[11px] text-gray-400 mb-1 mt-2">Total</div>
                <div className="text-[15px] font-bold text-gray-800">{formatRupiah(Number(amount))}</div>
              </>
            )}
          </div>
        )}

        <Link
          href="/kasir"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#685AFF] text-white rounded-xl text-sm font-semibold hover:bg-[#4A3FCC] transition-colors"
        >
          <ArrowLeft size={15} />
          Kembali ke Kasir
        </Link>
      </div>
    </div>
  )
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PaymentResultContent />
    </Suspense>
  )
}
