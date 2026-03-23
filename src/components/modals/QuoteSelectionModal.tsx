'use client'

import { X } from 'lucide-react'

interface QuoteSelectionModalProps {
  title: string
  items: string[]
  onClose: () => void
  onSelect: (value: string) => void
}

export default function QuoteSelectionModal({
  title,
  items,
  onClose,
  onSelect,
}: QuoteSelectionModalProps) {
  const handleSelect = (item: string) => {
    onSelect(item)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 font-poppins">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-gray-500 mb-4 font-poppins">
            Select an option to use as the answer
          </p>
          <div className="space-y-2">
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => handleSelect(item)}
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-700 group-hover:text-indigo-700 font-poppins">
                    {item}
                  </span>
                  <span className="text-xs text-gray-400 group-hover:text-indigo-500 font-poppins shrink-0">
                    Select
                  </span>
                </div>
              </button>
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
