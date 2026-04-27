'use client'

import { useState } from 'react'
import { TrendingUp, Target, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { Recipe, ProfitSimulation, OpexConfig } from '@/types/hpp'
import { formatRupiah } from '@/lib/utils'

interface Props {
  recipes: Recipe[]
  opex: OpexConfig
  selectedRecipe?: Recipe | null
}

function calcSimulation(sellPrice: number, recipe: Recipe, opex: OpexConfig): ProfitSimulation {
  const hpp = recipe.totalHPP
  const rawHPP = recipe.totalIngredientCost + recipe.totalAddonCost
  const grossProfit = sellPrice - rawHPP
  const netProfit = sellPrice - hpp
  const grossMarginPct = sellPrice > 0 ? Math.round((grossProfit / sellPrice) * 100) : 0
  const netMarginPct = sellPrice > 0 ? Math.round((netProfit / sellPrice) * 100) : 0
  const bepPortions = netProfit > 0 ? Math.ceil(opex.totalMonthlyOpex / netProfit) : 0
  const bepRevenue = bepPortions * sellPrice
  return { sellPrice, hpp, grossProfit, netProfit, grossMarginPct, netMarginPct, bepPortions, bepRevenue }
}

function MarginIndicator({ pct, label }: { pct: number; label: string }) {
  const color = pct >= 30 ? '#22C55E' : pct >= 15 ? '#F59E0B' : '#EF4444'
  const bg = pct >= 30 ? 'rgba(34,197,94,0.08)' : pct >= 15 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)'
  const Icon = pct >= 30 ? CheckCircle2 : pct >= 15 ? AlertTriangle : XCircle
  return (
    <div className="rounded-xl p-4 border" style={{ background: bg, borderColor: color + '40' }}>
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} style={{ color }} />
        <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color }}>{label}</span>
      </div>
      <div className="text-[28px] font-bold" style={{ color }}>{pct}%</div>
      <div className="text-[11px] text-gray-400 mt-1">
        {pct >= 30 ? '✅ Margin sehat' : pct >= 15 ? '⚠️ Margin cukup' : '❌ Terlalu tipis'}
      </div>
    </div>
  )
}

export default function ProfitSimulator({ recipes, opex, selectedRecipe: initialRecipe }: Props) {
  const [selectedId, setSelectedId] = useState<string>(initialRecipe?.id || recipes[0]?.id || '')
  const [sellPrice, setSellPrice] = useState('')

  const recipe = recipes.find(r => r.id === selectedId) || recipes[0]
  const price = parseInt(sellPrice.replace(/\D/g, '')) || 0
  const sim = recipe && price > 0 ? calcSimulation(price, recipe, opex) : null

  const suggestedPrices = recipe ? [
    { label: '25% margin', price: Math.ceil(recipe.totalHPP / 0.75 / 1000) * 1000 },
    { label: '30% margin', price: Math.ceil(recipe.totalHPP / 0.70 / 1000) * 1000 },
    { label: '40% margin', price: Math.ceil(recipe.totalHPP / 0.60 / 1000) * 1000 },
    { label: '50% margin', price: Math.ceil(recipe.totalHPP / 0.50 / 1000) * 1000 },
  ] : []

  if (recipes.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <TrendingUp size={32} className="mx-auto mb-2 opacity-30" />
        <div className="text-[14px] font-medium mb-1">Belum ada resep</div>
        <div className="text-[12px]">Buat resep di tab "Pembangun Resep" terlebih dahulu</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <div className="text-[14px] font-bold text-gray-800 mb-1">Simulator Profitabilitas</div>
        <div className="text-[12px] text-gray-400">Simulasikan harga jual dan lihat dampaknya terhadap profit</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Input */}
        <div className="space-y-4">
          {/* Pilih Resep */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <label className="label">Pilih Resep</label>
            <select value={selectedId} onChange={e => { setSelectedId(e.target.value); setSellPrice('') }} className="input-field mb-3">
              {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>

            {recipe && (
              <div className="space-y-1.5">
                {[
                  { label: 'HPP Bahan & Packaging', value: recipe.totalIngredientCost + recipe.totalAddonCost },
                  { label: 'OPEX per Porsi', value: opex.opexPerPortion },
                  { label: 'Total HPP per Porsi', value: recipe.totalHPP, bold: true },
                ].map(row => (
                  <div key={row.label} className={`flex justify-between text-[12px] ${row.bold ? 'font-bold pt-1 border-t border-gray-100 text-gray-800' : 'text-gray-500'}`}>
                    <span>{row.label}</span>
                    <span className={row.bold ? 'text-[#685AFF]' : ''}>{formatRupiah(row.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input Harga Jual */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <label className="label">Rencana Harga Jual (Rp)</label>
            <div className="relative mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-bold text-gray-400">Rp</span>
              <input
                type="text"
                value={sellPrice}
                onChange={e => {
                  const num = e.target.value.replace(/\D/g, '')
                  setSellPrice(num ? parseInt(num).toLocaleString('id-ID') : '')
                }}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 text-[18px] font-bold border-2 border-gray-200 rounded-xl focus:border-[#685AFF] focus:outline-none text-right"
              />
            </div>

            {/* Suggested prices */}
            <div className="text-[11px] font-semibold text-gray-400 uppercase mb-2">Saran Harga</div>
            <div className="grid grid-cols-2 gap-1.5">
              {suggestedPrices.map(s => (
                <button key={s.label} onClick={() => setSellPrice(s.price.toLocaleString('id-ID'))}
                  className="py-2 px-3 text-left bg-gray-50 hover:bg-[rgba(104,90,255,0.06)] rounded-lg border border-gray-100 hover:border-[rgba(104,90,255,0.2)] transition-all">
                  <div className="text-[10px] text-gray-400">{s.label}</div>
                  <div className="text-[12px] font-bold text-gray-700">{formatRupiah(s.price)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {!sim ? (
            <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-gray-400">
              <TrendingUp size={32} className="mx-auto mb-2 opacity-30" />
              <div className="text-[13px]">Masukkan harga jual untuk melihat simulasi</div>
            </div>
          ) : (
            <>
              {/* Margin indicators */}
              <div className="grid grid-cols-2 gap-3">
                <MarginIndicator pct={sim.grossMarginPct} label="Laba Kotor" />
                <MarginIndicator pct={sim.netMarginPct} label="Laba Bersih" />
              </div>

              {/* Profit Detail */}
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="text-[12px] font-bold text-gray-600 uppercase tracking-wide mb-3">Rincian Profit</div>
                <div className="space-y-2.5">
                  {[
                    { label: 'Harga Jual', value: sim.sellPrice, color: 'text-gray-800' },
                    { label: 'HPP Total', value: -sim.hpp, color: 'text-red-500' },
                    { label: 'Laba Kotor (- bahan & packaging)', value: sim.grossProfit, color: sim.grossProfit >= 0 ? 'text-green-600' : 'text-red-500' },
                    { label: 'Laba Bersih (- OPEX)', value: sim.netProfit, color: sim.netProfit >= 0 ? 'text-green-700' : 'text-red-600', bold: true },
                  ].map(row => (
                    <div key={row.label} className={`flex justify-between text-[12px] pb-2 border-b border-gray-50 last:border-0 ${row.bold ? 'font-bold text-[13px]' : ''}`}>
                      <span className="text-gray-500">{row.label}</span>
                      <span className={row.color}>{row.value < 0 ? '- ' + formatRupiah(-row.value) : formatRupiah(row.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* BEP */}
              <div className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={14} className="text-[#685AFF]" />
                  <div className="text-[12px] font-bold text-gray-600 uppercase tracking-wide">Break Even Point (BEP)</div>
                </div>
                {sim.netProfit <= 0 ? (
                  <div className="p-3 bg-red-50 rounded-lg text-[12px] text-red-600">
                    ❌ Harga jual lebih rendah dari HPP. Tidak bisa mencapai BEP.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="p-3 bg-[rgba(104,90,255,0.06)] rounded-lg text-center">
                        <div className="text-[22px] font-bold text-[#685AFF]">{sim.bepPortions}</div>
                        <div className="text-[11px] text-gray-400">porsi/bulan</div>
                      </div>
                      <div className="p-3 bg-[rgba(104,90,255,0.06)] rounded-lg text-center">
                        <div className="text-[16px] font-bold text-[#685AFF]">{formatRupiah(sim.bepRevenue)}</div>
                        <div className="text-[11px] text-gray-400">omzet BEP</div>
                      </div>
                    </div>
                    <div className="text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-lg">
                      Harus jual minimal <strong>{sim.bepPortions} porsi/bulan</strong> untuk menutup semua biaya operasional sebesar {formatRupiah(opex.totalMonthlyOpex)}/bulan.
                      {opex.targetPortionsPerMonth > 0 && (
                        <span className={` ml-1 font-semibold ${sim.bepPortions <= opex.targetPortionsPerMonth ? 'text-green-600' : 'text-red-500'}`}>
                          {sim.bepPortions <= opex.targetPortionsPerMonth
                            ? `✅ Target ${opex.targetPortionsPerMonth} porsi sudah di atas BEP.`
                            : `⚠️ Target ${opex.targetPortionsPerMonth} porsi belum cukup untuk BEP!`}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
