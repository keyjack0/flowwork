'use client'

import Topbar from '@/components/layout/Topbar'
import { useState } from 'react'
import { Package, ChefHat, TrendingUp, Building2, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHPPStore } from '@/hooks/useHPPStore'
import MaterialModule from '@/components/hpp/MaterialModule'
import RecipeBuilder from '@/components/hpp/RecipeBuilder'
import OpexModule from '@/components/hpp/OpexModule'
import ProfitSimulator from '@/components/hpp/ProfitSimulator'
import { Recipe } from '@/types/hpp'
import toast from 'react-hot-toast'

type Tab = 'materials' | 'recipes' | 'opex' | 'simulator'

const TABS = [
  { id: 'materials' as Tab, label: 'Bahan Baku', icon: Package },
  { id: 'recipes' as Tab, label: 'Pembangun Resep', icon: ChefHat },
  { id: 'opex' as Tab, label: 'OPEX Bulanan', icon: Building2 },
  { id: 'simulator' as Tab, label: 'Simulator Profit', icon: TrendingUp },
]

export default function HPPPage() {
  const [activeTab, setActiveTab] = useState<Tab>('materials')
  const [simulateRecipe, setSimulateRecipe] = useState<Recipe | null>(null)
  const store = useHPPStore()

  function handleSelectRecipeForSim(recipe: Recipe) {
    setSimulateRecipe(recipe)
    setActiveTab('simulator')
  }

  if (!store.loaded) {
    return (
      <>
        <Topbar title="Kalkulator HPP" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-400 text-sm">Memuat data...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Topbar
        title="Kalkulator HPP & Bisnis"
        action={{ label: 'Export Data', onClick: () => toast('Fitur export segera hadir', { icon: '📥' }), icon: <Download size={13} /> }}
      />

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Tab Bar */}
        <div className="bg-white border-b border-gray-100 px-6 pt-4 flex-shrink-0">
          {/* Stats */}
          <div className="flex items-center gap-6 mb-4 text-[12px] text-gray-500">
            <span><strong className="text-[#685AFF]">{store.materials.length}</strong> bahan baku</span>
            <span><strong className="text-[#685AFF]">{store.recipes.length}</strong> resep</span>
            <span>OPEX/porsi: <strong className="text-orange-500">Rp {store.opex.opexPerPortion.toLocaleString('id-ID')}</strong></span>
          </div>

          <div className="flex gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-[13px] font-medium transition-all border-b-2',
                  activeTab === tab.id
                    ? 'text-[#685AFF] border-[#685AFF] bg-[rgba(104,90,255,0.04)]'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                )}
              >
                <tab.icon size={14} />
                {tab.label}
                {(tab.id === 'materials' && store.materials.length > 0) && (
                  <span className="bg-[#685AFF] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{store.materials.length}</span>
                )}
                {(tab.id === 'recipes' && store.recipes.length > 0) && (
                  <span className="bg-[#685AFF] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{store.recipes.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="fade-in">
            {activeTab === 'materials' && (
              <MaterialModule
                materials={store.materials}
                onAdd={store.addMaterial}
                onUpdate={store.updateMaterial}
                onDelete={store.deleteMaterial}
              />
            )}
            {activeTab === 'recipes' && (
              <RecipeBuilder
                materials={store.materials}
                recipes={store.recipes}
                opexPerPortion={store.opex.opexPerPortion}
                onSave={store.saveRecipe}
                onDelete={store.deleteRecipe}
                onClone={id => { store.cloneRecipe(id); toast.success('Resep berhasil diduplikat!') }}
                onSelect={handleSelectRecipeForSim}
              />
            )}
            {activeTab === 'opex' && (
              <OpexModule
                opex={store.opex}
                onAddItem={store.addOpexItem}
                onUpdateItem={store.updateOpexItem}
                onDeleteItem={store.deleteOpexItem}
                onUpdateTarget={t => store.updateOpex({ targetPortionsPerMonth: t })}
              />
            )}
            {activeTab === 'simulator' && (
              <ProfitSimulator
                recipes={store.recipes}
                opex={store.opex}
                selectedRecipe={simulateRecipe}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
