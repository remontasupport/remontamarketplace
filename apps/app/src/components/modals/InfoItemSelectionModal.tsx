'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface InfoItemSelectionModalProps {
  title: string
  options: string[]
  selectedItems: string[]
  onClose: () => void
  onSelectItem: (item: string) => void
}

export default function InfoItemSelectionModal({
  title,
  options,
  selectedItems,
  onClose,
  onSelectItem,
}: InfoItemSelectionModalProps) {
  const [customItem, setCustomItem] = useState('')

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
          <h2 className="text-xl font-semibold text-gray-900 font-poppins">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Custom input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 font-poppins">
              Add Custom
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
                placeholder={`Type a custom ${title.toLowerCase()}...`}
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
            <p className="text-xs text-gray-500 mt-1 font-poppins">Press Enter to add, or click from the list below</p>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-sm text-gray-500 font-poppins">Or select from the list</span>
            </div>
          </div>

          {/* Options list */}
          <div className="space-y-2">
            {options.map((option) => {
              const alreadySelected = selectedItems.includes(option)
              return (
                <button
                  key={option}
                  onClick={() => { if (!alreadySelected) { onSelectItem(option); onClose() } }}
                  disabled={alreadySelected}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all group ${
                    alreadySelected
                      ? 'border-gray-100 bg-gray-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-indigo-500 hover:bg-indigo-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-poppins ${alreadySelected ? 'text-gray-400' : 'text-gray-700 group-hover:text-indigo-700'}`}>
                      {option}
                    </span>
                    {alreadySelected
                      ? <span className="text-xs text-gray-400 font-poppins">added</span>
                      : <span className="text-xs text-gray-400 group-hover:text-indigo-500 font-poppins">Click to add</span>
                    }
                  </div>
                </button>
              )
            })}
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
