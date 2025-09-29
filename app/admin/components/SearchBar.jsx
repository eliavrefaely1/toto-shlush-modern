'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

export default function SearchBar({ placeholder = 'חפש משתמש/משחק…', data = [], keys = [], onSelect }) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const predicate = (item) => {
      return keys.some((k) => String(item[k] ?? '').toLowerCase().includes(q))
    }
    return data.filter(predicate).slice(0, 10)
  }, [query, data, keys])

  return (
    <div className="relative w-full max-w-lg">
      <div className="flex items-center gap-2 p-2 border rounded-lg bg-white">
        <Search className="w-4 h-4 text-gray-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 outline-none text-sm"
        />
      </div>

      {results.length > 0 && (
        <div className="absolute mt-1 w-full bg-white border rounded-lg shadow z-10 max-h-64 overflow-auto">
          {results.map((item) => {
            const label = keys.map((k) => item[k]).filter(Boolean).join(' · ')
            return (
              <button
                key={item.id || label}
                className="w-full text-right px-3 py-2 text-sm hover:bg-gray-50"
                onClick={() => onSelect?.(item)}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}


