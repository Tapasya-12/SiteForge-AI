import React from 'react'
import { X, Plus } from 'lucide-react'
import type { Page } from '../types'

interface PageSwitcherProps {
  pages: Page[]
  activePage: Page | null
  onSelectPage: (page: Page | null) => void
  onAddPage: () => void
  onDeletePage: (pageId: string) => void
  isGenerating: boolean
}

const PageSwitcher: React.FC<PageSwitcherProps> = ({
  pages,
  activePage,
  onSelectPage,
  onAddPage,
  onDeletePage,
  isGenerating
}) => {
  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center gap-1 overflow-x-auto">
      {/* Home tab - always first */}
      <button
        onClick={() => onSelectPage(null)}
        className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
          activePage === null
            ? 'bg-indigo-600 text-white'
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
        }`}
        disabled={isGenerating}
      >
        Home
      </button>

      {/* Additional pages */}
      {pages.map((page) => (
        <div key={page.id} className="flex items-center">
          <button
            onClick={() => onSelectPage(page)}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              activePage?.id === page.id
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            disabled={isGenerating}
          >
            {page.name}
          </button>
          <button
            onClick={() => onDeletePage(page.id)}
            className="ml-1 p-1 text-gray-400 hover:text-red-400 rounded-md hover:bg-gray-700 transition-colors"
            disabled={isGenerating}
            title="Delete page"
          >
            <X size={14} />
          </button>
        </div>
      ))}

      {/* Add page button */}
      <button
        onClick={onAddPage}
        className="ml-2 p-2 text-gray-400 hover:text-indigo-400 rounded-md hover:bg-gray-700 transition-colors"
        disabled={isGenerating}
        title="Add new page"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}

export default PageSwitcher