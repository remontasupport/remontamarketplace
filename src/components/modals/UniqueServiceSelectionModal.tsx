'use client'

import { useState } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import { UNIQUE_SERVICE_CATEGORIES } from '@/constants/uniqueServices'

interface UniqueServiceSelectionModalProps {
  selectedItems: string[]
  onClose: () => void
  onSelectItem: (item: string) => void
}

export default function UniqueServiceSelectionModal({
  selectedItems,
  onClose,
  onSelectItem,
}: UniqueServiceSelectionModalProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    () => Object.fromEntries(UNIQUE_SERVICE_CATEGORIES.map(c => [c.id, true]))
  )
  const [customItem, setCustomItem] = useState('')

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleAddCustom = () => {
    if (customItem.trim()) {
      onSelectItem(customItem.trim())
      setCustomItem('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 font-poppins">Add Unique Service</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Custom input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 font-poppins">
              Add Custom Item
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customItem}
                onChange={(e) => setCustomItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleAddCustom() }
                  if (e.key === 'Escape') onClose()
                }}
                placeholder="Type a custom unique service..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-poppins text-sm"
                autoFocus
              />
              <button
                onClick={handleAddCustom}
                disabled={!customItem.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-poppins text-sm font-medium"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-poppins">Press Enter to add, or select from the categories below</p>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-sm text-gray-500 font-poppins">Or select from categories</span>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            {UNIQUE_SERVICE_CATEGORIES.map((category) => (
              <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-800 font-poppins">{category.title}</span>
                  {expandedCategories[category.id]
                    ? <ChevronUp className="w-4 h-4 text-gray-500" />
                    : <ChevronDown className="w-4 h-4 text-gray-500" />
                  }
                </button>
                {expandedCategories[category.id] && (
                  <div className="p-2 space-y-1">
                    {category.items.map((item) => {
                      const alreadySelected = selectedItems.includes(item)
                      return (
                        <button
                          key={item}
                          onClick={() => { if (!alreadySelected) { onSelectItem(item); onClose() } }}
                          disabled={alreadySelected}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm font-poppins transition-colors ${
                            alreadySelected
                              ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                              : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700'
                          }`}
                        >
                          {item}
                          {alreadySelected && <span className="ml-2 text-xs text-gray-400">(added)</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-poppins text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
