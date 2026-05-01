'use client'

import { useState } from 'react'
import { Plus, Trash2, Search, ChefHat, Copy, X, Check, FlaskConical } from 'lucide-react'
import { RawMaterialLegacy as RawMaterial, Recipe, RecipeIngredient, Addon } from '@/types/hpp'
import { formatRupiah, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Props {
  materials: RawMaterial[]
  recipes: Recipe[]
  opexPerPortion: number
  onSave: (recipe: Recipe) => void
  onDelete: (id: string) => void
  onClone: (id: string) => void
  onSelect: (recipe: Recipe) => void
}

const EMPTY_ADDON: Omit<Addon, 'id'> = { name: '', costPerPortion: 0 }
const RECIPE_CATEGORIES = ['Makanan Utama', 'Minuman', 'Snack', 'Dessert', 'Paket', 'Lainnya']

function buildRecipeTotals(ingredients: RecipeIngredient[], addons: Addon[], opexPerPortion: number): Pick<Recipe, 'totalIngredientCost' | 'totalAddonCost' | 'totalHPP'> {
  const totalIngredientCost = Math.round(ingredients.reduce((s, i) => s + i.costPerPortion, 0))
  const totalAddonCost = Math.round(addons.reduce((s, a) => s + a.costPerPortion, 0))
  const totalHPP = totalIngredientCost + totalAddonCost + opexPerPortion
  return { totalIngredientCost, totalAddonCost, totalHPP }
}

export default function RecipeBuilder({ materials, recipes, opexPerPortion, onSave, onDelete, onClone, onSelect }: Props) {
  const [mode, setMode] = useState<'list' | 'edit'>('list')
  const [editRecipe, setEditRecipe] = useState<Partial<Recipe> | null>(null)
  const [matSearch, setMatSearch] = useState('')
  const [showMatDropdown, setShowMatDropdown] = useState(false)

  // Addon temp form
  const [addonForm, setAddonForm] = useState({ name: '', costPerPortion: '' })

  function startNew() {
    setEditRecipe({
      id: crypto.randomUUID(),
      name: '', category: 'Makanan Utama',
      portionCount: 1,
      ingredients: [], addons: [],
      totalIngredientCost: 0, totalAddonCost: 0, totalHPP: 0,
      createdAt: new Date().toISOString(),
    })
    setMode('edit')
  }

  function startEdit(r: Recipe) {
    setEditRecipe({ ...r })
    setMode('edit')
  }

  function addIngredient(material: RawMaterial) {
    if (!editRecipe) return
    const exists = editRecipe.ingredients?.find(i => i.materialId === material.id)
    if (exists) { toast('Bahan sudah ada di resep', { icon: '⚠️' }); return }
    const newIng: RecipeIngredient = {
      materialId: material.id,
      materialName: material.name,
      useUnit: material.useUnit,
      qty: 100,
      costPerPortion: Math.round(100 * material.pricePerUse),
    }
    const updated = { ...editRecipe, ingredients: [...(editRecipe.ingredients || []), newIng] }
    setEditRecipe({ ...updated, ...buildRecipeTotals(updated.ingredients!, updated.addons!, opexPerPortion) })
    setMatSearch('')
    setShowMatDropdown(false)
  }

  function updateIngredientQty(materialId: string, qty: number) {
    if (!editRecipe) return
    const mat = materials.find(m => m.id === materialId)
    if (!mat) return
    const ingredients = (editRecipe.ingredients || []).map(i =>
      i.materialId === materialId
        ? { ...i, qty, costPerPortion: Math.round(qty * mat.pricePerUse) }
        : i
    )
    setEditRecipe({ ...editRecipe, ingredients, ...buildRecipeTotals(ingredients, editRecipe.addons!, opexPerPortion) })
  }

  function removeIngredient(materialId: string) {
    if (!editRecipe) return
    const ingredients = (editRecipe.ingredients || []).filter(i => i.materialId !== materialId)
    setEditRecipe({ ...editRecipe, ingredients, ...buildRecipeTotals(ingredients, editRecipe.addons!, opexPerPortion) })
  }

  function addAddon() {
    if (!addonForm.name.trim()) { toast.error('Nama add-on harus diisi'); return }
    const addon: Addon = { id: crypto.randomUUID(), name: addonForm.name, costPerPortion: parseFloat(addonForm.costPerPortion) || 0 }
    const addons = [...(editRecipe?.addons || []), addon]
    setEditRecipe({ ...editRecipe, addons, ...buildRecipeTotals(editRecipe!.ingredients!, addons, opexPerPortion) })
    setAddonForm({ name: '', costPerPortion: '' })
  }

  function removeAddon(id: string) {
    if (!editRecipe) return
    const addons = (editRecipe.addons || []).filter(a => a.id !== id)
    setEditRecipe({ ...editRecipe, addons, ...buildRecipeTotals(editRecipe.ingredients!, addons, opexPerPortion) })
  }

  function handleSave() {
    if (!editRecipe?.name?.trim()) { toast.error('Nama resep harus diisi'); return }
    if (!editRecipe.ingredients?.length) { toast.error('Tambahkan minimal 1 bahan'); return }
    onSave(editRecipe as Recipe)
    toast.success('Resep berhasil disimpan!')
    setMode('list')
    setEditRecipe(null)
  }

  const filteredMats = materials.filter(m =>
    m.name.toLowerCase().includes(matSearch.toLowerCase()) ||
    m.category.toLowerCase().includes(matSearch.toLowerCase())
  )

  // ── LIST MODE ──
  if (mode === 'list') return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[14px] font-bold text-gray-800">Pembangun Resep</div>
          <div className="text-[12px] text-gray-400">{recipes.length} resep tersimpan</div>
        </div>
        <button onClick={startNew} className="flex items-center gap-1.5 px-3 py-2 bg-[#685AFF] text-white text-[12px] font-semibold rounded-lg hover:bg-[#4A3FCC] transition-colors">
          <Plus size={14} /> Buat Resep
        </button>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ChefHat size={32} className="mx-auto mb-2 opacity-30" />
          <div className="text-[13px]">Belum ada resep. Buat resep pertama kamu!</div>
          {materials.length === 0 && <div className="text-[12px] text-amber-500 mt-2">⚠️ Tambahkan bahan baku dulu di tab "Bahan Baku"</div>}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {recipes.map(r => (
            <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-4 hover:border-[rgba(104,90,255,0.3)] transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-[13px] font-bold text-gray-800">{r.name}</div>
                  <span className="badge badge-primary text-[10px] mt-0.5">{r.category}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => onClone(r.id)} title="Duplikat" className="p-1.5 text-gray-400 hover:text-[#685AFF] hover:bg-[rgba(104,90,255,0.08)] rounded-lg transition-colors"><Copy size={12} /></button>
                  <button onClick={() => { if (confirm('Hapus resep ini?')) onDelete(r.id) }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={12} /></button>
                </div>
              </div>

              <div className="space-y-1.5 mb-3">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-400">Bahan ({r.ingredients.length} item)</span>
                  <span className="text-gray-600">{formatRupiah(r.totalIngredientCost)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-400">Add-ons ({r.addons.length} item)</span>
                  <span className="text-gray-600">{formatRupiah(r.totalAddonCost)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-400">OPEX/porsi</span>
                  <span className="text-gray-600">{formatRupiah(opexPerPortion)}</span>
                </div>
                <div className="flex justify-between text-[12px] font-bold pt-1 border-t border-gray-100">
                  <span className="text-gray-700">Total HPP</span>
                  <span className="text-[#685AFF]">{formatRupiah(r.totalHPP)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => startEdit(r)} className="flex-1 py-1.5 text-[11px] font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">Edit</button>
                <button onClick={() => onSelect(r)} className="flex-1 py-1.5 text-[11px] font-medium bg-[rgba(104,90,255,0.08)] text-[#685AFF] rounded-lg hover:bg-[rgba(104,90,255,0.15)] transition-colors">Simulasikan</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ── EDIT MODE ──
  const recipe = editRecipe!
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => { setMode('list'); setEditRecipe(null) }} className="text-gray-400 hover:text-gray-600 p-1"><X size={16} /></button>
        <div className="text-[14px] font-bold text-gray-800">{recipe.id && recipes.find(r => r.id === recipe.id) ? 'Edit Resep' : 'Buat Resep Baru'}</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Left: Form */}
        <div className="space-y-4">
          {/* Info Dasar */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="text-[12px] font-bold text-gray-600 uppercase tracking-wide mb-3">Info Resep</div>
            <div className="space-y-3">
              <div>
                <label className="label">Nama Resep *</label>
                <input value={recipe.name || ''} onChange={e => setEditRecipe({ ...recipe, name: e.target.value })} placeholder="Nasi Goreng Spesial" className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Kategori</label>
                  <select value={recipe.category} onChange={e => setEditRecipe({ ...recipe, category: e.target.value })} className="input-field">
                    {RECIPE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Jumlah Porsi</label>
                  <input type="number" min="1" value={recipe.portionCount || 1} onChange={e => setEditRecipe({ ...recipe, portionCount: parseInt(e.target.value) || 1 })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="label">Catatan (opsional)</label>
                <input value={recipe.notes || ''} onChange={e => setEditRecipe({ ...recipe, notes: e.target.value })} placeholder="Catatan khusus resep..." className="input-field" />
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[12px] font-bold text-gray-600 uppercase tracking-wide">Bahan Baku</div>
              <div className="text-[11px] text-gray-400">{recipe.ingredients?.length || 0} bahan</div>
            </div>

            {/* Search Bahan */}
            <div className="relative mb-3">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={matSearch}
                onChange={e => { setMatSearch(e.target.value); setShowMatDropdown(true) }}
                onFocus={() => setShowMatDropdown(true)}
                placeholder="Cari dan tambah bahan..."
                className="input-field pl-8"
              />
              {showMatDropdown && matSearch && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredMats.length === 0 ? (
                    <div className="px-3 py-3 text-[12px] text-gray-400 text-center">Bahan tidak ditemukan</div>
                  ) : filteredMats.map(m => (
                    <button key={m.id} onClick={() => addIngredient(m)}
                      className="w-full px-3 py-2.5 text-left hover:bg-[rgba(104,90,255,0.05)] flex items-center justify-between">
                      <div>
                        <div className="text-[12px] font-medium text-gray-800">{m.name}</div>
                        <div className="text-[10px] text-gray-400">{m.category}</div>
                      </div>
                      <div className="text-[11px] text-[#685AFF] font-semibold">{formatRupiah(m.pricePerUse)}/{m.useUnit}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ingredient list */}
            <div className="space-y-2">
              {(recipe.ingredients || []).map(ing => {
                const mat = materials.find(m => m.id === ing.materialId)
                return (
                  <div key={ing.materialId} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-gray-800 truncate">{ing.materialName}</div>
                      <div className="text-[10px] text-gray-400">{formatRupiah(mat?.pricePerUse || 0)}/{ing.useUnit}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number" min="0" value={ing.qty}
                        onChange={e => updateIngredientQty(ing.materialId, parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1 text-[12px] text-center border border-gray-200 rounded-lg focus:border-[#685AFF] focus:outline-none"
                      />
                      <span className="text-[11px] text-gray-400 w-8">{ing.useUnit}</span>
                    </div>
                    <div className="text-[12px] font-semibold text-[#685AFF] min-w-[60px] text-right">{formatRupiah(ing.costPerPortion)}</div>
                    <button onClick={() => removeIngredient(ing.materialId)} className="text-gray-300 hover:text-red-400 transition-colors"><X size={13} /></button>
                  </div>
                )
              })}
              {(recipe.ingredients || []).length === 0 && (
                <div className="text-center py-4 text-[12px] text-gray-400">Cari dan tambahkan bahan di atas</div>
              )}
            </div>
          </div>

          {/* Add-ons */}
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical size={14} className="text-[#685AFF]" />
              <div className="text-[12px] font-bold text-gray-600 uppercase tracking-wide">Packaging & Add-ons</div>
            </div>
            <div className="flex gap-2 mb-3">
              <input value={addonForm.name} onChange={e => setAddonForm(p => ({ ...p, name: e.target.value }))} placeholder="Kardus, plastik, sendok..." className="input-field flex-1" />
              <input type="number" value={addonForm.costPerPortion} onChange={e => setAddonForm(p => ({ ...p, costPerPortion: e.target.value }))} placeholder="Rp" className="input-field w-24" />
              <button onClick={addAddon} className="px-3 py-2 bg-[#685AFF] text-white rounded-lg text-[12px] font-semibold hover:bg-[#4A3FCC] transition-colors whitespace-nowrap">
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-1.5">
              {(recipe.addons || []).map(a => (
                <div key={a.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-[12px] text-gray-700">{a.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold text-gray-700">{formatRupiah(a.costPerPortion)}</span>
                    <button onClick={() => removeAddon(a.id)} className="text-gray-300 hover:text-red-400 transition-colors"><X size={12} /></button>
                  </div>
                </div>
              ))}
              {(recipe.addons || []).length === 0 && <div className="text-[11px] text-gray-400 text-center py-2">Belum ada add-on</div>}
            </div>
          </div>
        </div>

        {/* Right: Summary */}
        <div className="sticky top-4 space-y-4">
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="text-[12px] font-bold text-gray-600 uppercase tracking-wide mb-3">Ringkasan HPP</div>
            <div className="space-y-2">
              {[
                { label: 'Bahan Baku', value: recipe.totalIngredientCost || 0, color: '' },
                { label: 'Packaging / Add-ons', value: recipe.totalAddonCost || 0, color: '' },
                { label: 'OPEX per Porsi', value: opexPerPortion, color: 'text-orange-500' },
              ].map(row => (
                <div key={row.label} className="flex justify-between py-2 border-b border-gray-50 text-[12px]">
                  <span className={cn('text-gray-500', row.color)}>{row.label}</span>
                  <span className="font-semibold text-gray-700">{formatRupiah(row.value)}</span>
                </div>
              ))}
              <div className="flex justify-between p-3 bg-[rgba(104,90,255,0.06)] rounded-lg mt-1">
                <span className="text-[13px] font-bold text-[#685AFF]">Total HPP / Porsi</span>
                <span className="text-[15px] font-bold text-[#685AFF]">{formatRupiah(recipe.totalHPP || 0)}</span>
              </div>
            </div>

            {/* Ingredient breakdown */}
            {(recipe.ingredients || []).length > 0 && (
              <div className="mt-3">
                <div className="text-[11px] font-semibold text-gray-400 mb-2 uppercase">Breakdown Bahan</div>
                <div className="space-y-1">
                  {(recipe.ingredients || []).sort((a, b) => b.costPerPortion - a.costPerPortion).map(ing => {
                    const pct = recipe.totalIngredientCost > 0 ? Math.round((ing.costPerPortion / recipe.totalIngredientCost) * 100) : 0
                    return (
                      <div key={ing.materialId} className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex justify-between text-[11px] mb-0.5">
                            <span className="text-gray-600 truncate">{ing.materialName}</span>
                            <span className="text-gray-500">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full">
                            <div className="h-1.5 bg-[#685AFF] rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 w-16 text-right">{formatRupiah(ing.costPerPortion)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 bg-[#685AFF] text-white rounded-xl text-[13px] font-bold hover:bg-[#4A3FCC] transition-colors flex items-center justify-center gap-2"
          >
            <Check size={15} /> Simpan Resep
          </button>
        </div>
      </div>
    </div>
  )
}
