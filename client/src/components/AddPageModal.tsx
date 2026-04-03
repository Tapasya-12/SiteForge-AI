import React, { useState } from 'react'
import { X, Loader2 } from 'lucide-react'

interface AddPageModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (name: string, slug: string) => void
  isLoading: boolean
}

const AddPageModal: React.FC<AddPageModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  isLoading
}) => {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')

  const quickSelectPages = [
    { name: 'About', slug: 'about' },
    { name: 'Contact', slug: 'contact' },
    { name: 'Services', slug: 'services' },
    { name: 'Portfolio', slug: 'portfolio' },
    { name: 'Blog', slug: 'blog' },
    { name: 'Pricing', slug: 'pricing' }
  ]

  const handleQuickSelect = (pageName: string, pageSlug: string) => {
    setName(pageName)
    setSlug(pageSlug)
  }

  const handleNameChange = (value: string) => {
    setName(value)
    // Auto-generate slug from name
    const generatedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
    setSlug(generatedSlug)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && slug.trim()) {
      onAdd(name.trim(), slug.trim())
    }
  }

  const handleClose = () => {
    setName('')
    setSlug('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Add New Page</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Quick select buttons */}
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2">Quick select:</p>
            <div className="grid grid-cols-3 gap-2">
              {quickSelectPages.map((page) => (
                <button
                  key={page.slug}
                  type="button"
                  onClick={() => handleQuickSelect(page.name, page.slug)}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-md text-sm transition-colors"
                  disabled={isLoading}
                >
                  {page.name}
                </button>
              ))}
            </div>
          </div>

          {/* Name input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Page Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. About Us"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isLoading}
              required
            />
          </div>

          {/* Slug input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. about-us"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isLoading}
              required
            />
          </div>

          {/* Cost notice */}
          <p className="text-sm text-amber-400 mb-4">
            Adding a page costs 10 credits
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-md transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors flex items-center justify-center gap-2"
              disabled={isLoading || !name.trim() || !slug.trim()}
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              Generate Page
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddPageModal