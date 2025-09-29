'use client'

import Link from 'next/link'

const TAB_LABELS = {
  matches: 'משחקים',
  participants: 'משתתפים',
  users: 'משתמשים',
  backups: 'גיבויים',
  settings: 'הגדרות'
}

export default function Breadcrumbs({ activeTab }) {
  const tabLabel = TAB_LABELS[activeTab] || ''
  return (
    <nav aria-label="breadcrumbs" className="text-sm">
      <ol className="flex items-center gap-1 text-gray-500">
        <li>
          <Link href="/" className="hover:underline text-blue-600">בית</Link>
        </li>
        <li className="mx-1">/</li>
        <li>
          <span className="text-gray-700">מנהל</span>
        </li>
        {tabLabel && (
          <>
            <li className="mx-1">/</li>
            <li>
              <span className="font-medium text-gray-800">{tabLabel}</span>
            </li>
          </>
        )}
      </ol>
    </nav>
  )
}


