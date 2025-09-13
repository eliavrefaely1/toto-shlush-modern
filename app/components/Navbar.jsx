'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Target, Star, Shield, Info } from 'lucide-react'

const links = [
  { href: '/', label: 'דף הבית', icon: Home },
  { href: '/guess', label: 'מלא טופס', icon: Target },
  { href: '/leaderboard', label: 'טבלת דירוג', icon: Star },
  { href: '/instructions', label: 'הוראות', icon: Info },
  { href: '/admin', label: 'מנהל', icon: Shield },
]

export default function Navbar() {
  const pathname = usePathname() || '/'

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        <ul className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-2">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <li key={href} className="shrink-0">
                <Link
                  href={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

